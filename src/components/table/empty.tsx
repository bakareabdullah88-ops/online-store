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
    <div className="card flex flex-col items-center py-16 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-ink/[0.05]">
        <Icon className="size-6 text-ink-2" />
      </span>
      <h2 className="mt-5 text-[17px] font-semibold">{title}</h2>
      <p className="mt-1.5 max-w-sm text-small text-muted">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
