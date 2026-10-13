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
  /** Which badge to show next to the item, if any. */
  badge?: "notifications" | "messages" | "bag" | "activeOrders" | "newOrders" | "shopMessages";
  match?: (path: string) => boolean;
};

export type NavSection = { title?: string; items: NavItem[] };

const startsWith =
  (...prefixes: string[]) =>
  (p: string) =>
    prefixes.some((x) => p === x || p.startsWith(`${x}/`) || p.startsWith(`${x}?`));

/* --------------------------------- Market --------------------------------- */

export const marketNav: NavSection[] = [
  {
    items: [
      { href: "/home", label: "Home", icon: LayoutGrid, match: startsWith("/home") },
      {
        href: "/explore",
        label: "Discover",
        icon: Compass,
        match: startsWith("/explore", "/search", "/brands", "/products"),
      },
      {
        href: "/notifications",
        label: "Notifications",
        icon: Bell,
        badge: "notifications",
        match: startsWith("/notifications"),
      },
      {
        href: "/orders",
        label: "Orders",
        icon: Receipt,
        badge: "activeOrders",
        match: startsWith("/orders"),
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
        badge: "bag",
        match: startsWith("/bag", "/checkout"),
      },
      { href: "/wishlist", label: "Saved", icon: Heart, match: startsWith("/wishlist") },
      { href: "/account/following", label: "Following", icon: Store },
      {
        href: "/messages",
        label: "Messages",
        icon: MessageCircle,
        badge: "messages",
        match: startsWith("/messages"),
      },
    ],
  },
  {
    title: "Account",
    items: [
      { href: "/account/places", label: "Addresses", icon: MapPin },
      { href: "/account/reviews", label: "My reviews", icon: Star },
      { href: "/account/settings", label: "Settings", icon: Settings },
    ],
  },
];

/** Bottom bar on phones while buying. */
export const marketTabs: NavItem[] = [
  { href: "/home", label: "Home", icon: LayoutGrid, match: startsWith("/home") },
  {
    href: "/explore",
    label: "Discover",
    icon: Compass,
    match: startsWith("/explore", "/search", "/brands", "/products"),
  },
  {
    href: "/orders",
    label: "Orders",
    icon: Receipt,
    badge: "activeOrders",
    match: startsWith("/orders"),
  },
  {
    href: "/bag",
    label: "Bag",
    icon: ShoppingBag,
    badge: "bag",
    match: startsWith("/bag", "/checkout"),
  },
];

/* ---------------------------------- Shop ---------------------------------- */

export const shopNav: NavSection[] = [
  {
    items: [
      { href: "/studio", label: "Performance", icon: Gauge, match: (p) => p === "/studio" },
      { href: "/studio/analytics", label: "Analytics", icon: BarChart3 },
      {
        href: "/notifications",
        label: "Notifications",
        icon: Bell,
        badge: "notifications",
        match: startsWith("/notifications"),
      },
      { href: "/studio/orders", label: "Orders", icon: Receipt, badge: "newOrders" },
    ],
  },
  {
    title: "Product",
    items: [
      { href: "/studio/products", label: "All products", icon: Package },
      { href: "/studio/promotions", label: "Promotions", icon: Tag },
      { href: "/studio/reviews", label: "Reviews", icon: Star },
    ],
  },
  {
    title: "My store",
    items: [
      { href: "/studio/finance", label: "Finance", icon: Wallet },
      { href: "/studio/customers", label: "Customers", icon: Users },
      { href: "/studio/messages", label: "Inbox", icon: MessageCircle, badge: "shopMessages" },
      { href: "/studio/brand", label: "Shop settings", icon: Settings },
    ],
  },
];

export const shopTabs: NavItem[] = [
  { href: "/studio", label: "Performance", icon: Gauge, match: (p) => p === "/studio" },
  { href: "/studio/orders", label: "Orders", icon: Receipt, badge: "newOrders" },
  { href: "/studio/products", label: "Products", icon: Package },
  { href: "/studio/messages", label: "Inbox", icon: MessageCircle, badge: "shopMessages" },
];

export function isActive(item: NavItem, path: string) {
  return item.match ? item.match(path) : path === item.href || path.startsWith(`${item.href}/`);
}
