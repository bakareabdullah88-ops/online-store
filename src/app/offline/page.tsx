import type { Metadata } from "next";
import { Logo } from "@/components/shell/logo";
import { EmptyState } from "@/components/ui/empty-state";
import { ReloadButton } from "@/components/shell/reload-button";

export const metadata: Metadata = { title: "You're offline", robots: { index: false } };

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="flex h-16 items-center px-(--gutter) md:px-10">
        <Logo />
      </header>
      <main id="main" className="flex flex-1 items-center justify-center px-(--gutter)">
        <EmptyState
          illustration="offline"
          title="You're offline"
          body="This page hasn't been saved on your device yet. Pages you've visited, your bag and your orders still work without a connection."
          action={<ReloadButton />}
        />
      </main>
    </div>
  );
}
