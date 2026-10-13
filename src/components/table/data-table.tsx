"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  Minus,
  MoreHorizontal,
  Search,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/ui/overlay";
import type { CardAction } from "@/components/dash/card";
import { spring } from "@/design/motion";
import { cn } from "@/lib/cn";

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** Plain value for CSV export; columns without it are left out. */
  csv?: (row: T) => string | number;
  className?: string;
  align?: "left" | "right" | "center";
};

export type RowAction<T> = Omit<CardAction, "onSelect"> & {
  onSelect?: (row: T) => void;
  danger?: boolean;
  hidden?: boolean;
};

/* -------------------------------- Toolbar --------------------------------- */

/** "All staff ⌄" style filter (image 4). */
export function FilterMenu<V extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: V;
  options: readonly { value: V; label: string }[];
  onChange: (v: V) => void;
}) {
  const current = options.find((o) => o.value === value);
  const isDefault = options[0]?.value === value;
  return (
    <Menu>
      <MenuTrigger asChild>
        <button
          type="button"
          aria-label={`${label}: ${current?.label}`}
          className={cn(
            "flex h-10 items-center gap-2 rounded-xl px-3.5 text-[13.5px] font-medium ring-1 transition-colors",
            isDefault
              ? "bg-surface ring-line hover:ring-line-strong"
              : "bg-accent-soft text-accent ring-accent/30",
          )}
        >
          {isDefault ? label : current?.label}
          <ChevronDown className="size-4 opacity-60" />
        </button>
      </MenuTrigger>
      <MenuContent align="start">
        {options.map((o) => (
          <MenuItem
            key={o.value}
            onSelect={() => onChange(o.value)}
            icon={o.value === value ? <Check /> : <span className="block size-4" />}
          >
            {o.label}
          </MenuItem>
        ))}
      </MenuContent>
    </Menu>
  );
}

export function TableSearch({
  value,
  onChange,
  placeholder = "Search…",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex h-10 min-w-0 items-center gap-2 rounded-xl bg-surface px-3 ring-1 ring-line focus-within:ring-2 focus-within:ring-accent/40 md:w-64">
      <Search className="size-4 shrink-0 text-muted" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder.replace(/…$/, "")}
        className="min-w-0 flex-1 bg-transparent text-[13.5px] outline-none placeholder:text-faint [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="text-muted hover:text-ink"
        >
          <X className="size-3.5" />
        </button>
      )}
    </label>
  );
}

function downloadCsv<T>(name: string, columns: Column<T>[], rows: T[]) {
  const cols = columns.filter((c) => c.csv);
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const body = [cols.map((c) => esc(c.header)), ...rows.map((r) => cols.map((c) => esc(c.csv!(r))))]
    .map((line) => line.join(","))
    .join("\n");
  const url = URL.createObjectURL(new Blob([body], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const exportButton =
  "flex h-10 items-center gap-2 rounded-xl bg-surface px-3.5 text-[13.5px] font-medium ring-1 ring-line transition-colors hover:ring-line-strong";

/* ------------------------------- Checkbox --------------------------------- */

function Box({
  state,
  onClick,
  label,
}: {
  state: "on" | "off" | "some";
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={state === "some" ? "mixed" : state === "on"}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "grid size-[18px] place-items-center rounded-[5px] ring-1 transition-colors",
        state === "off"
          ? "bg-surface ring-line-strong hover:ring-ink"
          : "bg-accent text-on-accent ring-accent",
      )}
    >
      {state === "on" && <Check className="size-3" strokeWidth={3} />}
      {state === "some" && <Minus className="size-3" strokeWidth={3} />}
    </button>
  );
}

/* ------------------------------ Pagination -------------------------------- */

function pages(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | "…")[] = [1];
  const from = Math.max(2, current - 1);
  const to = Math.min(total - 1, current + 1);
  if (from > 2) out.push("…");
  for (let p = from; p <= to; p++) out.push(p);
  if (to < total - 1) out.push("…");
  out.push(total);
  return out;
}

function Pagination({
  page,
  total,
  onChange,
}: {
  page: number;
  total: number;
  onChange: (p: number) => void;
}) {
  if (total <= 1) return null;
  const nav =
    "flex h-9 items-center gap-1.5 rounded-xl px-3 text-[13px] font-medium ring-1 ring-line transition-colors hover:ring-line-strong disabled:pointer-events-none disabled:opacity-40";
  return (
    <nav aria-label="Pages" className="mt-4 flex items-center justify-between gap-3 print:hidden">
      <button
        type="button"
        className={nav}
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
      >
        <ArrowLeft className="size-4" /> <span className="max-sm:hidden">Previous</span>
      </button>
      <ol className="flex items-center gap-1">
        {pages(page, total).map((p, i) =>
          p === "…" ? (
            <li key={`gap-${i}`} className="px-1 text-[12px] text-muted">
              …
            </li>
          ) : (
            <li key={p}>
              <button
                type="button"
                onClick={() => onChange(p)}
                aria-current={p === page ? "page" : undefined}
                aria-label={`Page ${p}`}
                className={cn(
                  "relative grid size-8 place-items-center rounded-lg text-[12.5px] font-medium tabular transition-colors",
                  p === page ? "text-on-accent" : "text-muted hover:text-ink",
                )}
              >
                {p === page && (
                  <motion.span
                    layoutId="table-page"
                    transition={spring.snappy}
                    className="absolute inset-0 rounded-lg bg-accent"
                    aria-hidden
                  />
                )}
                <span className="relative">{p}</span>
              </button>
            </li>
          ),
        )}
      </ol>
      <button
        type="button"
        className={nav}
        disabled={page === total}
        onClick={() => onChange(page + 1)}
      >
        <span className="max-sm:hidden">Next</span> <ArrowRight className="size-4" />
      </button>
    </nav>
  );
}

/* ------------------------------- Row menu --------------------------------- */

function RowMenu<T>({ row, actions, label }: { row: T; actions: RowAction<T>[]; label: string }) {
  const router = useRouter();
  const visible = actions.filter((a) => !a.hidden);
  if (!visible.length) return null;
  return (
    <Menu>
      <MenuTrigger asChild>
        <button
          type="button"
          aria-label={`Actions for ${label}`}
          onClick={(e) => e.stopPropagation()}
          className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-ink/[0.05] hover:text-ink"
        >
          <MoreHorizontal className="size-[18px]" />
        </button>
      </MenuTrigger>
      <MenuContent>
        {visible.map((a, i) => (
          <span key={a.label}>
            {a.danger && i > 0 && <MenuSeparator />}
            <MenuItem
              icon={a.icon}
              danger={a.danger}
              onSelect={() => (a.href ? router.push(a.href) : a.onSelect?.(row))}
            >
              {a.label}
            </MenuItem>
          </span>
        ))}
      </MenuContent>
    </Menu>
  );
}

/* -------------------------------- Table ----------------------------------- */

/**
 * The list view used across the app (image 4): filters, search, export,
 * selection with bulk actions, row menus and numbered pages. Phones get
 * stacked cards when `card` is given.
 */
export function DataTable<T>({
  label,
  rows,
  columns,
  getId,
  rowLabel,
  filters,
  search,
  exportName,
  bulkActions,
  rowActions,
  onRowClick,
  card,
  empty,
  pageSize = 10,
  loading,
}: {
  label: string;
  rows: T[];
  columns: Column<T>[];
  getId: (row: T) => string;
  rowLabel: (row: T) => string;
  filters?: ReactNode;
  search?: { value: string; onChange: (v: string) => void; placeholder?: string };
  exportName?: string;
  bulkActions?: (selected: T[], clear: () => void) => ReactNode;
  rowActions?: (row: T) => RowAction<T>[];
  onRowClick?: (row: T) => void;
  card?: (row: T) => ReactNode;
  empty?: ReactNode;
  pageSize?: number;
  loading?: boolean;
}) {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, totalPages);
  const shown = rows.slice((current - 1) * pageSize, current * pageSize);
  const ids = useMemo(() => new Set(rows.map(getId)), [rows, getId]);
  // Forget selections that are no longer in the list (after filtering or deleting).
  const picked = useMemo(() => rows.filter((r) => selected.has(getId(r))), [rows, selected, getId]);
  const clear = () => setSelected(new Set());
  const pageIds = shown.map(getId);
  const pageState =
    pageIds.every((id) => selected.has(id)) && pageIds.length
      ? "on"
      : pageIds.some((id) => selected.has(id))
        ? "some"
        : "off";
  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set([...s].filter((x) => ids.has(x)));
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const togglePage = () =>
    setSelected((s) => {
      const n = new Set([...s].filter((x) => ids.has(x)));
      if (pageState === "on") pageIds.forEach((id) => n.delete(id));
      else pageIds.forEach((id) => n.add(id));
      return n;
    });
  const selectable = !!bulkActions;
  const alignCls = (a?: Column<T>["align"]) =>
    a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left";

  return (
    <div className="print:text-black">
      {(filters || search || exportName) && (
        <div className="mb-4 flex flex-wrap items-center gap-2 print:hidden">
          {filters}
          <div className="ml-auto flex flex-wrap items-center gap-2 max-md:w-full">
            {search && <TableSearch {...search} />}
            {exportName && (
              <>
                <button
                  type="button"
                  className={exportButton}
                  onClick={() => window.print()}
                  disabled={!rows.length}
                >
                  <FileText className="size-4 text-muted" />{" "}
                  <span className="max-sm:hidden">Export</span> PDF
                </button>
                <button
                  type="button"
                  className={exportButton}
                  onClick={() => downloadCsv(exportName, columns, rows)}
                  disabled={!rows.length}
                >
                  <FileSpreadsheet className="size-4 text-muted" />{" "}
                  <span className="max-sm:hidden">Export</span> CSV
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <AnimatePresence>
        {selectable && picked.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            transition={spring.snappy}
            className="overflow-hidden print:hidden"
          >
            <div className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-on-primary">
              <span className="text-[13.5px] font-semibold">{picked.length} selected</span>
              <button
                type="button"
                onClick={clear}
                className="text-[13px] opacity-70 hover:opacity-100"
              >
                Clear
              </button>
              <div className="ml-auto flex flex-wrap gap-2">{bulkActions!(picked, clear)}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex flex-col gap-2" aria-busy="true" aria-label={`Loading ${label}`}>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-surface-2" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        empty
      ) : (
        <>
          {/* phones */}
          {card && (
            <ul className="flex flex-col gap-2 md:hidden print:hidden" aria-label={label}>
              {shown.map((r) => (
                <li
                  key={getId(r)}
                  className={cn(
                    "flex items-start gap-3 rounded-2xl bg-surface p-3.5 ring-1 ring-line",
                    onRowClick && "cursor-pointer active:bg-surface-2",
                  )}
                  onClick={onRowClick ? () => onRowClick(r) : undefined}
                >
                  <div className="min-w-0 flex-1">{card(r)}</div>
                  {rowActions && (
                    // Menu items render in a portal but their clicks still bubble here.
                    <span onClick={(e) => e.stopPropagation()}>
                      <RowMenu row={r} actions={rowActions(r)} label={rowLabel(r)} />
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
          {/* table */}
          <div
            className={cn(
              "card overflow-x-auto print:overflow-visible print:shadow-none",
              card && "max-md:hidden print:block",
            )}
          >
            <table className="w-full min-w-[760px] text-[13.5px]">
              <caption className="sr-only">{label}</caption>
              <thead>
                <tr className="bg-surface-2 text-left text-[12.5px] font-medium text-ink-2">
                  {selectable && (
                    <th scope="col" className="w-12 py-3.5 pl-4 print:hidden">
                      <Box state={pageState} onClick={togglePage} label="Select all on this page" />
                    </th>
                  )}
                  {columns.map((c) => (
                    <th
                      key={c.key}
                      scope="col"
                      className={cn(
                        "px-3 py-3.5 font-medium whitespace-nowrap",
                        alignCls(c.align),
                        c.className,
                      )}
                    >
                      {c.header}
                    </th>
                  ))}
                  {rowActions && (
                    <th scope="col" className="w-12 pr-3 print:hidden">
                      <span className="sr-only">Actions</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {shown.map((r, i) => {
                  const id = getId(r);
                  const on = selected.has(id);
                  return (
                    <motion.tr
                      key={id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(i * 0.025, 0.25) }}
                      onClick={onRowClick ? () => onRowClick(r) : undefined}
                      className={cn(
                        "border-t border-line transition-colors",
                        on ? "bg-accent-soft/50" : "hover:bg-ink/[0.02]",
                        onRowClick && "cursor-pointer",
                      )}
                    >
                      {selectable && (
                        <td className="py-3.5 pl-4 print:hidden">
                          <Box
                            state={on ? "on" : "off"}
                            onClick={() => toggle(id)}
                            label={`Select ${rowLabel(r)}`}
                          />
                        </td>
                      )}
                      {columns.map((c) => (
                        <td
                          key={c.key}
                          className={cn("px-3 py-3.5 align-middle", alignCls(c.align), c.className)}
                        >
                          {c.cell(r)}
                        </td>
                      ))}
                      {rowActions && (
                        <td
                          className="pr-3 text-right print:hidden"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <RowMenu row={r} actions={rowActions(r)} label={rowLabel(r)} />
                        </td>
                      )}
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={current} total={totalPages} onChange={setPage} />
          <p className="mt-3 text-center text-[12px] text-muted print:hidden">
            Showing {(current - 1) * pageSize + 1}–{Math.min(current * pageSize, rows.length)} of{" "}
            {rows.length}
          </p>
        </>
      )}
    </div>
  );
}

/** Soft outlined status pill (image 4). */
export function StatusTag({
  tone,
  children,
}: {
  tone: "green" | "amber" | "red" | "blue" | "grey" | "violet";
  children: ReactNode;
}) {
  const tones = {
    green: "bg-success-soft text-success ring-success/25",
    amber: "bg-warning-soft text-warning ring-warning/25",
    red: "bg-danger-soft text-danger ring-danger/25",
    blue: "bg-accent-soft text-accent ring-accent/25",
    grey: "bg-ink/[0.05] text-ink-2 ring-line-strong",
    violet:
      "bg-[color-mix(in_oklab,var(--chart-violet)_14%,transparent)] text-chart-violet ring-chart-violet/25",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-medium whitespace-nowrap ring-1",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

/** Avatar + name chip (image 4's guest column). */
export function PersonChip({ name, avatar }: { name: string; avatar?: ReactNode }) {
  return (
    <span className="inline-flex max-w-full items-center gap-2 rounded-full bg-surface py-1 pr-3 pl-1 shadow-xs ring-1 ring-line">
      {avatar ?? (
        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent-soft text-[10.5px] font-semibold text-accent">
          {name
            .split(" ")
            .map((p) => p[0])
            .slice(0, 2)
            .join("")
            .toUpperCase()}
        </span>
      )}
      <span className="truncate font-medium">{name}</span>
    </span>
  );
}
