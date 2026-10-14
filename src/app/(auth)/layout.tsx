import { BadgeCheck } from "lucide-react";
import { AppPreview } from "@/components/landing/app-preview";
import { Logo } from "@/components/shell/logo";

const points = [
  "One account to buy and to sell",
  "Pay on delivery or at pickup",
  "Live order status from placed to delivered",
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh bg-surface lg:grid-cols-[minmax(0,560px)_1fr] xl:grid-cols-[640px_1fr]">
      <div className="flex flex-col">
        <div className="flex h-16 items-center px-6 md:px-10">
          <Logo />
        </div>
        <div className="flex flex-1 items-start justify-center px-6 pt-6 pb-16 md:items-center md:px-10">
          {children}
        </div>
      </div>
      <aside
        className="relative hidden overflow-hidden bg-canvas lg:flex lg:flex-col lg:justify-center lg:p-10"
        aria-label="About Kamplug"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_20%_0%,color-mix(in_oklab,var(--chart-mint)_40%,transparent),transparent_70%),radial-gradient(50%_45%_at_100%_100%,#ffe6cc,transparent_70%)] opacity-70 dark:opacity-20"
          aria-hidden
        />
        <div className="relative">
          <h2 className="max-w-md text-[34px] leading-tight font-bold tracking-[-0.035em]">
            The campus marketplace, run by students.
          </h2>
          <ul className="mt-5 flex flex-col gap-2">
            {points.map((p) => (
              <li key={p} className="flex items-center gap-2.5 text-[15px] text-ink-2">
                <BadgeCheck className="size-[18px] text-chart-green" /> {p}
              </li>
            ))}
          </ul>
          <div className="mt-10 -mr-40">
            <AppPreview />
          </div>
        </div>
      </aside>
    </div>
  );
}
