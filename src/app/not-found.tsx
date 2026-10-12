import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Logo } from "@/components/shell/logo";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="flex h-16 items-center px-(--gutter) md:px-10">
        <Logo />
      </header>
      <main id="main" className="flex flex-1 flex-col items-center justify-center px-(--gutter) pb-16">
        <p className="eyebrow text-muted">Error 404</p>
        <EmptyState
          illustration="lost"
          title="This page took a wrong turn"
          body="The link may be old, or the brand may have moved. Let's get you back to campus."
          action={<ButtonLink href="/explore">Explore</ButtonLink>}
          secondary={
            <ButtonLink href="/" variant="secondary">
              Home
            </ButtonLink>
          }
        />
      </main>
    </div>
  );
}
