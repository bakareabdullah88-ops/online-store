"use client";

import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/stores/toast";

export function ShareButton({ title, text, path, label = "Share" }: { title: string; text?: string; path: string; label?: string }) {
  const share = async () => {
    const url = new URL(path, window.location.origin).toString();
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied", { description: "Paste it in your hall group chat." });
    } catch {
      toast.error("Couldn't copy the link", { description: url });
    }
  };
  return (
    <Button variant="secondary" size="md" leadingIcon={<Share2 className="size-4.5" />} onClick={() => void share()}>
      {label}
    </Button>
  );
}
