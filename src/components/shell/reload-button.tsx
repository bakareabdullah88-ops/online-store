"use client";

import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReloadButton({ label = "Try again" }: { label?: string }) {
  return (
    <Button
      leadingIcon={<RotateCw className="size-4.5" />}
      onClick={() => window.location.reload()}
    >
      {label}
    </Button>
  );
}
