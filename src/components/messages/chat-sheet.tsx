"use client";

import { useEffect, useState } from "react";
import { ResponsiveSheet } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useStartThread } from "@/queries/inbox";
import { errorMessage } from "@/services/errors";
import { toast } from "@/stores/toast";
import { Conversation } from "./conversation";

/** "Message seller" sheet: starts (or resumes) a thread with a brand. */
export function ChatSheet({
  open,
  onOpenChange,
  brandId,
  brandName,
  productId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  brandId: string;
  brandName: string;
  productId?: string;
}) {
  const start = useStartThread();
  const [threadId, setThreadId] = useState<string | null>(null);
  const { mutate } = start;

  useEffect(() => {
    if (!open || threadId) return;
    mutate(
      { brandId, ...(productId ? { productId } : {}) },
      {
        onSuccess: (t) => setThreadId(t.id),
        onError: (e) => {
          toast.error(errorMessage(e));
          onOpenChange(false);
        },
      },
    );
  }, [open, threadId, brandId, productId, mutate, onOpenChange]);

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title={brandName}
      description="Usually replies within an hour"
      width="md"
    >
      <div className="flex h-[min(60dvh,560px)] flex-col md:h-[calc(100dvh-180px)]">
        {threadId ? (
          <Conversation threadId={threadId} as="buyer" className="h-full" />
        ) : (
          <div className="flex flex-col gap-3 pt-4" aria-hidden>
            <Skeleton className="h-10 w-2/3" rounded="lg" />
            <Skeleton className="ml-auto h-10 w-1/2" rounded="lg" />
          </div>
        )}
      </div>
    </ResponsiveSheet>
  );
}
