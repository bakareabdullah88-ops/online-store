import { Check, MapPin, Search, ShoppingBag, Shirt, Truck } from "lucide-react";

/** Coded drawings of the app for the feature rows. Names and prices are examples. */

const panel = "rounded-xl bg-surface ring-1 ring-line";

export function FoundComposite() {
  return (
    <div className="relative mx-auto h-[280px] w-full max-w-[440px]" aria-hidden>
      <div className={`absolute top-2 left-0 w-60 p-3 shadow-sm ${panel}`}>
        <p className="flex items-center gap-2 rounded-md bg-surface-2 px-2.5 py-2 text-[12.5px]">
          <Search className="size-3.5 text-muted" /> thrift jacket
        </p>
        {["thrift jacket near me", "thrift jacket under ₦10k", "denim jacket, size L"].map((s) => (
          <p key={s} className="flex items-center gap-2 px-2.5 py-1.5 text-[12px] text-ink-2">
            <Search className="size-3 text-faint" /> {s}
          </p>
        ))}
      </div>
      <div className={`absolute top-16 right-0 w-56 overflow-hidden shadow-md ${panel}`}>
        <div className="grid h-32 place-items-center bg-surface-2 text-muted">
          <Shirt className="size-12" strokeWidth={1.25} />
        </div>
        <div className="p-3.5">
          <p className="text-[13.5px] font-semibold">Vintage denim jacket</p>
          <p className="mt-0.5 flex items-center gap-1 text-[11.5px] text-muted">
            <MapPin className="size-3" /> 4 min away
          </p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[15px] font-semibold tabular">₦8,500</span>
            <span className="flex h-8 items-center gap-1.5 rounded-md bg-accent px-3 text-[12px] font-semibold text-on-accent">
              <ShoppingBag className="size-3.5" /> Add
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OrderComposite() {
  return (
    <div className="relative mx-auto h-[300px] w-full max-w-[440px]" aria-hidden>
      <div className={`absolute top-4 left-0 w-44 p-3 shadow-sm ${panel}`}>
        {["Placed", "Confirmed", "Out for delivery", "Delivered"].map((s, i) => (
          <p key={s} className="flex items-center gap-2 py-1 text-[12px]">
            <span
              className={`grid size-4 place-items-center rounded-full ${i < 3 ? "bg-success text-white" : "ring-1 ring-line-strong"}`}
            >
              {i < 3 && <Check className="size-2.5" strokeWidth={3} />}
            </span>
            {s}
          </p>
        ))}
      </div>
      <div className={`absolute right-0 bottom-0 w-64 p-4 shadow-md ${panel}`}>
        <p className="text-[12.5px] font-semibold">Order summary</p>
        {[
          ["1×", "Jollof bowl", "₦3,500"],
          ["2×", "Zobo, 50cl", "₦1,600"],
          ["1×", "Delivery", "₦500"],
        ].map(([q, n, p]) => (
          <p key={n} className="mt-2.5 flex items-center gap-2 text-[12px]">
            <span className="text-muted tabular">{q}</span>
            <span className="flex-1">{n}</span>
            <span className="font-medium tabular">{p}</span>
          </p>
        ))}
        <p className="mt-3 flex justify-between border-t border-line pt-3 text-[13px] font-semibold tabular">
          <span>Total</span> <span>₦5,600</span>
        </p>
        <span className="mt-3 flex h-9 items-center justify-center rounded-md bg-primary text-[12.5px] font-semibold text-on-primary">
          Place order · pay on delivery
        </span>
      </div>
    </div>
  );
}

export function ChatComposite() {
  return (
    <div className="relative mx-auto h-[280px] w-full max-w-[440px]" aria-hidden>
      <div className={`absolute inset-x-4 top-0 p-4 shadow-md ${panel}`}>
        <div className="flex items-center gap-2 border-b border-line pb-3">
          <span className="grid size-8 place-items-center rounded-full bg-surface-2 text-[11px] font-semibold text-ink-2 ring-1 ring-line">
            TA
          </span>
          <p className="text-[13px] font-semibold">Buyer</p>
          <span className="ml-auto font-mono text-[11px] text-muted">KMP-7QRT</span>
        </div>
        <p className="mt-3 w-fit max-w-[75%] rounded-lg bg-surface-2 px-3 py-2 text-[12.5px]">
          Is the denim jacket still available in L?
        </p>
        <p className="mt-2 ml-auto w-fit max-w-[75%] rounded-lg bg-accent-soft px-3 py-2 text-[12.5px]">
          Yes. I can deliver to your hall after 4pm.
        </p>
      </div>
      <div
        className={`absolute right-0 bottom-4 flex items-center gap-2 px-3 py-2.5 shadow-sm ${panel}`}
      >
        <Truck className="size-4 text-success" />
        <span className="text-[12px] font-medium">Out for delivery</span>
      </div>
    </div>
  );
}
