import type { Metadata } from "next";
import { Page } from "@/components/shell/page";
import { ForgotForm } from "@/components/auth/forgot-form";

export const metadata: Metadata = { title: "Reset password", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <Page className="w-full max-w-md">
      <ForgotForm />
    </Page>
  );
}
