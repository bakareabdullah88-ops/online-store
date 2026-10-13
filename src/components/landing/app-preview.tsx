"use client";

import { motion, useReducedMotion } from "motion/react";
import {
  BarChart3,
  Bell,
  Boxes,
  Check,
  Droplet,
  Eye,
  Gauge as GaugeIcon,
  ImageIcon,
  MessageCircle,
  Package,
  Plus,
  Receipt,
  Search,
  Settings,
  Shirt,
  ShoppingBag,
  Soup,
  Star,
  Tag,
  Users,
  Wallet,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { KioskMark } from "@/components/app/kiosk-mark";
import { Gauge } from "@/components/dash/gauge";
import { cn } from "@/lib/cn";

/** Example rows for the illustration. They are drawn, not stored anywhere. */
const rows = [
  {
    name: "Hand-dyed tee",
    icon: Shirt,
    tone: "var(--chart-blue)",
    perf: "Excellent",
    score: 86,
    views: "1.2k",
    bag: "214",
    stock: 14,
    price: "₦9,500",
  },
  {
    name: "Jollof bowl",
    icon: Soup,
    tone: "var(--chart-orange)",
    perf: "Good",
    score: 61,
    views: "870",
    bag: "160",
    stock: 30,
    price: "₦3,500",
  },
  {
    name: "Shea body butter",
    icon: Droplet,
    tone: "var(--chart-green)",
    perf: "Good",
    score: 48,
    views: "540",
    bag: "71",
    stock: 22,
    price: "₦4,000",
  },
  {
    name: "A3 campus print",
    icon: ImageIcon,
    tone: "var(--chart-violet)",
    perf: "Fair",
    score: 24,
    views: "390",
    bag: "28",
    stock: 40,
    price: "₦2,500",
  },
];

const W = 1080;
const H = 640;

function NavRow({
  icon: Icon,
  label,
  active,
  badge,
}: {
  icon: typeof Bell;
  label: string;
  active?: boolean;
  badge?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex h-9 items-center gap-2.5 rounded-xl px-2.5 text-[13px] font-medium",
        active ? "bg-surface text-ink shadow-sm ring-1 ring-line" : "text-ink-2",
      )}
    >
      <Icon className={cn("size-4", active ? "text-ink" : "text-muted")} />
      <span className="flex-1">{label}</span>
      {badge}
    </div>
  );
}

const red = (n: number) => (
  <span className="rounded-full bg-badge px-1.5 text-[10px] leading-4 font-semibold text-white">
    {n}
  </span>
);

/** Scales a fixed-size drawing to its container. */
function useFit() {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setScale(Math.min(1, (e?.contentRect.width ?? W) / W)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, scale };
}

/**
 * A coded, animated picture of Shop Studio: the same rail, sidebar and
 * product list the app uses. A cursor accepts an incoming order on a loop.
 */
export function AppPreview() {
  const { ref, scale } = useFit();
  const reduce = useReducedMotion();
  const [tick, setStep] = useState(0); // 0 idle, 1 toast in, 2 cursor at button, 3 accepted
  const step = reduce ? 3 : tick;
  useEffect(() => {
    if (reduce) return;
    const seq = [1400, 1300, 900, 2600];
    let i = 0;
    let t: number;
    const tick = () => {
      i = (i + 1) % 4;
      setStep(i);
      t = window.setTimeout(tick, seq[i]);
    };
    t = window.setTimeout(tick, seq[0]);
    return () => window.clearTimeout(t);
  }, [reduce]);

  return (
    <div
      ref={ref}
      className="relative w-full text-left"
      style={{ height: H * scale }}
      aria-label="Preview of Shop Studio, the seller side of Kiosk"
      role="img"
    >
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{ width: W, height: H, transform: `scale(${scale})` }}
        aria-hidden
      >
        <div className="flex size-full overflow-hidden rounded-[28px] bg-canvas shadow-[0_40px_80px_-30px_rgb(20_30_60/0.35)] ring-1 ring-line">
          {/* rail */}
          <div className="flex w-[68px] flex-col items-center gap-3 py-4">
            <span className="grid size-11 place-items-center rounded-2xl bg-primary text-on-primary">
              <KioskMark className="size-5" />
            </span>
            <span className="h-px w-7 bg-line-strong" />
            <span className="grid size-11 place-items-center rounded-2xl bg-[linear-gradient(140deg,var(--chart-blue),var(--chart-violet))] text-white">
              <ShoppingBag className="size-5" />
            </span>
            <span className="relative grid size-11 place-items-center rounded-2xl bg-[#ffe3cf] text-[15px] font-bold text-[#a3480b] ring-2 ring-ink ring-offset-2 ring-offset-canvas">
              YS
              <span className="absolute -top-1.5 -right-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-badge px-1 text-[10px] font-semibold text-white ring-2 ring-canvas">
                2
              </span>
            </span>
            <span className="grid size-11 place-items-center rounded-2xl border-2 border-dashed border-line-strong text-muted">
              <Plus className="size-4" />
            </span>
            <span className="mt-auto size-10 rounded-full bg-[linear-gradient(135deg,#ffd29d,#f48fb1)]" />
          </div>
          {/* sidebar */}
          <div className="flex w-[218px] flex-col gap-0.5 py-5 pr-3">
            <div className="mb-4 flex items-center gap-2.5 px-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-[#ffe3cf] text-[13px] font-bold text-[#a3480b]">
                YS
              </span>
              <div>
                <p className="text-[14px] font-semibold">Your shop</p>
                <p className="text-[11px] text-muted">View shop</p>
              </div>
            </div>
            <NavRow icon={GaugeIcon} label="Performance" />
            <NavRow icon={BarChart3} label="Analytics" />
            <NavRow icon={Bell} label="Notifications" badge={red(3)} />
            <NavRow icon={Receipt} label="Orders" badge={red(step >= 3 ? 1 : 2)} />
            <p className="mt-4 mb-1 border-t border-line px-2.5 pt-4 text-[10px] font-semibold tracking-[0.08em] text-muted uppercase">
              Product
            </p>
            <NavRow icon={Package} label="All products" active />
            <NavRow icon={Tag} label="Promotions" />
            <NavRow icon={Star} label="Reviews" />
            <p className="mt-4 mb-1 border-t border-line px-2.5 pt-4 text-[10px] font-semibold tracking-[0.08em] text-muted uppercase">
              My store
            </p>
            <NavRow icon={Wallet} label="Finance" />
            <NavRow icon={Users} label="Customers" />
            <NavRow icon={MessageCircle} label="Inbox" />
            <NavRow icon={Settings} label="Shop settings" />
          </div>
          {/* main */}
          <div className="relative my-3 mr-3 flex-1 overflow-hidden rounded-[24px] bg-surface ring-1 ring-line">
            <div className="flex items-center gap-3 px-6 pt-5">
              <h3 className="flex-1 text-[24px] font-semibold tracking-[-0.02em]">All products</h3>
              <span className="flex h-9 w-56 items-center gap-2 rounded-xl px-3 text-[12.5px] text-muted ring-1 ring-line">
                <Search className="size-4" /> Search product
              </span>
              <span className="flex h-9 items-center rounded-xl bg-surface-2 px-3 text-[12.5px] font-medium ring-1 ring-line">
                Sort by
              </span>
            </div>
            <div className="mx-6 mt-4 rounded-2xl bg-surface-2/80 p-4 ring-1 ring-line">
              <p className="text-[15px] font-semibold">Product statistic</p>
              <div className="mt-3 grid grid-cols-4 divide-x divide-line border-t border-line pt-3">
                <div className="pr-4">
                  <p className="text-[11.5px] text-muted">Active products</p>
                  <p className="text-[20px] font-medium">
                    12 <span className="text-[11px]">products</span>
                  </p>
                </div>
                <div className="px-4">
                  <p className="text-[11.5px] text-muted">Winning product</p>
                  <p className="truncate text-[17px] font-medium">Hand-dyed tee</p>
                </div>
                <div className="flex items-center gap-2 px-4">
                  <div>
                    <p className="text-[11.5px] text-muted">Average performance</p>
                    <p className="flex items-center gap-2 text-[17px] font-medium">
                      <Gauge value={64} size={38} /> Good!
                    </p>
                  </div>
                </div>
                <div className="pl-4">
                  <p className="text-[11.5px] text-muted">Products sold</p>
                  <p className="text-[20px] font-medium">
                    318 <span className="text-[11px]">items</span>
                  </p>
                </div>
              </div>
            </div>
            <ul className="mx-6 mt-2">
              {rows.map((r) => (
                <li
                  key={r.name}
                  className="flex items-center gap-5 border-b border-line py-3 last:border-0"
                >
                  <span
                    className="grid size-12 place-items-center rounded-xl"
                    style={{
                      background: `color-mix(in oklab, ${r.tone} 14%, var(--surface))`,
                      color: r.tone,
                    }}
                  >
                    <r.icon className="size-6" />
                  </span>
                  <div className="w-40">
                    <p className="text-[14.5px] font-medium">{r.name}</p>
                    <p className="text-[12px] text-muted">
                      Review : <b className="font-medium text-ink">4.8</b> ★
                    </p>
                  </div>
                  <span className="h-8 w-px bg-line" />
                  <div className="flex-1">
                    <p className="text-[13px]">
                      Performance{" "}
                      <span className={r.perf === "Fair" ? "text-warning" : "text-success"}>
                        {r.perf}
                      </span>
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-ink-2">
                      <Eye className="size-3.5 text-muted" /> {r.views}{" "}
                      <ShoppingBag className="ml-1 size-3.5 text-muted" /> {r.bag}
                    </p>
                  </div>
                  <Gauge value={r.score} size={54} />
                  <span className="h-8 w-px bg-line" />
                  <div className="w-16 text-center">
                    <p className="text-[11.5px] text-muted">Stock</p>
                    <p className="flex items-center justify-center gap-1 text-[13px] font-medium">
                      <Boxes className="size-3.5 text-muted" />
                      {r.stock}
                    </p>
                  </div>
                  <div className="w-20 text-right">
                    <p className="text-[11.5px] text-muted">Price</p>
                    <p className="text-[13px] font-medium">{r.price}</p>
                  </div>
                </li>
              ))}
            </ul>
            {/* incoming order */}
            {/* Slides in from below the panel edge. Transform only, so text never fades below readable contrast. */}
            <motion.div
              initial={false}
              animate={step >= 1 ? { y: 0, scale: 1 } : { y: 200, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="absolute right-5 bottom-5 w-72 rounded-2xl bg-surface p-4 shadow-xl ring-1 ring-line"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent">
                  <Receipt className="size-5" />
                </span>
                <div className="flex-1">
                  <p className="text-[13.5px] font-semibold">New order · ₦13,000</p>
                  <p className="text-[11.5px] text-muted">2 items · Delivery to Moremi Hall</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <span className="flex h-8 flex-1 items-center justify-center rounded-lg text-[12.5px] font-medium ring-1 ring-line">
                  Decline
                </span>
                <motion.span
                  animate={step === 2 ? { scale: [1, 0.94, 1] } : { scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.55 }}
                  className={cn(
                    "flex h-8 flex-1 items-center justify-center gap-1 rounded-lg text-[12.5px] font-semibold",
                    step >= 3 ? "bg-success-soft text-success" : "bg-primary text-on-primary",
                  )}
                >
                  {step >= 3 ? (
                    <>
                      <Check className="size-3.5" /> Accepted
                    </>
                  ) : (
                    "Accept"
                  )}
                </motion.span>
              </div>
            </motion.div>

            {/* cursor */}
            {!reduce && (
              <motion.svg
                viewBox="0 0 24 24"
                className="pointer-events-none absolute top-0 left-0 size-7 drop-shadow-lg"
                initial={{ x: 380, y: 300 }}
                animate={
                  step >= 2
                    ? { x: 690, y: 548 }
                    : { x: 380 + (step === 1 ? 140 : 0), y: 300 + (step === 1 ? 120 : 0) }
                }
                transition={{ type: "spring", stiffness: 70, damping: 16 }}
              >
                <path
                  d="M4 2l15 9-6.5 1.6L9.6 19z"
                  fill="var(--ink)"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </motion.svg>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
