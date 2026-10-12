"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input } from "@/components/ui/input";
import { NumberTicker } from "@/components/ui/misc";
import { ResponsiveSheet } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { spring, stagger } from "@/design/motion";
import { formatNaira, parseNairaInput } from "@/domain/money";
import { formatDate, formatTime } from "@/lib/format";
import { useMounted } from "@/lib/hooks";
import { cn } from "@/lib/cn";
import { useTopUp, useWallet } from "@/queries/inbox";
import { topUpSchema } from "@/services/inputs";
import { errorMessage } from "@/services/errors";
import { toast } from "@/stores/toast";
import { DashboardHeader } from "./dashboard-shell";

const presets = [100_000, 200_000, 500_000, 1_000_000];

export function WalletView() {
  const { data, isPending } = useWallet();
  const topUp = useTopUp();
  const mounted = useMounted();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("2,000");
  const [error, setError] = useState<string>();

  const submit = () => {
    const kobo = parseNairaInput(amount);
    const parsed = topUpSchema.safeParse({ amountKobo: kobo ?? 0 });
    if (!parsed.success || kobo === null) {
      setError(parsed.success ? "Enter an amount" : parsed.error.issues[0]?.message);
      return;
    }
    setError(undefined);
    topUp.mutate(kobo, {
      onSuccess: () => {
        setOpen(false);
        toast.success(`${formatNaira(kobo)} added`, { description: "Demo top-up: no real money moved." });
      },
      onError: (e) => toast.error(errorMessage(e)),
    });
  };

  return (
    <div>
      <DashboardHeader eyebrow="Wallet" title="Kiosk wallet" description="A pretend balance for trying out checkout. Nothing here is real money." />
      <div className="relative overflow-hidden rounded-xl bg-primary p-6 text-on-primary md:p-8">
        <div className="pointer-events-none absolute -top-20 -right-16 size-64 rounded-full bg-accent opacity-25 blur-2xl" aria-hidden />
        <div className="relative flex items-center justify-between">
          <p className="text-small opacity-70">Available balance</p>
          <span className="rounded-full bg-on-primary/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider">Demo money</span>
        </div>
        <p className="relative mt-4 font-display text-display-lg">{isPending ? "…" : <NumberTicker value={data?.balanceKobo ?? 0} format={(n) => formatNaira(n)} step={100} />}</p>
        <div className="relative mt-8 flex gap-2">
          <Button className="bg-on-primary text-primary hover:bg-on-primary/90" leadingIcon={<Plus className="size-4.5" />} onClick={() => setOpen(true)}>
            Top up
          </Button>
        </div>
      </div>

      <section aria-labelledby="tx" className="mt-10">
        <h2 id="tx" className="mb-4 text-title-lg font-semibold">
          Activity
        </h2>
        {isPending ? (
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-16" rounded="md" />
            ))}
          </div>
        ) : !data?.transactions.length ? (
          <EmptyState compact illustration="wallet" title="No activity yet" body="Top-ups and wallet payments will show here." />
        ) : (
          <ul className="divide-y divide-line rounded-lg bg-surface hairline">
            <AnimatePresence initial={false}>
              {data.transactions.map((t, i) => {
                const Icon = t.kind === "topup" ? ArrowDownLeft : t.kind === "refund" ? RotateCcw : ArrowUpRight;
                return (
                  <motion.li key={t.id} layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring.smooth, delay: stagger(i, 0.03, 0.2) }} className="flex items-center gap-4 px-5 py-4">
                    <span className={cn("flex size-10 items-center justify-center rounded-full", t.amountKobo > 0 ? "bg-success-soft text-success" : "bg-ink/[0.06] text-ink-2")}>
                      <Icon className="size-4.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-small font-medium">{t.label}</p>
                      <p className="text-small text-muted">{mounted ? `${formatDate(t.at, { year: true })} · ${formatTime(t.at)}` : " "}</p>
                    </div>
                    <span className={cn("font-mono text-small font-medium tabular", t.amountKobo > 0 && "text-success")}>
                      {t.amountKobo > 0 ? "+" : "−"}
                      {formatNaira(Math.abs(t.amountKobo))}
                    </span>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </section>

      <ResponsiveSheet
        open={open}
        onOpenChange={setOpen}
        title="Top up (demo)"
        description="Pick an amount. No card is charged and no money moves."
        footer={
          <Button size="lg" className="w-full" loading={topUp.isPending} onClick={submit}>
            Add {parseNairaInput(amount) !== null ? formatNaira(parseNairaInput(amount)!) : "money"}
          </Button>
        }
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <Chip key={p} selected={parseNairaInput(amount) === p} onClick={() => setAmount((p / 100).toLocaleString("en-NG"))}>
                {formatNaira(p)}
              </Chip>
            ))}
          </div>
          <Field label="Amount (₦)" error={error} hint="₦500 to ₦200,000">
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" className="font-mono" />
          </Field>
        </div>
      </ResponsiveSheet>
    </div>
  );
}
