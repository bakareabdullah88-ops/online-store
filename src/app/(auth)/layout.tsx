import { ProductArt } from "@/components/art/product-art";
import { Logo } from "@/components/shell/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_minmax(0,560px)] xl:grid-cols-[1fr_640px]">
      <aside className="relative hidden overflow-hidden bg-canvas-sunk lg:block" aria-hidden>
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-3 p-3 opacity-95">
          <div className="col-span-2 row-span-2 overflow-hidden rounded-lg">
            <ProductArt motif="jacket" palette="sand" seed={3} className="size-full" />
          </div>
          <div className="overflow-hidden rounded-lg">
            <ProductArt motif="cookie" palette="rose" seed={8} className="size-full" />
          </div>
          <div className="overflow-hidden rounded-lg">
            <ProductArt motif="earring" palette="plum" seed={5} className="size-full" />
          </div>
          <div className="overflow-hidden rounded-lg">
            <ProductArt motif="poster" palette="sea" seed={2} className="size-full" />
          </div>
          <div className="overflow-hidden rounded-lg">
            <ProductArt motif="drink" palette="ochre" seed={6} className="size-full" />
          </div>
          <div className="overflow-hidden rounded-lg">
            <ProductArt motif="book" palette="sage" seed={1} className="size-full" />
          </div>
        </div>
        <div className="absolute inset-x-6 bottom-6 rounded-lg bg-surface/92 p-6 backdrop-blur-md">
          <p className="font-display text-display-sm text-balance">
            “I sold out my first drop in a weekend, all to people from my hall.”
          </p>
          <p className="mt-3 text-small text-muted">Tolu, Àdìrẹ Lab · UNILAG</p>
        </div>
      </aside>
      <div className="flex flex-col">
        <div className="flex h-16 items-center px-6 md:px-10">
          <Logo />
        </div>
        <div className="flex flex-1 items-start justify-center px-6 pt-6 pb-16 md:items-center md:px-10">
          {children}
        </div>
      </div>
    </div>
  );
}
