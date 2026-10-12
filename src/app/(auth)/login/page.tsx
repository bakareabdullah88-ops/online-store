import type { Metadata } from "next";
import { Suspense } from "react";
import { Page } from "@/components/shell/page";
import { LoginForm } from "@/components/auth/login-form";
import { AuthFormSkeleton } from "@/components/auth/skeleton";

export const metadata: Metadata = { title: "Log in", robots: { index: false } };

export default function LoginPage() {
  return (
    <Page className="w-full max-w-md">
      <Suspense fallback={<AuthFormSkeleton fields={2} />}>
        <LoginForm />
      </Suspense>
    </Page>
  );
}
