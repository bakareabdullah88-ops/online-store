"use client";

import { useUi } from "@/stores/ui";

function visibleTarget(): HTMLElement | null {
  const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-bag-target]"));
  return targets.find((t) => t.getClientRects().length > 0 && t.offsetParent !== null) ?? null;
}

/**
 * Signature interaction: a snapshot of the product image arcs into the bag,
 * then the bag icon bumps and its badge springs. Pure transform/opacity
 * via the Web Animations API, so it runs on the compositor.
 */
export function flyToBag(source: HTMLElement | null) {
  const pulse = () => useUi.getState().pulseBag();
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const target = visibleTarget();
  if (!source || !target || reduce) {
    pulse();
    return;
  }
  const from = source.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  const size = Math.min(from.width, from.height, 160);
  const ghost = source.cloneNode(true) as HTMLElement;
  ghost.removeAttribute("id");
  ghost.setAttribute("aria-hidden", "true");
  Object.assign(ghost.style, {
    position: "fixed",
    left: `${from.left + (from.width - size) / 2}px`,
    top: `${from.top + (from.height - size) / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
    margin: "0",
    zIndex: "95",
    pointerEvents: "none",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "var(--shadow-lg)",
    willChange: "transform, opacity",
    viewTransitionName: "none",
  } satisfies Partial<CSSStyleDeclaration>);
  document.body.appendChild(ghost);

  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  const end = 24 / size;
  // Arc: rise first, then fall into the bag.
  const lift = Math.min(-60, dy * 0.35 - 80);
  const anim = ghost.animate(
    [
      { transform: "translate(0,0) scale(1) rotate(0deg)", opacity: 1, borderRadius: "12px" },
      { transform: `translate(${dx * 0.45}px, ${lift}px) scale(${0.55}) rotate(-8deg)`, opacity: 1, offset: 0.45 },
      { transform: `translate(${dx}px, ${dy}px) scale(${end}) rotate(6deg)`, opacity: 0.6, borderRadius: "50%" },
    ],
    { duration: 620, easing: "cubic-bezier(0.45, 0, 0.2, 1)", fill: "forwards" },
  );
  anim.onfinish = () => {
    ghost.remove();
    pulse();
  };
  anim.oncancel = () => ghost.remove();
}
