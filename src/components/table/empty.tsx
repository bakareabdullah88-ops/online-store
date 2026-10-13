import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** Empty list state with an icon tile, a line of help and an action. */
export function TableEmpty({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="ring-dashed flex flex-col items-center rounded-[24px] px-6 py-16 text-center ring-1 ring-line">
      <span className="grid size-14 place-items-center rounded-2xl bg-surface-2 ring-1 ring-line">
        <Icon className="size-6 text-ink-2" />
      </span>
      <h2 className="mt-5 text-[17px] font-semibold">{title}</h2>
      <p className="mt-1.5 max-w-sm text-small text-muted">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
