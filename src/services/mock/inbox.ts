import { newId } from "@/lib/ids";
import type { MessageService, NotificationService, PlacesService } from "../contracts";
import { ServiceError } from "../errors";
import { schemas } from "./schemas";
import type { Thread } from "../types";
import { commit, getDb } from "./db";
import { clone, requireUser } from "./context";
import { latency, quick } from "./latency";
import { pushNotification } from "./notify";

export const mockNotifications: NotificationService = {
  async list() {
    await latency(0.6);
    const db = await getDb();
    const user = await requireUser(db);
    return clone(
      db.notifications
        .filter((n) => n.userId === user.id)
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    );
  },
  async markRead(id) {
    await quick();
    const db = await getDb();
    const user = await requireUser(db);
    const n = db.notifications.find((x) => x.id === id && x.userId === user.id);
    if (n) n.read = true;
    await commit("notifications");
  },
  async markAllRead() {
    await quick();
    const db = await getDb();
    const user = await requireUser(db);
    for (const n of db.notifications) if (n.userId === user.id) n.read = true;
    await commit("notifications");
  },
};

function canSee(thread: Thread, userId: string, brandIds: string[], as: "buyer" | "brand") {
  return as === "buyer" ? thread.buyerId === userId : brandIds.includes(thread.brandId);
}

export const mockMessages: MessageService = {
  async listThreads(as) {
    await latency(0.7);
    const db = await getDb();
    const user = await requireUser(db);
    return clone(
      db.threads
        .filter((t) => canSee(t, user.id, user.brandIds, as))
        .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)),
    );
  },

  async getThread(id, as) {
    await latency(0.5);
    const db = await getDb();
    const user = await requireUser(db);
    const t = db.threads.find((x) => x.id === id);
    if (!t || !canSee(t, user.id, user.brandIds, as))
      throw new ServiceError("NOT_FOUND", "Conversation not found.");
    if (as === "buyer") t.unreadForBuyer = 0;
    else t.unreadForBrand = 0;
    await commit("threads");
    return clone(t);
  },

  async startThread({ brandId, productId }) {
    await quick();
    const db = await getDb();
    const user = await requireUser(db);
    if (user.brandIds.includes(brandId))
      throw new ServiceError("FORBIDDEN", "You can't message your own shop.");
    const brand = db.brands.find((b) => b.id === brandId);
    if (!brand) throw new ServiceError("NOT_FOUND", "Brand not found.");
    let t = db.threads.find((x) => x.buyerId === user.id && x.brandId === brandId);
    if (!t) {
      t = {
        id: newId("th"),
        buyerId: user.id,
        buyerName: user.name,
        brandId,
        brandName: brand.name,
        brandHandle: brand.handle,
        brandLogo: clone(brand.logo),
        ...(productId ? { productId } : {}),
        messages: [],
        updatedAt: new Date().toISOString(),
        unreadForBuyer: 0,
        unreadForBrand: 0,
      };
      db.threads.push(t);
      await commit("threads");
    }
    return clone(t);
  },

  async send({ threadId, body, as }) {
    const { messageSchema } = await schemas();
    const { body: text } = messageSchema.parse({ body });
    await quick();
    const db = await getDb();
    const user = await requireUser(db);
    const t = db.threads.find((x) => x.id === threadId);
    if (!t || !canSee(t, user.id, user.brandIds, as))
      throw new ServiceError("NOT_FOUND", "Conversation not found.");
    const at = new Date().toISOString();
    t.messages.push({ id: newId("m"), from: as, body: text, at });
    t.updatedAt = at;
    if (as === "buyer") t.unreadForBrand += 1;
    else t.unreadForBuyer += 1;

    const brand = db.brands.find((b) => b.id === t.brandId);
    const owner = brand ? db.users.find((u) => u.id === brand.ownerId) : undefined;
    // BACKEND-SEAM: realtime messaging (websocket / push) delivers this instantly.
    if (as === "buyer" && owner) {
      pushNotification(db, {
        userId: owner.id,
        kind: "message",
        title: `Message from ${t.buyerName}`,
        body: text.slice(0, 90),
        href: "/studio/messages",
      });
    }
    if (as === "brand") {
      pushNotification(db, {
        userId: t.buyerId,
        kind: "message",
        title: `${t.brandName} replied`,
        body: text.slice(0, 90),
        href: `/messages?thread=${t.id}`,
      });
    }
    await commit("threads", "notifications");
    return clone(t);
  },
};

export const mockPlaces: PlacesService = {
  async list() {
    await latency(0.6);
    const db = await getDb();
    const user = await requireUser(db);
    return clone(db.places.filter((p) => p.userId === user.id));
  },
  async save(raw) {
    const { placeSchema } = await schemas();
    const input = placeSchema.parse(raw);
    await latency(0.6);
    const db = await getDb();
    const user = await requireUser(db);
    const campus = db.campuses.find((c) => c.id === input.campusId);
    if (!campus?.zones.some((z) => z.id === input.zoneId))
      throw new ServiceError("VALIDATION", "Choose a zone on that campus.");
    const mine = db.places.filter((p) => p.userId === user.id);
    const isDefault = input.isDefault || mine.length === 0;
    if (isDefault) for (const p of mine) p.isDefault = false;
    let place = input.id
      ? db.places.find((p) => p.id === input.id && p.userId === user.id)
      : undefined;
    if (place) {
      Object.assign(place, { ...input, isDefault });
      if (!input.pickupPointId) delete place.pickupPointId;
    } else {
      place = {
        id: newId("pl"),
        userId: user.id,
        label: input.label,
        campusId: input.campusId,
        zoneId: input.zoneId,
        ...(input.pickupPointId ? { pickupPointId: input.pickupPointId } : {}),
        addressLine: input.addressLine,
        isDefault,
      };
      db.places.push(place);
    }
    await commit("places");
    return clone(place);
  },
  async remove(id) {
    await quick();
    const db = await getDb();
    const user = await requireUser(db);
    const removed = db.places.find((p) => p.id === id && p.userId === user.id);
    db.places = db.places.filter((p) => !(p.id === id && p.userId === user.id));
    if (removed?.isDefault) {
      const next = db.places.find((p) => p.userId === user.id);
      if (next) next.isDefault = true;
    }
    await commit("places");
  },
};
