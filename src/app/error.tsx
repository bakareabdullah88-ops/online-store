"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // BACKEND-SEAM: report to an error tracker (Sentry, etc.).
    console.error(error);
  }, [error]);
  return (
    <main id="main" className="container-page flex min-h-[70dvh] items-center justify-center">
      <EmptyState
        illustration="error"
        title="Something spilled"
        body="This part of Kiosk hit a problem. Your bag and orders are safe on this device."
        action={<Button onClick={reset}>Try again</Button>}
        secondary={
          <ButtonLink href="/" variant="secondary">
            Go home
          </ButtonLink>
        }
      />
    </main>
  );
}
