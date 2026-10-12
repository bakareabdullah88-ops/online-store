"use client";

import { useDeferredValue, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchInput } from "@/components/ui/input";
import { Avatar } from "@/components/ui/misc";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNaira } from "@/domain/money";
import { formatRelative } from "@/lib/format";
import { useNow } from "@/lib/hooks";
import { useCustomers } from "@/queries/studio";
import { StudioHeaderBlock } from "./studio-shell";

export function StudioCustomers() {
  const { data, isPending } = useCustomers();
  const [q, setQ] = useState("");
  const dq = useDeferredValue(q).toLowerCase();
  const now = useNow(60_000);
  const rows = (data ?? []).filter((c) => !dq || c.name.toLowerCase().includes(dq) || c.campusName.toLowerCase().includes(dq));
  const repeat = (data ?? []).filter((c) => c.orders > 1).length;
  return (
    <div>
      <StudioHeaderBlock
        eyebrow="Customers"
        title="Customers"
        description={data ? `${data.length} people have ordered from you. ${repeat} came back for more.` : "People who've ordered from you."}
      />
      <div className="mb-4 max-w-sm">
        <SearchInput value={q} onChange={(e) => setQ(e.target.value)} onClear={() => setQ("")} placeholder="Search by name or campus" aria-label="Search customers" />
      </div>
      {isPending ? (
        <Skeleton className="h-80 w-full" rounded="lg" />
      ) : !data?.length ? (
        <EmptyState illustration="customers" title="No customers yet" body="Your first customer will appear here after their order." />
      ) : rows.length === 0 ? (
        <EmptyState compact illustration="search" title="No one matches" body="Try a different name." />
      ) : (
        <div className="overflow-x-auto rounded-lg bg-surface hairline">
          <table className="w-full min-w-[600px] text-small">
            <thead>
              <tr className="border-b border-line text-left text-muted">
                <th scope="col" className="eyebrow px-5 py-3 font-medium">Customer</th>
                <th scope="col" className="eyebrow px-3 py-3 font-medium">Campus</th>
                <th scope="col" className="eyebrow px-3 py-3 text-right font-medium">Orders</th>
                <th scope="col" className="eyebrow px-3 py-3 text-right font-medium">Spent</th>
                <th scope="col" className="eyebrow px-5 py-3 text-right font-medium">Last order</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.userId} className="border-b border-line last:border-0">
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-3">
                      <Avatar name={c.name} size={32} />
                      <span className="font-medium">{c.name}</span>
                      {c.orders > 2 && <span className="rounded-full bg-accent-soft px-2 py-0.5 font-mono text-[10px] uppercase text-accent-ink">Regular</span>}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-muted">{c.campusName}</td>
                  <td className="px-3 py-3 text-right font-mono tabular">{c.orders}</td>
                  <td className="px-3 py-3 text-right font-mono tabular">{formatNaira(c.spentKobo)}</td>
                  <td className="px-5 py-3 text-right text-muted">{now ? formatRelative(c.lastOrderAt, now) : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
