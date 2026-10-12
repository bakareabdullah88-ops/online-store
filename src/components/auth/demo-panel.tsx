"use client";

import { useRouter } from "next/navigation";
import { ShoppingBag, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useSignInDemo } from "@/queries/session";
import { errorMessage } from "@/services/errors";
import { toast } from "@/stores/toast";

export function DemoPanel({
  next,
  highlight,
}: {
  next?: string | null;
  highlight?: string | null;
}) {
  const demo = useSignInDemo();
  const router = useRouter();
  const go = (k: "buyer" | "seller") =>
    demo.mutate(k, {
      onSuccess: (u) => {
        toast.success(`Welcome, ${u.name.split(" ")[0]}`, {
          description: `You're using the demo ${k} account.`,
        });
        router.push(next ?? (k === "seller" ? "/studio" : "/explore"));
      },
      onError: (e) => toast.error(errorMessage(e)),
    });
  return (
    <div className="rounded-lg bg-canvas-sunk p-5">
      <p className="eyebrow text-muted">Try the demo · no sign-up</p>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button
          variant="secondary"
          className={cn(
            "h-auto justify-start py-3 text-left",
            highlight === "buyer" && "shadow-[inset_0_0_0_1.5px_var(--ink)]",
          )}
          loading={demo.isPending && demo.variables === "buyer"}
          disabled={demo.isPending}
          onClick={() => go("buyer")}
          aria-label="Try the demo buyer account"
        >
          <span className="flex items-center gap-3">
            <ShoppingBag className="size-5 shrink-0" />
            <span>
              <span className="block text-small font-semibold">Demo buyer</span>
              <span className="block text-small font-normal text-muted">Ada · UNILAG</span>
            </span>
          </span>
        </Button>
        <Button
          variant="secondary"
          className={cn(
            "h-auto justify-start py-3 text-left",
            highlight === "seller" && "shadow-[inset_0_0_0_1.5px_var(--ink)]",
          )}
          loading={demo.isPending && demo.variables === "seller"}
          disabled={demo.isPending}
          onClick={() => go("seller")}
          aria-label="Try the demo seller account"
        >
          <span className="flex items-center gap-3">
            <Store className="size-5 shrink-0" />
            <span>
              <span className="block text-small font-semibold">Demo seller</span>
              <span className="block text-small font-normal text-muted">Tolu · Àdìrẹ Lab</span>
            </span>
          </span>
        </Button>
      </div>
      <p className="mt-3 text-small text-muted">
        Demo only: accounts live in this browser, passwords are hashed locally, and no real payments
        happen.
      </p>
    </div>
  );
}
