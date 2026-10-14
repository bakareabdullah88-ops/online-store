import {
  BarChart3,
  Bell,
  Compass,
  Gauge,
  Heart,
  LayoutGrid,
  MapPin,
  MessageCircle,
  Package,
  Receipt,
  Settings,
  ShoppingBag,
  Star,
  Store,
  Tag,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Colour of the item's icon tile (a CSS colour or variable). */
  tone: string;
  /** Which badge to show next to the item, if any. */
  badge?: "notifications" | "messages" | "bag" | "activeOrders" | "newOrders" | "shopMessages";
  match?: (path: string) => boolean;
  /** Shown as a pill in the top bar; the rest live under "More". */
  primary?: boolean;
};

export type NavSection = { title?: string; items: NavItem[] };

const startsWith =
  (...prefixes: string[]) =>
  (p: string) =>
    prefixes.some((x) => p === x || p.startsWith(`${x}/`) || p.startsWith(`${x}?`));

const T = {
  blue: "var(--chart-blue)",
  violet: "var(--chart-violet)",
  green: "var(--chart-green)",
  pink: "var(--chart-pink)",
  orange: "var(--chart-orange)",
  sky: "#0ea5e9",
  amber: "#f59e0b",
  teal: "#14b8a6",
  rose: "#f43f5e",
  slate: "#64748b",
  indigo: "#6366f1",
};

/* --------------------------------- Market --------------------------------- */

export const marketNav: NavSection[] = [
  {
    items: [
      {
        href: "/home",
        label: "Home",
        icon: LayoutGrid,
        tone: T.blue,
        primary: true,
        match: startsWith("/home"),
      },
      {
        href: "/explore",
        label: "Discover",
        icon: Compass,
        tone: T.violet,
        primary: true,
        match: startsWith("/explore", "/search", "/brands", "/products"),
      },
      {
        href: "/orders",
        label: "Orders",
        icon: Receipt,
        tone: T.orange,
        primary: true,
        badge: "activeOrders",
        match: startsWith("/orders"),
      },
      {
        href: "/messages",
        label: "Messages",
        icon: MessageCircle,
        tone: T.teal,
        primary: true,
        badge: "messages",
        match: startsWith("/messages"),
      },
      {
        href: "/wishlist",
        label: "Saved",
        icon: Heart,
        tone: T.pink,
        primary: true,
        match: startsWith("/wishlist"),
      },
    ],
  },
  {
    title: "Shopping",
    items: [
      {
        href: "/bag",
        label: "Bag",
        icon: ShoppingBag,
        tone: T.indigo,
        badge: "bag",
        match: startsWith("/bag", "/checkout"),
      },
      { href: "/account/following", label: "Following", icon: Store, tone: T.green },
      {
        href: "/notifications",
        label: "Notifications",
        icon: Bell,
        tone: T.amber,
        badge: "notifications",
        match: startsWith("/notifications"),
      },
    ],
  },
  {
    title: "Account",
    items: [
      { href: "/account/places", label: "Addresses", icon: MapPin, tone: T.rose },
      { href: "/account/reviews", label: "My reviews", icon: Star, tone: T.amber },
      { href: "/account/settings", label: "Settings", icon: Settings, tone: T.slate },
    ],
  },
];

/** Bottom bar on phones while buying. */
export const marketTabs: NavItem[] = marketNav[0]!.items
  .filter((i) => i.href !== "/wishlist")
  .concat(marketNav[1]!.items.filter((i) => i.href === "/bag"))
  .filter((i) => i.href !== "/messages");

/* ---------------------------------- Shop ---------------------------------- */

export const shopNav: NavSection[] = [
  {
    items: [
      {
        href: "/studio",
        label: "Performance",
        icon: Gauge,
        tone: T.blue,
        primary: true,
        match: (p) => p === "/studio",
      },
      {
        href: "/studio/analytics",
        label: "Analytics",
        icon: BarChart3,
        tone: T.violet,
        primary: true,
      },
      {
        href: "/studio/orders",
        label: "Orders",
        icon: Receipt,
        tone: T.orange,
        primary: true,
        badge: "newOrders",
      },
      { href: "/studio/products", label: "Products", icon: Package, tone: T.green, primary: true },
      {
        href: "/studio/messages",
        label: "Inbox",
        icon: MessageCircle,
        tone: T.teal,
        primary: true,
        badge: "shopMessages",
      },
      { href: "/studio/customers", label: "Customers", icon: Users, tone: T.pink, primary: true },
    ],
  },
  {
    title: "Grow",
    items: [
      { href: "/studio/promotions", label: "Promotions", icon: Tag, tone: T.rose },
      { href: "/studio/reviews", label: "Reviews", icon: Star, tone: T.amber },
      {
        href: "/notifications",
        label: "Notifications",
        icon: Bell,
        tone: T.amber,
        badge: "notifications",
        match: startsWith("/notifications"),
      },
    ],
  },
  {
    title: "My store",
    items: [
      { href: "/studio/finance", label: "Finance", icon: Wallet, tone: T.indigo },
      { href: "/studio/brand", label: "Shop settings", icon: Settings, tone: T.slate },
    ],
  },
];

export const shopTabs: NavItem[] = [
  shopNav[0]!.items[0]!,
  shopNav[0]!.items[2]!,
  shopNav[0]!.items[3]!,
  shopNav[0]!.items[4]!,
];

export function isActive(item: NavItem, path: string) {
  return item.match ? item.match(path) : path === item.href || path.startsWith(`${item.href}/`);
}
