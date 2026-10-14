/**
 * Features that need the backend. Flip these on as each service goes live;
 * the UI already handles both states.
 */
export const features = {
  /**
   * Only people on the list in config/access.ts can log in, and sign-up is closed.
   * Set NEXT_PUBLIC_OPEN_SIGNUP=1 (local development, tests) to let anyone sign up.
   */
  inviteOnly: process.env.NEXT_PUBLIC_OPEN_SIGNUP !== "1",
  /**
   * SAMPLE DATA while Kamplug is being built: sample shops, orders and a preview
   * account anyone can look around with, no sign-up needed. Set
   * NEXT_PUBLIC_SAMPLE_DATA=0 to switch it off; it is then removed from every
   * browser on the next visit, keeping what real accounts created.
   */
  sampleData: process.env.NEXT_PUBLIC_SAMPLE_DATA !== "0",
  /** Card / bank transfer at checkout (BACKEND-SEAM: Paystack). Offline methods always work. */
  onlinePayments: false,
  /** Password reset emails (BACKEND-SEAM: transactional email). */
  passwordResetEmail: false,
  /** Automatic seller payouts (BACKEND-SEAM: Paystack transfers). */
  payouts: false,
} as const;
