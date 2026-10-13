import { formatNaira } from "@/domain/money";
import type { Brand, Campus } from "@/services/types";

export type QuickReply = {
  id: string;
  label: string;
  /** Tile colour, from the chart palette. */
  tone: string;
  /** One or more drafts; "Try another" cycles through them. */
  drafts: string[];
};

const DAYS = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];

function hours(b: Brand) {
  const d = b.openHours.days;
  const days =
    d.length === 7
      ? "every day"
      : d.length === 5 && [1, 2, 3, 4, 5].every((x) => d.includes(x))
        ? "Monday to Friday"
        : d.map((x) => DAYS[x]).join(", ");
  return `${days}, ${b.openHours.opens} to ${b.openHours.closes}`;
}

function pickupNames(b: Brand, campus: Campus | undefined) {
  const names = b.fulfilment.pickupPointIds
    .map((id) => campus?.pickupPoints.find((p) => p.id === id)?.name)
    .filter(Boolean);
  return names.length ? names.join(" or ") : "a spot we agree on";
}

/** Replies a shop sends often, filled in from its real settings. */
export function shopReplies(b: Brand, campus: Campus | undefined, buyer: string): QuickReply[] {
  const first = buyer.split(" ")[0] ?? buyer;
  const fee = b.fulfilment.deliveryFeeKobo ? formatNaira(b.fulfilment.deliveryFeeKobo) : "free";
  return [
    {
      id: "available",
      label: "It's available",
      tone: "var(--chart-violet)",
      drafts: [
        `Hi ${first}! Yes, it's available. You can order it straight from our page and we'll confirm quickly.`,
        `Hey ${first}, it's in stock right now. Order whenever you're ready and I'll get it sorted.`,
      ],
    },
    {
      id: "delivery",
      label: "Delivery details",
      tone: "var(--chart-pink)",
      drafts: b.fulfilment.delivery
        ? [
            `We deliver on campus. Delivery is ${fee} and it usually takes about ${b.fulfilment.prepMinutes} minutes after we accept your order.`,
            `Yes, we can bring it to you. Delivery costs ${fee}. Just add your room or landmark at checkout.`,
          ]
        : [`We don't deliver at the moment, but you can pick up from ${pickupNames(b, campus)}.`],
    },
    {
      id: "pickup",
      label: "Pickup times",
      tone: "var(--chart-orange)",
      drafts: [
        `You can pick up from ${pickupNames(b, campus)}. We're open ${hours(b)}.`,
        `Pickup works ${hours(b)} at ${pickupNames(b, campus)}. I'll message you when it's ready.`,
      ],
    },
    {
      id: "payment",
      label: "Price and payment",
      tone: "var(--chart-green)",
      drafts: [
        "The price on the page is the final price. You pay when you get your order, cash or transfer is fine.",
        "No payment upfront. Pay on delivery or when you pick it up.",
      ],
    },
    {
      id: "update",
      label: "Order update",
      tone: "var(--chart-blue)",
      drafts: [
        `Thanks for your order, ${first}! We're preparing it now and you'll see each step on your order page.`,
        `Quick update: your order is on its way. You can follow it live on your order page.`,
      ],
    },
    {
      id: "thanks",
      label: "Say thank you",
      tone: "var(--chart-mint)",
      drafts: [
        `Thank you, ${first}! Hope you love it. A quick rating on your order really helps us.`,
        `Thanks for buying from ${b.name}! Follow us to see new drops first.`,
      ],
    },
  ];
}

/** Questions buyers ask often. */
export function buyerReplies(b: Brand | undefined): QuickReply[] {
  const shop = b?.name ?? "there";
  return [
    {
      id: "available",
      label: "Is it available?",
      tone: "var(--chart-violet)",
      drafts: [`Hi ${shop}! Is this still available?`, "Hello, do you still have this in stock?"],
    },
    {
      id: "delivery",
      label: "Delivery to my hall",
      tone: "var(--chart-pink)",
      drafts: [
        "Hi, can you deliver to my hall? How long does it take?",
        "Do you deliver today? I'm on campus.",
      ],
    },
    {
      id: "pickup",
      label: "Pickup times",
      tone: "var(--chart-orange)",
      drafts: ["When can I pick up, and where exactly?", "What time is pickup today?"],
    },
    {
      id: "custom",
      label: "Custom order",
      tone: "var(--chart-green)",
      drafts: [
        "Hi! Can you do a custom order? I'd like a different size or colour.",
        "Do you take custom orders? What would it cost?",
      ],
    },
    {
      id: "status",
      label: "Order status",
      tone: "var(--chart-blue)",
      drafts: ["Hi, any update on my order?", "Just checking, is my order ready yet?"],
    },
    {
      id: "thanks",
      label: "Say thanks",
      tone: "var(--chart-mint)",
      drafts: ["Got it, thank you so much!", "Received, thanks! Really happy with it."],
    },
  ];
}
