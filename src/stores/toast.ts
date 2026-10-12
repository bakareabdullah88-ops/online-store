import { create } from "zustand";

export type ToastTone = "neutral" | "success" | "danger" | "info";

export type Toast = {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
  action?: { label: string; onClick: () => void };
  /** ms; 0 = sticky */
  duration: number;
};

type ToastState = {
  toasts: Toast[];
  push: (
    t: Omit<Toast, "id" | "tone" | "duration"> & Partial<Pick<Toast, "tone" | "duration">>,
  ) => string;
  dismiss: (id: string) => void;
};

let counter = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (t) => {
    const id = `t${++counter}`;
    const toast: Toast = { tone: "neutral", duration: t.action ? 6000 : 4000, ...t, id };
    // Keep at most 3 visible; newest on top.
    set((s) => ({ toasts: [toast, ...s.toasts].slice(0, 3) }));
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Imperative helper usable from event handlers and mutations. */
export const toast = Object.assign(
  (title: string, opts: Partial<Omit<Toast, "id" | "title">> = {}) =>
    useToastStore.getState().push({ title, ...opts }),
  {
    success: (title: string, opts: Partial<Omit<Toast, "id" | "title" | "tone">> = {}) =>
      useToastStore.getState().push({ title, ...opts, tone: "success" }),
    error: (title: string, opts: Partial<Omit<Toast, "id" | "title" | "tone">> = {}) =>
      useToastStore.getState().push({ title, ...opts, tone: "danger" }),
    info: (title: string, opts: Partial<Omit<Toast, "id" | "title" | "tone">> = {}) =>
      useToastStore.getState().push({ title, ...opts, tone: "info" }),
    dismiss: (id: string) => useToastStore.getState().dismiss(id),
  },
);
