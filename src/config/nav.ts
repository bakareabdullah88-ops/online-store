import {
  BarChart3,
  Bell,
  CircleDollarSign,
  Heart,
  Home,
  LayoutGrid,
  MapPin,
  MessageCircle,
  Package,
  Palette,
  Receipt,
  Search,
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
  match?: (path: string) => boolean;
};

export const marketTabs: NavItem[] = [
  { href: "/", label: "Home", icon: Home, match: (p) => p === "/" },
  {
    href: "/explore",
    label: "Explore",
    icon: Search,
    match: (p) =>
      p.startsWith("/explore") ||
      p.startsWith("/search") ||
      p.startsWith("/brands") ||
      p.startsWith("/products"),
  },
  {
    href: "/bag",
    label: "Bag",
    icon: ShoppingBag,
    match: (p) => p.startsWith("/bag") || p.startsWith("/checkout"),
  },
  { href: "/orders", label: "Orders", icon: Receipt, match: (p) => p.startsWith("/orders") },
];

export const accountNav: NavItem[] = [
  { href: "/account", label: "Overview", icon: LayoutGrid, match: (p) => p === "/account" },
  { href: "/orders", label: "Orders", icon: Receipt, match: (p) => p.startsWith("/orders") },
  { href: "/wishlist", label: "Saved", icon: Heart, match: (p) => p.startsWith("/wishlist") },
  { href: "/account/following", label: "Following", icon: Store },
  { href: "/account/places", label: "Addresses & pickup", icon: MapPin },
  { href: "/account/wallet", label: "Wallet", icon: Wallet },
  {
    href: "/messages",
    label: "Messages",
    icon: MessageCircle,
    match: (p) => p.startsWith("/messages"),
  },
  {
    href: "/notifications",
    label: "Notifications",
    icon: Bell,
    match: (p) => p.startsWith("/notifications"),
  },
  { href: "/account/reviews", label: "My reviews", icon: Star },
  { href: "/account/settings", label: "Settings", icon: Settings },
];

export const studioNav: NavItem[] = [
  { href: "/studio", label: "Overview", icon: LayoutGrid, match: (p) => p === "/studio" },
  { href: "/studio/orders", label: "Orders", icon: Receipt },
  { href: "/studio/products", label: "Products", icon: Package },
  { href: "/studio/customers", label: "Customers", icon: Users },
  { href: "/studio/reviews", label: "Reviews", icon: Star },
  { href: "/studio/promotions", label: "Promotions", icon: Tag },
  { href: "/studio/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/studio/messages", label: "Messages", icon: MessageCircle },
  { href: "/studio/brand", label: "Brand", icon: Palette },
  { href: "/studio/payouts", label: "Payouts", icon: CircleDollarSign },
];

/** Bottom tabs in Studio on phones (the rest live in "More"). */
export const studioTabs: NavItem[] = [
  { href: "/studio", label: "Overview", icon: LayoutGrid, match: (p) => p === "/studio" },
  { href: "/studio/orders", label: "Orders", icon: Receipt },
  { href: "/studio/products", label: "Products", icon: Package },
  { href: "/studio/analytics", label: "Analytics", icon: BarChart3 },
];

export function isActive(item: NavItem, path: string) {
  return item.match ? item.match(path) : path === item.href || path.startsWith(`${item.href}/`);
}
