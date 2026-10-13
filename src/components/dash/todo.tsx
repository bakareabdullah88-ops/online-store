import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

export type Todo = { id: string; label: string; detail: string; href: string; count: number };

/** Ring that fills as a task gets done (video: "Priority tasks"). */
function Ring({ done }: { done: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={cn("size-[18px] shrink-0", done ? "text-success" : "text-accent")}
      aria-hidden
    >
      <circle
        cx="10"
        cy="10"
        r="8"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.2"
        strokeWidth="2"
      />
      {done ? (
        <path
          d="M6 10.5l2.5 2.5L14 7.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <circle
          cx="10"
          cy="10"
          r="8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="12 50"
          strokeLinecap="round"
          className="origin-center animate-[spin_2.4s_linear_infinite]"
        />
      )}
    </svg>
  );
}

export function TodoList({ items }: { items: Todo[] }) {
  return (
    <ul className="flex flex-col gap-1">
      {items.map((t) => {
        const done = t.count === 0;
        return (
          <li key={t.id}>
            <Link
              href={t.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-surface",
                !done && "bg-surface shadow-xs ring-1 ring-line",
              )}
            >
              <Ring done={done} />
              <span className="min-w-0 flex-1">
                <span
                  className={cn("block truncate text-[13.5px] font-semibold", done && "text-muted")}
                >
                  {t.label}
                </span>
                <span className="block truncate text-[12px] text-muted">
                  {done ? "All clear" : t.detail}
                </span>
              </span>
              {!done && (
                <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11.5px] font-semibold text-accent tabular">
                  {t.count}
                </span>
              )}
              <ChevronRight className="size-4 text-faint" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
