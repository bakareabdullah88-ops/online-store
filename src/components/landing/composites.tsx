import {
  Check,
  MapPin,
  MessageCircle,
  Search,
  ShoppingBag,
  Shirt,
  Sparkles,
  Truck,
} from "lucide-react";

/** Coded UI snippets for the feature rows. Illustrations of the app, not live data. */

export function FoundComposite() {
  return (
    <div className="relative mx-auto h-[300px] w-full max-w-[460px]" aria-hidden>
      <div className="absolute top-2 left-0 w-60 rounded-2xl bg-surface p-3 shadow-lg ring-1 ring-line">
        <p className="flex items-center gap-2 rounded-lg bg-surface-2 px-2.5 py-2 text-[12.5px]">
          <Search className="size-3.5 text-muted" /> thrift jacket
        </p>
        {["thrift jacket near Moremi", "thrift jacket under ₦10k", "denim jacket, size L"].map(
          (s) => (
            <p key={s} className="flex items-center gap-2 px-2.5 py-1.5 text-[12px] text-ink-2">
              <Search className="size-3 text-faint" /> {s}
            </p>
          ),
        )}
      </div>
      <div className="absolute top-14 right-0 w-56 overflow-hidden rounded-[22px] bg-surface shadow-xl ring-1 ring-line">
        <div className="grid h-36 place-items-center bg-[linear-gradient(140deg,color-mix(in_oklab,var(--chart-blue)_20%,var(--surface)),color-mix(in_oklab,var(--chart-violet)_24%,var(--surface)))] text-chart-blue">
          <Shirt className="size-14" strokeWidth={1.4} />
        </div>
        <div className="p-3.5">
          <p className="text-[13.5px] font-semibold">Vintage denim jacket</p>
          <p className="mt-0.5 flex items-center gap-1 text-[11.5px] text-muted">
            <MapPin className="size-3" /> 4 min away · UNILAG
          </p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[15px] font-semibold">₦8,500</span>
            <span className="flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3 text-[12px] font-semibold text-on-accent">
              <ShoppingBag className="size-3.5" /> Add
            </span>
          </div>
        </div>
      </div>
      <svg
        className="absolute top-[150px] left-[120px] h-20 w-28 text-chart-green"
        viewBox="0 0 110 80"
        fill="none"
      >
        <path d="M2 2 V60 H100" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
        <circle cx="100" cy="60" r="4" fill="currentColor" />
      </svg>
    </div>
  );
}

export function OrderComposite() {
  return (
    <div className="relative mx-auto h-[320px] w-full max-w-[460px]" aria-hidden>
      <div className="absolute top-4 left-0 w-44 rounded-2xl bg-surface p-3 shadow-lg ring-1 ring-line">
        {["Viewed", "Added to bag", "Ordered", "Delivered"].map((s, i) => (
          <p key={s} className="flex items-center gap-2 py-1 text-[12px]">
            <span
              className={`grid size-4 place-items-center rounded-full ${i < 3 ? "bg-chart-green text-white" : "ring-1 ring-line-strong"}`}
            >
              {i < 3 && <Check className="size-2.5" strokeWidth={3} />}
            </span>
            {s}
          </p>
        ))}
      </div>
      <div className="absolute right-0 bottom-0 w-64 rounded-2xl bg-surface p-4 shadow-xl ring-1 ring-line">
        <p className="text-center text-[12.5px] font-semibold">Order summary</p>
        {[
          ["1×", "Jollof bowl", "₦3,500"],
          ["2×", "Zobo, 50cl", "₦1,600"],
          ["1×", "Delivery", "₦500"],
        ].map(([q, n, p]) => (
          <p key={n} className="mt-2.5 flex items-center gap-2 text-[12px]">
            <span className="text-muted">{q}</span>
            <span className="flex-1">{n}</span>
            <span className="font-medium tabular">{p}</span>
          </p>
        ))}
        <p className="mt-3 flex justify-between border-t border-line pt-3 text-[13px] font-semibold">
          <span>Total</span> <span>₦5,600</span>
        </p>
        <span className="mt-3 flex h-9 items-center justify-center rounded-lg bg-accent text-[12.5px] font-semibold text-on-accent">
          Place order · pay on delivery
        </span>
      </div>
      <div className="absolute bottom-6 left-4">
        <p className="text-[44px] leading-none font-semibold tracking-tight">
          ₦0<span className="text-chart-green">.</span>
        </p>
        <p className="mt-1 w-32 text-[11.5px] text-muted">paid upfront. Pay when it arrives.</p>
      </div>
    </div>
  );
}

export function ChatComposite() {
  return (
    <div className="relative mx-auto h-[300px] w-full max-w-[460px]" aria-hidden>
      <div className="absolute inset-x-6 top-0 rounded-[22px] bg-surface p-4 shadow-xl ring-1 ring-line">
        <div className="flex items-center gap-2 border-b border-line pb-3">
          <span className="grid size-8 place-items-center rounded-full bg-[#ffe3cf] text-[11px] font-bold text-[#a3480b]">
            TA
          </span>
          <p className="text-[13px] font-semibold">Tobi A.</p>
          <span className="ml-auto text-[11px] text-muted">Moremi Hall</span>
        </div>
        <p className="mt-3 w-fit max-w-[75%] rounded-2xl rounded-tl-md bg-accent-soft px-3 py-2 text-[12.5px]">
          Hi! Is the denim jacket still available in L?
        </p>
        <p className="mt-2 ml-auto w-fit max-w-[75%] rounded-2xl rounded-tr-md bg-surface-2 px-3 py-2 text-[12.5px]">
          Yes it is. I can deliver to Moremi after 4pm.
        </p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {["It's available", "Delivery is ₦500", "Ready tomorrow"].map((c) => (
            <span
              key={c}
              className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-medium ring-1 ring-line"
            >
              <Sparkles className="size-3 text-chart-violet" /> {c}
            </span>
          ))}
        </div>
      </div>
      <div className="absolute right-0 bottom-6 flex items-center gap-2 rounded-2xl bg-surface px-3 py-2.5 shadow-lg ring-1 ring-line">
        <Truck className="size-4 text-chart-green" />
        <span className="text-[12px] font-medium">Out for delivery</span>
      </div>
      <div className="absolute bottom-10 left-0 grid size-11 place-items-center rounded-2xl bg-chart-blue text-white shadow-lg">
        <MessageCircle className="size-5" />
      </div>
    </div>
  );
}
