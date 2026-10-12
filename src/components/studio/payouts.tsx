"use client";

import { useState } from "react";
import { Banknote, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input } from "@/components/ui/input";
import { NumberTicker, Pill } from "@/components/ui/misc";
import { Select } from "@/components/ui/overlay";
import { ResponsiveSheet } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNaira } from "@/domain/money";
import { formatDate } from "@/lib/format";
import { useMounted } from "@/lib/hooks";
import { useMyBrand, usePayouts, useRequestPayout, useUpdateBrand } from "@/queries/studio";
import { errorMessage } from "@/services/errors";
import { toast } from "@/stores/toast";
import { StudioHeaderBlock } from "./studio-shell";

const banks = ["Access Bank", "First Bank", "GTBank", "Kuda", "Moniepoint", "OPay", "PalmPay", "UBA", "Wema Bank", "Zenith Bank"];

function AccountForm({ onDone }: { onDone: () => void }) {
  const update = useUpdateBrand();
  const [bank, setBank] = useState<string | undefined>();
  const [number, setNumber] = useState("");
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const submit = () => {
    const e: Record<string, string> = {};
    if (!bank) e.bank = "Choose your bank";
    if (!/^\d{10}$/.test(number)) e.number = "Enter your 10-digit account number";
    if (name.trim().length < 2) e.name = "Enter the account name";
    setErrors(e);
    if (Object.keys(e).length || !bank) return;
    update.mutate(
      { payoutAccount: { bankName: bank, accountNumber: number, accountName: name } },
      { onSuccess: () => { toast.success("Payout account saved", { description: "Demo only: no account is verified." }); onDone(); }, onError: (err) => toast.error(errorMessage(err)) },
    );
  };
  return (
    <form className="flex flex-col gap-5" noValidate onSubmit={(e) => { e.preventDefault(); submit(); }}>
      <Field label="Bank" error={errors.bank}>
        <Select label="Bank" value={bank} onValueChange={setBank} placeholder="Choose a bank" options={banks.map((b) => ({ value: b, label: b }))} />
      </Field>
      <Field label="Account number" error={errors.number}>
        <Input value={number} onChange={(e) => setNumber(e.target.value.replace(/\D/g, "").slice(0, 10))} inputMode="numeric" className="font-mono" placeholder="0123456789" />
      </Field>
      <Field label="Account name" error={errors.name}>
        <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
      </Field>
      <p className="rounded-md bg-warning-soft px-3 py-2 text-small text-warning">Demo: details are stored on this device only and never verified.</p>
      <Button type="submit" size="lg" loading={update.isPending}>
        Save account
      </Button>
    </form>
  );
}

export function StudioPayouts() {
  const { data, isPending } = usePayouts();
  const { data: brand } = useMyBrand();
  const request = useRequestPayout();
  const mounted = useMounted();
  const [sheet, setSheet] = useState(false);
  return (
    <div>
      <StudioHeaderBlock eyebrow="Payouts" title="Payouts" description="Earnings from delivered orders, minus the 5% Kiosk fee. Everything here is simulated." />
      {isPending || !data ? (
        <div className="grid gap-3 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-36" rounded="lg" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="flex flex-col rounded-lg bg-primary p-5 text-on-primary">
              <div className="flex items-center justify-between">
                <p className="text-small opacity-70">Available to pay out</p>
                <span className="rounded-full bg-on-primary/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider">Demo</span>
              </div>
              <p className="mt-2 font-display text-display-md">
                <NumberTicker value={data.availableKobo} format={(n) => formatNaira(n)} step={100} />
              </p>
              <Button
                className="mt-auto self-start bg-on-primary text-primary hover:bg-on-primary/90"
                loading={request.isPending}
                disabled={!brand?.payoutAccount || data.availableKobo < 100_000}
                onClick={() => request.mutate(undefined, { onSuccess: (p) => toast.success(`${formatNaira(p.amountKobo)} on its way`, { description: "Demo payout: no money moves." }), onError: (e) => toast.error(errorMessage(e)) })}
              >
                Request payout
              </Button>
            </div>
            <div className="rounded-lg bg-surface p-5 hairline">
              <p className="text-small text-muted">Pending (orders in progress)</p>
              <p className="mt-2 font-display text-display-md">{formatNaira(data.pendingKobo)}</p>
              <p className="mt-2 text-small text-muted">Becomes available when orders are delivered.</p>
            </div>
            <div className="rounded-lg bg-surface p-5 hairline">
              <p className="text-small text-muted">Payout account</p>
              {brand?.payoutAccount ? (
                <>
                  <p className="mt-2 flex items-center gap-2 text-body font-semibold">
                    <Building2 className="size-4.5" /> {brand.payoutAccount.bankName}
                  </p>
                  <p className="mt-1 font-mono text-small text-muted">
                    •••• {brand.payoutAccount.accountLast4} · {brand.payoutAccount.accountName}
                  </p>
                  <Button size="sm" variant="ghost" className="mt-3 -ml-3" onClick={() => setSheet(true)}>
                    Change account
                  </Button>
                </>
              ) : (
                <>
                  <p className="mt-2 text-body">No account yet</p>
                  <Button size="sm" className="mt-3" onClick={() => setSheet(true)}>
                    Add payout account
                  </Button>
                </>
              )}
            </div>
          </div>
          <section aria-labelledby="hist" className="mt-8">
            <h2 id="hist" className="mb-4 text-title-lg font-semibold">
              History
            </h2>
            {data.payouts.length === 0 ? (
              <EmptyState compact illustration="wallet" title="No payouts yet" body="Your payouts will be listed here." />
            ) : (
              <ul className="divide-y divide-line rounded-lg bg-surface hairline">
                {data.payouts.map((p) => (
                  <li key={p.id} className="flex items-center gap-4 px-5 py-4">
                    <span className="flex size-10 items-center justify-center rounded-full bg-ink/[0.05]">
                      <Banknote className="size-4.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-small font-medium">{formatNaira(p.amountKobo)}</p>
                      <p className="font-mono text-[12px] text-muted">
                        {p.reference} {mounted && `· ${formatDate(p.at, { year: true })}`}
                      </p>
                    </div>
                    {p.status === "paid" ? <Pill tone="success" dot>Paid</Pill> : <Pill tone="warning" dot>Processing</Pill>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
      <ResponsiveSheet open={sheet} onOpenChange={setSheet} title="Payout account" description="Where your earnings go.">
        <AccountForm onDone={() => setSheet(false)} />
      </ResponsiveSheet>
    </div>
  );
}
