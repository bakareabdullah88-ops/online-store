"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/controls";
import { SegmentedControl } from "@/components/ui/tabs";
import { emphasis as currentEmphasis, fontNames } from "@/config/fonts";
import { formatNaira } from "@/domain/money";
import { cn } from "@/lib/cn";
import { bodyCandidates, displayCandidates, type FontCandidate } from "./font-candidates";

type Emphasis = "upright" | "italic";

function pick(list: FontCandidate[], family: string): FontCandidate {
  return list.find((f) => f.family === family) ?? list[0]!;
}

function loaderCall(name: string, f: FontCandidate, variable: string, italic: boolean) {
  const lines = [
    `export const ${name} = ${f.importName}({`,
    `  variable: "${variable}",`,
    `  subsets: ["latin"],`,
    ...(f.weight ? [`  weight: "${f.weight}",`] : []),
    ...(name === "displayFont"
      ? [`  style: [${italic ? `"normal", "italic"` : `"normal"`}],`]
      : []),
    `  display: "swap",`,
    `});`,
  ];
  return lines.join("\n");
}

function snippet(display: FontCandidate, body: FontCandidate, emphasis: Emphasis) {
  const imports = [...new Set([display.importName, body.importName, "Geist_Mono"])].sort();
  return [
    `// src/config/fonts.ts`,
    `import { ${imports.join(", ")} } from "next/font/google";`,
    ``,
    loaderCall("displayFont", display, "--font-display-face", emphasis === "italic"),
    ``,
    loaderCall("bodyFont", body, "--font-body-face", false),
    ``,
    `// monoFont stays as it is`,
    ``,
    `export const fontNames = {`,
    `  display: "${display.family}",`,
    `  body: "${body.family}",`,
    `  mono: "Geist Mono",`,
    `} as const;`,
    ``,
    `export const emphasis: "upright" | "italic" = "${emphasis}";`,
  ].join("\n");
}

function Option({
  font,
  active,
  onSelect,
  sample,
  display,
}: {
  font: FontCandidate;
  active: boolean;
  onSelect: () => void;
  sample: string;
  display?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-4 rounded-md px-4 py-3 text-left transition-colors",
        active ? "bg-primary text-on-primary" : "bg-surface hairline hover:bg-ink/[0.03]",
      )}
    >
      <span
        className={cn(
          "w-16 shrink-0 leading-none",
          display ? "text-[34px]" : "text-[22px] font-medium",
        )}
        style={{ fontFamily: `var(${font.cssVar})` }}
        aria-hidden
      >
        {sample}
      </span>
      <span className="min-w-0">
        <span className="block text-small font-semibold">{font.family}</span>
        <span className={cn("block text-[12px]", active ? "text-on-primary/80" : "text-muted")}>
          {font.note}
        </span>
      </span>
      {active && <Check className="ml-auto size-4 shrink-0" aria-hidden />}
    </button>
  );
}

/**
 * Try display and body fonts live, then copy the exact config into
 * src/config/fonts.ts. Previewing never changes the saved fonts.
 */
export function FontLab() {
  const [display, setDisplay] = useState(() => pick(displayCandidates, fontNames.display));
  const [body, setBody] = useState(() => pick(bodyCandidates, fontNames.body));
  const [emphasis, setEmphasis] = useState<Emphasis>(currentEmphasis);
  const [wholePage, setWholePage] = useState(false);
  const [copied, setCopied] = useState(false);

  // "Preview on this whole page": swap the faces on <html> until switched off or you leave.
  useEffect(() => {
    if (!wholePage) return;
    const html = document.documentElement;
    const classes = [display.className, body.className];
    const prevEmphasis = html.dataset.emphasis;
    html.classList.add(...classes);
    html.style.setProperty("--font-display-face", `var(${display.cssVar})`);
    html.style.setProperty("--font-body-face", `var(${body.cssVar})`);
    html.dataset.emphasis = emphasis;
    return () => {
      html.classList.remove(...classes);
      html.style.removeProperty("--font-display-face");
      html.style.removeProperty("--font-body-face");
      if (prevEmphasis) html.dataset.emphasis = prevEmphasis;
    };
  }, [wholePage, display, body, emphasis]);

  const code = snippet(display, body, emphasis);
  const unchanged =
    display.family === fontNames.display &&
    body.family === fontNames.body &&
    emphasis === currentEmphasis;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className={cn(
        "grid gap-8",
        ...displayCandidates.map((f) => f.className),
        ...bodyCandidates.map((f) => f.className),
      )}
    >
      <p className="max-w-2xl text-body text-muted">
        Pick a headline font and a text font to preview them. Nothing is saved: when you like a
        pair, copy the config into{" "}
        <code className="font-mono text-small text-ink">src/config/fonts.ts</code> and push. Vercel
        redeploys with the new fonts.
      </p>

      <div className="grid gap-8 lg:grid-cols-2">
        <div role="group" aria-label="Headline font">
          <h3 className="mb-3 eyebrow text-muted">Headlines</h3>
          <div className="grid gap-2">
            {displayCandidates.map((f) => (
              <Option
                key={f.family}
                font={f}
                display
                sample="Ag"
                active={f.family === display.family}
                onSelect={() => setDisplay(f)}
              />
            ))}
          </div>
        </div>
        <div className="grid content-start gap-6">
          <div role="group" aria-label="Text font">
            <h3 className="mb-3 eyebrow text-muted">Text</h3>
            <div className="grid gap-2">
              {bodyCandidates.map((f) => (
                <Option
                  key={f.family}
                  font={f}
                  sample="Ag"
                  active={f.family === body.family}
                  onSelect={() => setBody(f)}
                />
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-3 eyebrow text-muted">Emphasised words</h3>
            <SegmentedControl<Emphasis>
              label="Emphasis style"
              value={emphasis}
              onChange={setEmphasis}
              options={[
                { value: "upright", label: "Upright" },
                { value: "italic", label: "Italic" },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Live preview */}
      <div
        className={cn(
          "rounded-lg bg-surface p-6 hairline md:p-10",
          emphasis === "upright" ? "[&_em]:not-italic" : "[&_em]:italic",
        )}
        style={{
          ["--font-display-face" as string]: `var(${display.cssVar})`,
          fontFamily: `var(${body.cssVar})`,
        }}
      >
        <p className="flex items-center gap-2 eyebrow text-muted">
          <span className="size-1.5 rounded-full bg-accent" aria-hidden />
          Preview
        </p>
        <p className="mt-4 font-display text-display-lg text-balance text-ink">
          Buy from the brands <em className="text-accent">in your hostel.</em>
        </p>
        <p className="mt-4 max-w-xl text-body-lg text-muted">
          Hand-dyed tees, party jollof, shea butter and past questions, made by students on your
          campus. Pick up between lectures or get it delivered to your room.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <span className="font-display text-display-sm text-ink">{formatNaira(1_250_000)}</span>
          <Button>Add to bag</Button>
          <Button variant="secondary">Open your shop</Button>
        </div>
      </div>

      <Switch
        checked={wholePage}
        onCheckedChange={setWholePage}
        label="Preview on this whole page"
        description="Swaps the fonts across the design system until you switch it off or leave the page."
      />

      <div className="overflow-hidden rounded-lg bg-primary text-on-primary">
        <div className="flex items-center justify-between gap-4 border-b border-on-primary/15 px-5 py-3">
          <span className="text-small font-medium">
            {unchanged ? "This is the current setup" : "Paste into src/config/fonts.ts"}
          </span>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => void copy()}
            leadingIcon={copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          >
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
        <pre
          className="overflow-x-auto p-5 font-mono text-[12.5px] leading-relaxed"
          tabIndex={0}
          aria-label="Font configuration"
        >
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}
