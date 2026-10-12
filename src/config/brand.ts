/**
 * The product name and voice live here and ONLY here.
 * Rename the marketplace by editing this file.
 */
export const brand = {
  name: "Kiosk",
  /** Used in titles: "Explore · Kiosk" */
  titleSeparator: " · ",
  tagline: "The campus marketplace",
  description:
    "Buy from student-run brands on your campus. Thrift, food, skincare, prints and more, delivered to your hostel or ready for pickup.",
  shortDescription: "Buy from student brands on your campus.",
  /** Prefix for order codes, e.g. KSK-7F2Q */
  orderPrefix: "KSK",
  sellerProductName: "Shop Studio",
  supportEmail: "hello@kiosk.example",
  social: { twitter: "@kioskcampus" },
  locale: "en-NG",
  currency: "NGN",
} as const;

export type Brand = typeof brand;
