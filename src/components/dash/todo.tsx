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
        />
      )}
    </svg>
  );
}

/**
 * Things to do. By default only the open ones are listed, with their counts,
 * and an "all caught up" line when there are none. `checklist` lists every
 * step instead, ticking off the done ones (for getting started).
 */
export function TodoList({ items, checklist = false }: { items: Todo[]; checklist?: boolean }) {
  const shown = checklist ? items : items.filter((t) => t.count > 0);
  if (shown.length === 0) {
    return (
      <p className="flex items-center gap-2.5 py-2 text-small text-muted">
        <Ring done /> All caught up. New tasks will show up here.
      </p>
    );
  }
  return (
    <ul className="flex flex-col divide-y divide-line-thin">
      {shown.map((t) => {
        const done = t.count === 0;
        return (
          <li key={t.id}>
            <Link
              href={t.href}
              className="flex items-center gap-3 py-3 transition-opacity duration-150 hover:opacity-75"
            >
              <Ring done={done} />
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block truncate text-[13.5px] font-medium",
                    done && "text-muted line-through decoration-line-strong",
                  )}
                >
                  {t.label}
                </span>
                {!done && <span className="block truncate text-[12px] text-muted">{t.detail}</span>}
              </span>
              {!done && !checklist && (
                <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11.5px] font-semibold text-accent-ink tabular">
                  {t.count}
                </span>
              )}
              <ChevronRight className="size-4 text-faint" aria-hidden />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
