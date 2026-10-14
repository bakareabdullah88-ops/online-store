"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { AppImage } from "@/components/ui/app-image";
import { useMode } from "@/components/shell/mode";
import { useCurtain } from "@/components/shell/mode-curtain";
import { isActive as orderIsActive } from "@/domain/orders";
import { formatCompact } from "@/lib/format";
import { greet } from "@/lib/greeting";
import { useCampus } from "@/queries/catalog";
import { useMyOrders } from "@/queries/orders";
import { useSession } from "@/queries/session";
import { useMyBrand, useStudioOrders } from "@/queries/studio";
import { useBagCount } from "@/stores/bag";
import { UserAvatar } from "./user-avatar";

const SHOW_MS = 6500;

/**
 * The "you've arrived" moment after switching between buying and selling: who
 * you are on this side, what's waiting, and one useful next step. It tucks
 * itself away after a few seconds (paused while the pointer is on it).
 */
export function ArrivalBanner() {
  const arrival = useCurtain((s) => s.arrival);
  const mode = useMode();
  const reduce = useReducedMotion();
  const { user } = useSession();
  const { data: brand } = useMyBrand();
  const campus = useCampus(user?.campusId);
  const shopOrders = useStudioOrders().data;
  const myOrders = useMyOrders().data;
  const bag = useBagCount();
  const [paused, setPaused] = useState(false);
  const firstName = user?.name.split(" ")[0] ?? "there";
  // A fresh greeting for each arrival, picked when the card appears.
  const [greeting, setGreeting] = useState(() => `Hi, ${firstName}`);

  const show = !!arrival && arrival.mode === mode && !!user;
  const id = arrival?.id;
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- a new greeting per arrival
    if (id) setGreeting(greet(firstName));
  }, [id, firstName]);
  useEffect(() => {
    if (!show || paused) return;
    const t = window.setTimeout(() => useCurtain.setState({ arrival: null }), SHOW_MS);
    return () => window.clearTimeout(t);
  }, [show, paused, id]);

  const close = () => useCurtain.setState({ arrival: null });
  const selling = mode === "selling";
  const waiting = shopOrders?.filter((o) => o.status === "placed").length ?? 0;
  const onTheWay = myOrders?.filter((o) => orderIsActive(o.status)).length ?? 0;

  const details: string[] = selling
    ? [
        brand && brand.ratingCount > 0 ? `★ ${brand.rating.toFixed(1)}` : null,
        brand ? `${formatCompact(brand.followerCount)} followers` : null,
        waiting ? `${waiting} new ${waiting === 1 ? "order" : "orders"}` : "No new orders",
      ].filter((d): d is string => !!d)
    : [
        campus ? `Shopping at ${campus.shortName}` : null,
        onTheWay ? `${onTheWay} ${onTheWay === 1 ? "order" : "orders"} on the way` : null,
        bag ? `${bag} in your bag` : null,
      ].filter((d): d is string => !!d);

  const cta = selling
    ? waiting
      ? { href: "/studio/orders", label: `Review ${waiting === 1 ? "order" : "orders"}` }
      : { href: "/studio/products/new", label: "Add a product" }
    : onTheWay
      ? { href: "/orders", label: "Track orders" }
      : { href: "/explore", label: "Discover" };

  return (
    <AnimatePresence>
      {show && (
        <motion.section
          key={id}
          role="status"
          aria-live="polite"
          className="px-4 pt-4 md:px-6"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: -14, height: 0 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, height: "auto" }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10, height: 0, paddingTop: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          onPointerEnter={() => setPaused(true)}
          onPointerLeave={() => setPaused(false)}
        >
          <div className="relative overflow-hidden rounded-xl border border-[color-mix(in_oklab,var(--accent)_20%,var(--line))] bg-[color-mix(in_oklab,var(--accent)_5%,var(--surface))]">
            <div className="relative flex items-center gap-3.5 p-3.5 md:gap-4 md:p-4">
              <motion.span
                className="relative shrink-0"
                initial={reduce ? false : { scale: 0.6, rotate: -8, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 380, damping: 16, delay: 0.08 }}
              >
                {selling && brand ? (
                  <span className="block size-11 overflow-hidden rounded-xl md:size-12">
                    <AppImage image={brand.logo} alt="" variant="logo" name={brand.name} />
                  </span>
                ) : (
                  <UserAvatar size={48} className="ring-2 ring-accent/30" />
                )}
              </motion.span>

              <div className="min-w-0 flex-1">
                <motion.p
                  className="text-[11px] font-semibold tracking-[0.1em] text-accent-ink uppercase"
                  initial={reduce ? false : { opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.14 }}
                >
                  {selling ? "You're in your shop" : "You're shopping"}
                </motion.p>
                <motion.h2
                  className="truncate text-[19px] leading-tight font-bold tracking-[-0.025em] md:text-[22px]"
                  initial={reduce ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  {selling ? (brand?.name ?? "Your shop") : greeting}
                </motion.h2>
                {details.length > 0 && (
                  <motion.p
                    className="mt-0.5 line-clamp-2 text-[13px] text-ink-2 sm:truncate"
                    initial={reduce ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    {details.join(" · ")}
                  </motion.p>
                )}
              </div>

              <motion.div
                className="hidden sm:block"
                initial={reduce ? false : { opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 }}
              >
                <Link
                  href={cta.href}
                  onClick={close}
                  className="inline-flex h-10 pressable items-center gap-1.5 rounded-full bg-accent px-4 text-[13.5px] font-semibold text-on-accent hover:brightness-110"
                >
                  {cta.label} <ArrowRight className="size-4" />
                </Link>
              </motion.div>
              <button
                type="button"
                onClick={close}
                aria-label="Dismiss"
                className="grid size-8 shrink-0 pressable place-items-center rounded-full text-ink-2 hover:bg-ink/[0.06]"
              >
                <X className="size-4" />
              </button>
            </div>
            {/* Phones: the next step sits under the text. */}
            <div className="relative px-3.5 pb-3.5 sm:hidden">
              <Link
                href={cta.href}
                onClick={close}
                className="flex h-10 pressable items-center justify-center gap-1.5 rounded-full bg-accent text-[13.5px] font-semibold text-on-accent"
              >
                {cta.label} <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
