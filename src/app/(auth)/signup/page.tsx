import type { Metadata } from "next";
import { Suspense } from "react";
import { Page } from "@/components/shell/page";
import { SignupForm } from "@/components/auth/signup-form";
import { AuthFormSkeleton } from "@/components/auth/skeleton";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create a free account to buy from student brands on your campus.",
};

export default function SignupPage() {
  return (
    <Page className="w-full max-w-md">
      <Suspense fallback={<AuthFormSkeleton fields={3} />}>
        <SignupForm />
      </Suspense>
    </Page>
  );
}
