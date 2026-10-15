/**
 * Zod schemas for every service input. Shared by forms (React Hook Form) and
 * the service layer, so validation rules exist exactly once.
 */
import { z } from "zod";

const nigerianPhone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, ""))
  .refine(
    (v) => /^(\+234|0)[789][01]\d{8}$/.test(v),
    "Enter a Nigerian number, e.g. 0803 123 4567",
  );

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address"));

export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(72, "Keep it under 72 characters")
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), "Mix letters and at least one number");

export const signUpSchema = z.object({
  name: z.string().trim().min(2, "Tell us your name").max(60),
  email: emailSchema,
  password: passwordSchema,
});
export type SignUpInput = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password"),
});
export type SignInInput = z.infer<typeof signInSchema>;

export const resetSchema = z.object({ email: emailSchema });
export type ResetInput = z.infer<typeof resetSchema>;

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Tell us your name").max(60),
  campusId: z.string().min(1, "Pick your campus"),
  phone: nigerianPhone,
  avatarImageId: z.string().optional(),
});
export type ProfileInput = z.input<typeof profileSchema>;

export const handleSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "At least 3 characters")
  .max(24, "24 characters max")
  .regex(/^[a-z0-9](?:[a-z0-9._]*[a-z0-9])?$/, "Letters, numbers, dots and underscores only");

const fulfilmentSchema = z
  .object({
    pickup: z.boolean(),
    delivery: z.boolean(),
    deliveryFeeKobo: z.number().int().min(0).max(500_000),
    prepMinutes: z
      .number()
      .int()
      .min(5)
      .max(72 * 60),
    pickupPointIds: z.array(z.string()),
    zoneIds: z.array(z.string()),
  })
  .refine((f) => f.pickup || f.delivery, {
    message: "Offer pickup, delivery or both",
    path: ["pickup"],
  })
  .refine((f) => !f.pickup || f.pickupPointIds.length > 0, {
    message: "Choose at least one pickup point",
    path: ["pickupPointIds"],
  })
  .refine((f) => !f.delivery || f.zoneIds.length > 0, {
    message: "Choose at least one zone you deliver to",
    path: ["zoneIds"],
  });

export const createBrandSchema = z.object({
  name: z.string().trim().min(2, "Give your brand a name").max(40),
  handle: handleSchema,
  category: z.enum(
    ["fashion", "thrift", "food", "beauty", "accessories", "print", "tech", "books"],
    {
      message: "Pick a category",
    },
  ),
  tagline: z.string().trim().min(4, "A short line about what you sell").max(80),
  bio: z.string().trim().max(400).default(""),
  logoImageId: z.string().optional(),
  coverImageId: z.string().optional(),
  fulfilment: fulfilmentSchema,
});
export type CreateBrandInput = z.input<typeof createBrandSchema>;

export const updateBrandSchema = createBrandSchema
  .omit({ handle: true })
  .partial()
  .extend({
    // Without this the create schema's default("") would blank the bio on every update.
    bio: z.string().trim().max(400).optional(),
    vacation: z.boolean().optional(),
    openHours: z
      .object({
        days: z.array(z.number().int().min(0).max(6)).min(1, "Open at least one day"),
        opens: z.string().regex(/^\d{2}:\d{2}$/),
        closes: z.string().regex(/^\d{2}:\d{2}$/),
      })
      .optional(),
    payoutAccount: z
      .object({
        bankName: z.string().min(2),
        accountNumber: z.string().regex(/^\d{10}$/, "10-digit NUBAN"),
        accountName: z.string().min(2),
      })
      .optional(),
  });
export type UpdateBrandInput = z.input<typeof updateBrandSchema>;

export const productOptionSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, "Name the option").max(20),
  values: z
    .array(
      z.object({
        id: z.string(),
        label: z.string().trim().min(1).max(24),
        swatch: z.string().optional(),
      }),
    )
    .min(1, "Add at least one value"),
});

export const productInputSchema = z
  .object({
    name: z.string().trim().min(3, "Name your product").max(80),
    description: z.string().trim().min(10, "Describe it in a sentence or two").max(1200),
    details: z.array(z.string().trim().min(1).max(120)).max(8).default([]),
    category: z.enum([
      "fashion",
      "thrift",
      "food",
      "beauty",
      "accessories",
      "print",
      "tech",
      "books",
    ]),
    tags: z.array(z.string().trim().min(1).max(24)).max(8).default([]),
    priceKobo: z.number().int().min(10_000, "Minimum price is ₦100").max(100_000_000),
    compareAtKobo: z.number().int().min(0).max(100_000_000).optional(),
    imageIds: z.array(z.string().max(80)).max(8).default([]),
    /** Images already on the product, kept on edit. Anything not already there is dropped. */
    keepImages: z.array(z.unknown()).max(8).optional(),
    options: z.array(productOptionSchema).max(3).default([]),
    variants: z
      .array(
        z.object({
          key: z.string().max(200),
          stock: z.number().int().min(0).max(9999),
          priceDeltaKobo: z.number().int().min(-100_000_000).max(100_000_000),
        }),
      )
      .min(1)
      .max(200),
    status: z.enum(["published", "draft"]),
  })
  .refine((p) => p.variants.every((v) => p.priceKobo + v.priceDeltaKobo >= 10_000), {
    message: "Every option must cost at least ₦100",
    path: ["variants"],
  });
export type ProductInput = z.input<typeof productInputSchema>;

export const fulfilmentChoiceSchema = z
  .object({
    method: z.enum(["pickup", "delivery"]),
    zoneId: z.string().min(1, "Choose a zone").max(80),
    pickupPointId: z.string().max(80).optional(),
    addressLine: z.string().trim().max(120).optional(),
    note: z.string().trim().max(200).optional(),
  })
  .refine((f) => f.method !== "pickup" || !!f.pickupPointId, {
    message: "Choose a pickup point",
    path: ["pickupPointId"],
  })
  .refine((f) => f.method !== "delivery" || (f.addressLine?.length ?? 0) >= 3, {
    message: "Add a room number or landmark",
    path: ["addressLine"],
  });
export type FulfilmentChoice = z.infer<typeof fulfilmentChoiceSchema>;

export const checkoutSchema = z.object({
  campusId: z.string().min(1).max(80),
  phone: nigerianPhone,
  groups: z
    .array(
      z.object({
        brandId: z.string().max(80),
        lines: z
          .array(
            z.object({
              productId: z.string().max(80),
              variantKey: z.string().max(200),
              quantity: z.number().int().min(1).max(20),
            }),
          )
          .min(1)
          .max(50),
        fulfilment: fulfilmentChoiceSchema,
        promoCode: z.string().trim().toUpperCase().max(40).optional(),
      }),
    )
    .min(1, "Your bag is empty")
    .max(20),
  paymentMethod: z.enum(["pay_on_delivery", "pay_on_pickup", "card", "transfer"]),
});
export type CheckoutInput = z.input<typeof checkoutSchema>;

export const reviewInputSchema = z.object({
  orderId: z.string(),
  productId: z.string(),
  rating: z.number().int().min(1, "Tap a star to rate").max(5),
  /** Optional: stars alone are a fine review. */
  body: z.string().trim().max(600),
});
export type ReviewInput = z.infer<typeof reviewInputSchema>;

export const promoInputSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .min(3, "At least 3 characters")
      .max(16)
      .regex(/^[A-Z0-9]+$/, "Letters and numbers only"),
    kind: z.enum(["percent", "fixed", "free_delivery"]),
    value: z.number().int().min(0),
    minSubtotalKobo: z.number().int().min(0),
    maxDiscountKobo: z.number().int().min(0).optional(),
    usageLimit: z.number().int().min(1).optional(),
    expiresAt: z
      .string()
      .refine((v) => !Number.isNaN(Date.parse(v)), "Choose a valid date")
      .optional(),
    description: z.string().trim().max(80).default(""),
    active: z.boolean().default(true),
  })
  .refine((p) => p.kind !== "percent" || (p.value >= 1 && p.value <= 90), {
    message: "Between 1% and 90%",
    path: ["value"],
  })
  .refine((p) => p.kind !== "fixed" || p.value >= 5_000, {
    message: "At least ₦50",
    path: ["value"],
  });
export type PromoInput = z.input<typeof promoInputSchema>;

export const placeSchema = z.object({
  id: z.string().optional(),
  label: z.string().trim().min(2, "Name this place, e.g. Hostel").max(30),
  campusId: z.string().min(1),
  zoneId: z.string().min(1, "Choose a zone"),
  pickupPointId: z.string().optional(),
  addressLine: z.string().trim().min(3, "Room, block or landmark").max(120),
  isDefault: z.boolean().default(false),
});
export type PlaceInput = z.input<typeof placeSchema>;

export const messageSchema = z.object({
  body: z.string().trim().min(1, "Write a message").max(1000),
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Enter your password to confirm"),
});
export type DeleteAccountInput = z.input<typeof deleteAccountSchema>;
