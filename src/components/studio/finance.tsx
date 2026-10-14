"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "motion/react";
import { Banknote, CheckCircle2, Clock, Landmark, Receipt, TrendingUp } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { NavPageHeader } from "@/components/app/nav-header";
import { Stagger, StaggerItem } from "@/components/app/stagger";
import { DashCard } from "@/components/dash/card";
import { DashboardSkeleton } from "@/components/dash/skeleton";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { features } from "@/config/features";
import { formatNaira, formatNairaCompact } from "@/domain/money";
import { spring } from "@/design/motion";
import { applyServiceErrors } from "@/lib/form";
import { formatNumber } from "@/lib/format";
import { useFinance, useUpdateBrand } from "@/queries/studio";
import { toast } from "@/stores/toast";

const payoutSchema = z.object({
  bankName: z.string().trim().min(2, "Enter your bank"),
  accountNumber: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "Enter your 10-digit account number"),
  accountName: z.string().trim().min(2, "Enter the name on the account"),
});
type PayoutValues = z.infer<typeof payoutSchema>;

function MonthBars({ months }: { months: { month: string; amountKobo: number }[] }) {
  const max = Math.max(1, ...months.map((m) => m.amountKobo));
  const last = months.length - 1;
  return (
    <div className="flex h-56 items-end gap-3">
      {months.map((m, i) => (
        <div
          key={m.month}
          className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
        >
          <span className="text-[11.5px] font-medium text-muted tabular">
            {m.amountKobo ? formatNairaCompact(m.amountKobo) : ""}
          </span>
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ ...spring.smooth, delay: i * 0.05 }}
            className={
              i === last
                ? "w-full origin-bottom rounded-t-md bg-chart-green"
                : "w-full origin-bottom rounded-t-md bg-[color-mix(in_oklab,var(--chart-green)_14%,transparent)] hatch [--hatch:var(--chart-green)]"
            }
            style={{ height: `${Math.max((m.amountKobo / max) * 78, m.amountKobo ? 4 : 1.5)}%` }}
          />
          <span className="text-[12px] text-muted">{m.month}</span>
        </div>
      ))}
    </div>
  );
}

function PayoutForm({
  saved,
}: {
  saved: { bankName: string; accountLast4: string; accountName: string } | null;
}) {
  const update = useUpdateBrand();
  const form = useForm<PayoutValues>({
    resolver: zodResolver(payoutSchema),
    defaultValues: {
      bankName: saved?.bankName ?? "",
      accountNumber: "",
      accountName: saved?.accountName ?? "",
    },
  });
  const onSubmit = form.handleSubmit((v) =>
    update.mutateAsync({ payoutAccount: v }).then(
      () => {
        toast.success("Payout details saved");
        form.reset({ ...v, accountNumber: "" });
      },
      (e) => applyServiceErrors(e, form.setError, ["bankName", "accountName"]),
    ),
  );
  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {saved && (
        <div className="flex items-center gap-3 rounded-2xl bg-surface p-3.5 ring-1 ring-line">
          <span className="grid size-10 place-items-center rounded-xl bg-success-soft text-success">
            <CheckCircle2 className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-small font-semibold">{saved.accountName}</p>
            <p className="text-[12.5px] text-muted">
              {saved.bankName} · •••• {saved.accountLast4}
            </p>
          </div>
        </div>
      )}
      <Field label="Bank" error={form.formState.errors.bankName?.message}>
        <Input placeholder="e.g. GTBank" autoComplete="off" {...form.register("bankName")} />
      </Field>
      <Field
        label="Account number"
        error={form.formState.errors.accountNumber?.message}
        hint={saved ? "Enter it again to change it." : undefined}
      >
        <Input
          inputMode="numeric"
          maxLength={10}
          placeholder="0123456789"
          autoComplete="off"
          {...form.register("accountNumber")}
        />
      </Field>
      <Field label="Account name" error={form.formState.errors.accountName?.message}>
        <Input autoComplete="name" {...form.register("accountName")} />
      </Field>
      <Button type="submit" loading={form.formState.isSubmitting} className="self-start">
        {saved ? "Update payout details" : "Save payout details"}
      </Button>
    </form>
  );
}

/** Earnings from completed orders, and where online payments will be paid out. */
export function StudioFinance() {
  const { data } = useFinance();
  return (
    <>
      <NavPageHeader
        title="Finance"
        description="What you've earned from orders and where payouts go."
      />
      {!data ? (
        <DashboardSkeleton />
      ) : (
        <Stagger className="grid grid-cols-1 gap-4">
          <StaggerItem className="grid gap-3 sm:grid-cols-3">
            {[
              {
                icon: <Banknote />,
                label: "Earned",
                value: formatNaira(data.earnedKobo),
                note: "From delivered orders",
              },
              {
                icon: <Clock />,
                label: "In progress",
                value: formatNaira(data.pendingKobo),
                note: "Accepted, not delivered yet",
              },
              {
                icon: <Receipt />,
                label: "Completed orders",
                value: formatNumber(data.completedOrders),
                note: "All time",
              },
            ].map((s) => (
              <section key={s.label} className="card lift p-5">
                <p className="flex items-center gap-2 text-[13.5px] font-medium text-ink-2 [&_svg]:size-4 [&_svg]:text-muted">
                  {s.icon}
                  {s.label}
                </p>
                <p className="mt-3 text-[26px] leading-none font-semibold tracking-[-0.02em] tabular">
                  {s.value}
                </p>
                <p className="mt-2 text-[12px] text-muted">{s.note}</p>
              </section>
            ))}
          </StaggerItem>
          <StaggerItem className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <DashCard
              title="Earnings by month"
              icon={<TrendingUp />}
              tone="var(--chart-green)"
              actions={[{ label: "Open orders", href: "/studio/orders", icon: <Receipt /> }]}
            >
              <MonthBars months={data.byMonth} />
            </DashCard>
            <DashCard title="Payout details" icon={<Landmark />} tone="#6366f1">
              <p className="mb-4 text-small text-muted">
                {features.payouts
                  ? "Online payments are paid out to this account."
                  : "Buyers pay you directly for now, on delivery or at pickup. When online payments switch on, they'll be paid out to this account."}
              </p>
              <PayoutForm saved={data.payoutAccount} />
            </DashCard>
          </StaggerItem>
        </Stagger>
      )}
    </>
  );
}
