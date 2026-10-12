import type { Metadata } from "next";
import { Suspense } from "react";
import { Page } from "@/components/shell/page";
import { WelcomeFlow } from "@/components/auth/welcome-flow";
import { AuthFormSkeleton } from "@/components/auth/skeleton";

export const metadata: Metadata = { title: "Welcome", robots: { index: false } };

export default function WelcomePage() {
  return (
    <Page className="w-full max-w-lg">
      <Suspense fallback={<AuthFormSkeleton fields={3} />}>
        <WelcomeFlow />
      </Suspense>
    </Page>
  );
}
