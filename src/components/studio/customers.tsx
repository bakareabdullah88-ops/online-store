"use client";

import { useSearchParams } from "next/navigation";
import { Receipt, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { NavPageHeader } from "@/components/app/nav-header";
import {
  DataTable,
  FilterMenu,
  PersonChip,
  StatusTag,
  type Column,
} from "@/components/table/data-table";
import { TableEmpty } from "@/components/table/empty";
import { formatNaira } from "@/domain/money";
import { formatDate, formatRelative } from "@/lib/format";
import { useNow } from "@/lib/hooks";
import { useCustomers } from "@/queries/studio";
import type { Customer } from "@/services/contracts";

type Kind = "all" | "repeat" | "new";

export function StudioCustomers() {
  const { data, isPending } = useCustomers();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [kind, setKind] = useState<Kind>("all");
  const now = useNow(60_000);
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (data ?? []).filter(
      (c) =>
        (kind === "all" || (kind === "repeat" ? c.orders > 1 : c.orders === 1)) &&
        (!t || c.name.toLowerCase().includes(t) || c.campusName.toLowerCase().includes(t)),
    );
  }, [data, q, kind]);
  const repeat = (data ?? []).filter((c) => c.orders > 1).length;

  const columns: Column<Customer>[] = [
    {
      key: "name",
      header: "Customer",
      csv: (c) => c.name,
      cell: (c) => (
        <span className="flex items-center gap-2">
          <PersonChip name={c.name} />
          {c.orders > 2 && <StatusTag tone="violet">Regular</StatusTag>}
        </span>
      ),
    },
    {
      key: "campus",
      header: "Campus",
      csv: (c) => c.campusName,
      cell: (c) => <span className="text-ink-2">{c.campusName || "–"}</span>,
    },
    {
      key: "orders",
      header: "Orders",
      align: "right",
      csv: (c) => c.orders,
      cell: (c) => <span className="tabular">{c.orders}</span>,
    },
    {
      key: "spent",
      header: "Spent",
      align: "right",
      csv: (c) => c.spentKobo / 100,
      cell: (c) => <span className="font-semibold tabular">{formatNaira(c.spentKobo)}</span>,
    },
    {
      key: "last",
      header: "Last order",
      align: "right",
      csv: (c) => c.lastOrderAt,
      cell: (c) => (
        <span className="text-ink-2">
          {now ? formatRelative(c.lastOrderAt, now) : formatDate(c.lastOrderAt)}
        </span>
      ),
    },
  ];

  return (
    <div>
      <NavPageHeader
        title="Customers"
        description={
          data
            ? `${data.length} ${data.length === 1 ? "person has" : "people have"} ordered from you. ${repeat} came back for more.`
            : "People who've ordered from you."
        }
      />
      <DataTable
        label="Customers"
        loading={isPending}
        rows={rows}
        columns={columns}
        getId={(c) => c.userId}
        rowLabel={(c) => c.name}
        exportName="customers"
        search={{ value: q, onChange: setQ, placeholder: "Search customers…" }}
        filters={
          <FilterMenu<Kind>
            label="Everyone"
            value={kind}
            onChange={setKind}
            options={[
              { value: "all", label: "Everyone" },
              { value: "repeat", label: "Ordered more than once" },
              { value: "new", label: "First-time buyers" },
            ]}
          />
        }
        rowActions={(c) => [
          {
            label: "See their orders",
            icon: <Receipt />,
            href: `/studio/orders?q=${encodeURIComponent(c.name)}`,
          },
        ]}
        card={(c) => (
          <div>
            <PersonChip name={c.name} />
            <p className="mt-1.5 text-[12.5px] text-muted tabular">
              {c.campusName} · {c.orders} {c.orders === 1 ? "order" : "orders"} ·{" "}
              {formatNaira(c.spentKobo)}
            </p>
          </div>
        )}
        empty={
          data?.length ? (
            <TableEmpty
              icon={Users}
              title="No one matches"
              body="Try a different name or filter."
            />
          ) : (
            <TableEmpty
              icon={Users}
              title="No customers yet"
              body="Your first customer will appear here after their order."
            />
          )
        }
      />
    </div>
  );
}
