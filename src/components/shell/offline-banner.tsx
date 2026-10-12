"use client";

import { AnimatePresence, motion } from "motion/react";
import { WifiOff } from "lucide-react";
import { useSyncExternalStore } from "react";
import { spring } from "@/design/motion";

function subscribe(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

export function useOnline() {
  return useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
}

/** Your data lives on this device, so the app keeps working offline; we just say so. */
export function OfflineBanner() {
  const online = useOnline();
  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          role="status"
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={spring.smooth}
          className="fixed inset-x-0 top-0 z-(--z-toast) flex justify-center p-2"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-small text-on-primary shadow-lg">
            <WifiOff className="size-4" />
            You&apos;re offline. Browsing still works; changes save on this device.
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
