"use client";

import { FontPicker } from "@/components/ui/font-picker";
import { SegmentedControl } from "@/components/ui/tabs";
import { useTheme, type ThemePreference } from "@/components/providers/theme";
import { cn } from "@/lib/cn";

/** Theme and font style, for anyone (signed in or not). Saved in this browser. */
export function AppearanceControls({ className }: { className?: string }) {
  const { preference, setPreference } = useTheme();
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-small font-medium">Theme</span>
        <SegmentedControl<ThemePreference>
          size="sm"
          label="Theme"
          value={preference}
          onChange={setPreference}
          options={[
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
            { value: "system", label: "Auto" },
          ]}
        />
      </div>
      <div>
        <p className="mb-2 text-small font-medium">Font style</p>
        <FontPicker variant="chips" />
      </div>
    </div>
  );
}
