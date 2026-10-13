import { cn } from "@/lib/cn";

/** Semicircle of ticks, filled from the left by `value` (0–100). Image 2's performance gauge. */
export function Gauge({
  value,
  size = 64,
  ticks = 22,
  className,
  label,
}: {
  value: number;
  size?: number;
  ticks?: number;
  className?: string;
  label?: string;
}) {
  const lit = Math.round((Math.max(0, Math.min(100, value)) / 100) * ticks);
  const r1 = 40;
  const r2 = 28;
  return (
    <svg
      viewBox="0 0 100 54"
      width={size}
      height={(size * 54) / 100}
      className={cn("shrink-0 overflow-visible", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {Array.from({ length: ticks }, (_, i) => {
        const a = Math.PI - (i / (ticks - 1)) * Math.PI;
        const x1 = 50 + Math.cos(a) * r2;
        const y1 = 50 - Math.sin(a) * r2;
        const x2 = 50 + Math.cos(a) * r1;
        const y2 = 50 - Math.sin(a) * r1;
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            strokeWidth={4.2}
            strokeLinecap="round"
            stroke={i < lit ? "var(--chart-green)" : "var(--chart-track)"}
            style={{ transition: `stroke 0.3s ${i * 18}ms` }}
          />
        );
      })}
    </svg>
  );
}
