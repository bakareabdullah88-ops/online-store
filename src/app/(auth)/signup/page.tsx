import type { Metadata } from "next";
import { Suspense } from "react";
import { Page } from "@/components/shell/page";
import { SignupForm } from "@/components/auth/signup-form";
import { AuthFormSkeleton } from "@/components/auth/skeleton";
import { InviteOnly } from "@/components/auth/invite-only";
import { features } from "@/config/features";

export const metadata: Metadata = {
  title: "Get access",
  description: "How to get a Kiosk login.",
};

export default function SignupPage() {
  if (features.inviteOnly) {
    return (
      <Page className="w-full max-w-md">
        <InviteOnly />
      </Page>
    );
  }
  return (
    <Page className="w-full max-w-md">
      <Suspense fallback={<AuthFormSkeleton fields={3} />}>
        <SignupForm />
      </Suspense>
    </Page>
  );
}
