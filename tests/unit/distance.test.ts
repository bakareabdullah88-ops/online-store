import { beforeEach, describe, expect, it } from "vitest";
import { zonePoints } from "@/config/campus-map";
import {
  arrivalMinutes,
  compareNearness,
  formatEta,
  formatMetres,
  formatWhen,
  nearness,
  shopZoneId,
  walkMetres,
} from "@/domain/distance";
import { mockServices as s } from "@/services/mock";
import { __resetMemory, resetDb } from "@/services/mock/db";
import { seedCampuses } from "@/services/mock/seed/campuses";

const unilag = seedCampuses().find((c) => c.id === "c_unilag")!;
// Zone ids (see seed/campuses): z1 Moremi, z2 Jaja, z4 Engineering, z5 Arts, z16 Queen Amina.
const MOREMI = "unilag-z1";
const JAJA = "unilag-z2";
const ENGINEERING = "unilag-z4";
const AMINA = "unilag-z16";

describe("distance", () => {
  it("has a point on the map for every UNILAG spot", () => {
    for (const z of unilag.zones)
      if (z.kind !== "offcampus") expect(zonePoints[z.id], z.name).toBeTruthy();
  });

  it("measures walks between spots and rounds them", () => {
    expect(walkMetres(MOREMI, MOREMI)).toBe(0);
    const near = walkMetres(MOREMI, JAJA)!;
    const far = walkMetres(MOREMI, AMINA)!;
    expect(near % 50).toBe(0);
    expect(near).toBeGreaterThan(0);
    expect(far).toBeGreaterThan(near);
    // Same both ways; unknown spots give no number instead of a guess.
    expect(walkMetres(JAJA, MOREMI)).toBe(near);
    expect(walkMetres(MOREMI, "nowhere")).toBeNull();
    expect(walkMetres(MOREMI, "__proto__")).toBeNull();
    expect(walkMetres(null, MOREMI)).toBeNull();
  });

  it("places a shop at its chosen spot, else at its first pickup point", () => {
    expect(shopZoneId({ baseZoneId: JAJA, pickupPointIds: ["unilag-pp1"] }, unilag)).toBe(JAJA);
    // unilag-pp1 is the Arts car park kiosk (zone 5).
    expect(shopZoneId({ pickupPointIds: ["unilag-pp1"] }, unilag)).toBe("unilag-z5");
    expect(shopZoneId({ pickupPointIds: [] }, unilag)).toBeNull();
  });

  it("puts your faculty first, then your hall, then the closest", () => {
    const buyer = { zoneId: MOREMI, hallZoneId: MOREMI, facultyZoneId: ENGINEERING };
    const faculty = nearness({ baseZoneId: ENGINEERING }, unilag, buyer);
    const hall = nearness({ baseZoneId: MOREMI }, unilag, buyer);
    const close = nearness({ baseZoneId: JAJA }, unilag, buyer);
    const far = nearness({ baseZoneId: AMINA }, unilag, buyer);
    const unknown = nearness({}, unilag, buyer);
    expect(faculty.relation).toBe("same_faculty");
    expect(hall.relation).toBe("same_hostel");
    expect(close.relation).toBeNull();
    const sorted = [unknown, far, close, hall, faculty].sort(compareNearness);
    expect(sorted).toEqual([faculty, hall, close, far, unknown]);
    expect(close.walking).toBe(true);
    expect(far.walking).toBe(false);
  });

  it("doesn't pretend off-campus spots are next door", () => {
    const OFF = "unilag-z7";
    const n = nearness({ baseZoneId: OFF }, unilag, { zoneId: OFF });
    expect(n.metres).toBeNull();
    expect(n.relation).toBeNull();
    expect(n.walking).toBe(false);
  });

  it("estimates arrival as prep plus the walk", () => {
    const n = nearness({ baseZoneId: JAJA }, unilag, { zoneId: MOREMI });
    expect(arrivalMinutes({ prepMinutes: 30, delivery: true }, n)).toBe(30 + n.walkMin!);
    expect(
      arrivalMinutes({ prepMinutes: 30, delivery: true }, nearness({}, unilag, {})),
    ).toBeNull();
  });

  it("formats distances and times the way people say them", () => {
    expect(formatMetres(0)).toBe("Right here");
    expect(formatMetres(650)).toBe("650 m");
    expect(formatMetres(1450)).toBe("1.4 km");
    expect(formatEta(25)).toBe("25 min");
    expect(formatEta(60)).toBe("1 h");
    expect(formatEta(95)).toBe("1 h 35 min");
    expect(formatEta(118)).toBe("2 h");
    expect(formatEta(1440 + 8)).toBe("Next day");
    expect(formatEta(72 * 60)).toBe("3 days");
    expect(formatWhen(1440)).toBe("by the next day");
    expect(formatWhen(25)).toBe("in about 25 min");
  });
});

describe("nearest-first listings", () => {
  beforeEach(async () => {
    __resetMemory();
    await resetDb();
  });

  async function shop(handle: string, email: string, baseZoneId: string) {
    await s.auth.signUp({ name: "Seller Person", email, password: "campus123" });
    await s.auth.updateProfile({
      name: "Seller Person",
      campusId: "c_unilag",
      phone: "08031234567",
    });
    const brand = await s.studio.createBrand({
      name: handle,
      handle,
      category: "food",
      tagline: "Good food here",
      fulfilment: {
        pickup: true,
        delivery: false,
        deliveryFeeKobo: 0,
        prepMinutes: 30,
        pickupPointIds: ["unilag-pp1"],
        zoneIds: [],
        baseZoneId,
      },
    });
    await s.studio.createProduct({
      name: `${handle} meal`,
      description: "A plate of something good.",
      category: "food",
      priceKobo: 150_000,
      options: [],
      variants: [{ key: "default", stock: 5, priceDeltaKobo: 0 }],
      status: "published",
    });
    await s.auth.signOut();
    return brand;
  }

  it("sorts by distance, puts the buyer's faculty first and filters to walking distance", async () => {
    const far = await shop("farshop", "far@shop.com", AMINA);
    const close = await shop("closeshop", "close@shop.com", JAJA);
    const fac = await shop("facshop", "fac@shop.com", ENGINEERING);
    expect(far.fulfilment.baseZoneId).toBe(AMINA);

    const near = { zoneId: MOREMI, facultyZoneId: ENGINEERING };
    const page = await s.catalog.getProducts({ sort: "nearest", near });
    expect(page.items.map((p) => p.brandId)).toEqual([fac.id, close.id, far.id]);
    // The list rows carry where the shop is, so the app can label distance.
    expect(page.items[0]!.brand.fulfilment?.baseZoneId).toBe(ENGINEERING);

    const walking = await s.catalog.getProducts({ sort: "nearest", near, walking: true });
    expect(walking.items.map((p) => p.brandId)).not.toContain(far.id);
    // Without knowing where the buyer is, the walking filter changes nothing.
    const unknown = await s.catalog.getProducts({ walking: true });
    expect(unknown.total).toBe(3);
  });

  it("ignores spots that aren't on the shop's campus", async () => {
    const b = await shop("oddshop", "odd@shop.com", "ui-z1");
    expect(b.fulfilment.baseZoneId).toBeUndefined();
  });

  it("saves a buyer's hall and faculty, and only real ones", async () => {
    await s.auth.signUp({ name: "Bisi Ade", email: "bisi@example.com", password: "campus123" });
    const base = { name: "Bisi Ade", campusId: "c_unilag", phone: "08030000000" };
    let u = await s.auth.updateProfile({ ...base, hallZoneId: MOREMI, facultyZoneId: ENGINEERING });
    expect(u.hallZoneId).toBe(MOREMI);
    expect(u.facultyZoneId).toBe(ENGINEERING);
    // Leaving them out keeps them; null clears.
    u = await s.auth.updateProfile(base);
    expect(u.hallZoneId).toBe(MOREMI);
    u = await s.auth.updateProfile({ ...base, hallZoneId: null });
    expect(u.hallZoneId).toBeNull();
    // A faculty isn't a hall.
    await expect(s.auth.updateProfile({ ...base, hallZoneId: ENGINEERING })).rejects.toBeTruthy();
  });
});
