/**
 * The product name and voice live here and ONLY here.
 * Rename the marketplace by editing this file.
 */
export const brand = {
  name: "Kamplug",
  /** Used in titles: "Explore · Kamplug" */
  titleSeparator: " · ",
  tagline: "Your campus plug",
  description:
    "Buy from student-run brands on your campus. Thrift, food, skincare, prints and more, delivered to your hostel or ready for pickup.",
  shortDescription: "Buy from student brands on your campus.",
  /** Prefix for order codes, e.g. KMP-7F2Q */
  orderPrefix: "KMP",
  sellerProductName: "Shop Studio",
  locale: "en-NG",
  currency: "NGN",
} as const;

export type Brand = typeof brand;

/**
 * For now Kamplug runs at one school. Campus pickers, places and search only
 * offer this campus; the others stay in the data for later.
 */
export const focusCampusId = "c_unilag";
