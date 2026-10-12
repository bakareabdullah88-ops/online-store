"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { addLine, lineId, removeLine, setQuantity, type BagLine } from "@/domain/bag";

type BagState = {
  lines: BagLine[];
  /** Per-brand checkout choices survive navigation between bag and checkout. */
  promoCodes: Record<string, string>;
  add: (line: Omit<BagLine, "addedAt">, stock: number) => void;
  setQuantity: (id: string, quantity: number) => void;
  remove: (id: string) => BagLine | undefined;
  restore: (line: BagLine) => void;
  removeBrand: (brandId: string) => void;
  setPromo: (brandId: string, code: string | null) => void;
  clear: () => void;
};

/**
 * The bag is client UI state (Zustand), persisted to localStorage.
 * Prices are never stored here; they always come from fresh product data.
 * BACKEND-SEAM: sync to a server-side cart for cross-device bags.
 */
export const useBag = create<BagState>()(
  persist(
    (set, get) => ({
      lines: [],
      promoCodes: {},
      add: (line, stock) => set((s) => ({ lines: addLine(s.lines, line, stock, Date.now()) })),
      setQuantity: (id, q) => set((s) => ({ lines: setQuantity(s.lines, id, q) })),
      remove: (id) => {
        const line = get().lines.find((l) => lineId(l) === id);
        set((s) => ({ lines: removeLine(s.lines, id) }));
        return line;
      },
      restore: (line) =>
        set((s) => (s.lines.some((l) => lineId(l) === lineId(line)) ? s : { lines: [...s.lines, line] })),
      removeBrand: (brandId) => set((s) => ({ lines: s.lines.filter((l) => l.brandId !== brandId) })),
      setPromo: (brandId, code) =>
        set((s) => {
          const next = { ...s.promoCodes };
          if (code) next[brandId] = code;
          else delete next[brandId];
          return { promoCodes: next };
        }),
      clear: () => set({ lines: [], promoCodes: {} }),
    }),
    {
      name: "kiosk-bag",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ lines: s.lines, promoCodes: s.promoCodes }),
      skipHydration: true,
    },
  ),
);

export const useBagCount = () => useBag((s) => s.lines.reduce((n, l) => n + l.quantity, 0));
