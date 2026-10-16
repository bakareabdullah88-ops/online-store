"use client";

import { ChevronDown } from "lucide-react";
import { Popover } from "@/components/ui/overlay";
import { focusCampusId } from "@/config/brand";
import { seedCampuses } from "@/services/mock/seed/campuses";

const campuses = seedCampuses();
const live = campuses.find((c) => c.id === focusCampusId);
const next = campuses.filter((c) => c.id !== focusCampusId);

/** "Live at UNILAG": tap it to see which campuses are coming next. */
export function CampusBadge() {
  return (
    <Popover
      align="center"
      className="w-[min(320px,calc(100vw-32px))] bg-white p-2 text-left text-[#1b1f3b] ring-1 ring-[#1b1f3b]/10"
      trigger={
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-[13px] font-bold ring-1 ring-[#1b1f3b]/10 transition-colors hover:bg-[#eef1ff]"
        >
          <span className="size-2 rounded-full bg-[#3ddc97]" aria-hidden />
          Live at {live?.shortName ?? "UNILAG"}
          <span className="font-semibold text-[#5a5f78]">· {next.length} more coming</span>
          <ChevronDown className="size-3.5" aria-hidden />
        </button>
      }
    >
      <ul className="flex flex-col divide-y divide-[#1b1f3b]/[0.08]">
        {live && (
          <li className="flex items-center justify-between gap-3 px-2.5 py-2.5">
            <span className="min-w-0">
              <span className="block truncate text-[14px] font-bold">{live.name}</span>
              <span className="block text-[12.5px] text-[#5a5f78]">
                {live.city}, {live.state}
              </span>
            </span>
            <span className="shrink-0 rounded-full bg-[#dff5ea] px-2.5 py-0.5 text-[12px] font-bold text-[#0f7a4b]">
              Live
            </span>
          </li>
        )}
        {next.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-3 px-2.5 py-2.5">
            <span className="min-w-0">
              <span className="block truncate text-[14px] font-semibold">{c.name}</span>
              <span className="block text-[12.5px] text-[#5a5f78]">
                {c.city}, {c.state}
              </span>
            </span>
            <span className="shrink-0 rounded-full bg-[#f4f5f8] px-2.5 py-0.5 text-[12px] font-semibold text-[#5a5f78]">
              Coming soon
            </span>
          </li>
        ))}
      </ul>
    </Popover>
  );
}
