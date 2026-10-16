"use client";

import { Popover as RPopover } from "radix-ui";
import { Check, ChevronDown, MapPin, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { Field, Input, fieldControl } from "@/components/ui/input";
import { detailCopy, kindIcon, spotGroups, type SpotOption } from "@/config/zone-kinds";
import { cn } from "@/lib/cn";
import { useTapToType } from "@/lib/use-tap-to-type";
import type { Campus, ID, ZoneKind } from "@/services/types";

type PickerOwnProps = {
  campus: Campus | undefined;
  /** The picked zone id, or "" for none. */
  value: string;
  onChange: (zoneId: string) => void;
  /** Only offer these kinds of spot, e.g. ["hostel"] for "Your hall". */
  kinds?: readonly ZoneKind[] | undefined;
  /** Only offer these spots, e.g. the zones a shop delivers to. */
  zoneIds?: readonly ID[] | undefined;
  placeholder?: string | undefined;
  /** Shows a clear button once something is picked; clearing calls onChange(""). */
  clearable?: boolean | undefined;
  disabled?: boolean | undefined;
  /** Called after a spot is picked from the list (not when cleared). */
  onPicked?: ((o: SpotOption) => void) | undefined;
};

type ComboboxProps = PickerOwnProps & {
  /** Set by <Field>. */
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
};

function defaultPlaceholder(kinds: readonly ZoneKind[] | undefined) {
  if (kinds?.length === 1 && kinds[0] === "hostel") return "Search halls";
  if (kinds?.length === 1 && kinds[0] === "faculty") return "Search faculties";
  return "Search halls, faculties, landmarks";
}

/**
 * A searchable list of the spots on a campus, grouped by kind. Follows the
 * ARIA combobox pattern: focus stays in the text box, arrow keys move through
 * the list, Enter picks, Escape closes and puts the old choice back.
 */
function SpotCombobox({
  campus,
  value,
  onChange,
  kinds,
  zoneIds,
  placeholder,
  clearable,
  disabled,
  onPicked,
  id,
  "aria-describedby": describedBy,
  "aria-invalid": invalid,
}: ComboboxProps) {
  const listId = useId();
  const anchorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  /** What's typed; null while not searching (the box shows the picked spot). */
  const [query, setQuery] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [keyed, setKeyed] = useState(false);
  /** Focus came from a click: keep the select-all that focus did. */
  const clickFocus = useRef(false);
  /** Focus came back after Clear: don't pop the list open. */
  const quietFocus = useRef(false);

  const selected = campus?.zones.find((z) => z.id === value);
  const groups = useMemo(
    () => spotGroups(campus, { kinds, zoneIds, query: query ?? "" }),
    [campus, kinds, zoneIds, query],
  );
  const flat = useMemo(() => groups.flatMap((g) => g.options), [groups]);
  const current = open ? flat[active] : undefined;
  const optionId = (zoneId: string) => `${listId}-o-${zoneId}`;
  const LeadIcon = selected ? kindIcon[selected.kind] : MapPin;
  const offersOffCampus = !kinds || kinds.includes("offcampus");

  // Keep the highlighted option in view while moving with the keyboard.
  useEffect(() => {
    if (!keyed || !current) return;
    document.getElementById(`${listId}-o-${current.zoneId}`)?.scrollIntoView({ block: "nearest" });
  }, [keyed, current, listId]);

  const openList = () => {
    if (disabled || open) return;
    setOpen(true);
    setKeyed(false);
    setActive(
      Math.max(
        0,
        flat.findIndex((o) => o.zoneId === value),
      ),
    );
  };
  const tap = useTapToType();
  /** Whether the list was already open when this tap started. */
  const openAtTap = useRef(false);
  const close = () => {
    if (tap.refocusing.current) return;
    setOpen(false);
    setQuery(null);
    tap.reset();
  };
  const choose = (o: SpotOption) => {
    onChange(o.zoneId);
    close();
    onPicked?.(o);
  };

  return (
    <RPopover.Root open={open} onOpenChange={(o) => (o ? openList() : close())}>
      <RPopover.Anchor asChild>
        <div ref={anchorRef} className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-muted">
            <LeadIcon className="size-4.5" aria-hidden />
          </span>
          <input
            ref={inputRef}
            id={id}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls={open && flat.length > 0 ? listId : undefined}
            aria-autocomplete="list"
            aria-activedescendant={current ? optionId(current.zoneId) : undefined}
            aria-describedby={describedBy}
            aria-invalid={invalid}
            disabled={disabled}
            value={query ?? selected?.name ?? ""}
            placeholder={placeholder ?? defaultPlaceholder(kinds)}
            autoComplete="off"
            autoCapitalize="words"
            spellCheck={false}
            enterKeyHint="done"
            inputMode={tap.inputMode}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setActive(0);
            }}
            onFocus={(e) => {
              e.currentTarget.select();
              if (quietFocus.current) quietFocus.current = false;
              else openList();
            }}
            onMouseDown={(e) => {
              clickFocus.current = document.activeElement !== e.currentTarget;
            }}
            onMouseUp={(e) => {
              if (clickFocus.current) e.preventDefault();
              clickFocus.current = false;
            }}
            onPointerDown={() => {
              openAtTap.current = open;
            }}
            onClick={() => {
              // Phones: the first tap shows the list; tapping again brings the keyboard.
              if (openAtTap.current && tap.startTyping(inputRef.current)) return;
              openList();
            }}
            onBlur={close}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault();
                if (!open) {
                  openList();
                  setKeyed(true);
                  return;
                }
                setKeyed(true);
                const step = e.key === "ArrowDown" ? 1 : -1;
                setActive((a) => Math.min(Math.max(a + step, 0), Math.max(flat.length - 1, 0)));
              } else if (e.key === "Enter" && open && current) {
                e.preventDefault();
                choose(current);
              } else if (e.key === "Escape" && open) {
                e.preventDefault();
                close();
              }
            }}
            className={cn(
              fieldControl,
              "h-11 pl-10 text-[16px] sm:text-body",
              clearable && value ? "pr-20" : "pr-10",
            )}
          />
          <span className="absolute inset-y-0 right-1 flex items-center">
            {clearable && value && !disabled && (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  quietFocus.current = true;
                  inputRef.current?.focus();
                }}
                className="flex size-9 items-center justify-center rounded-sm text-muted hover:bg-ink/5 hover:text-ink"
                aria-label={`Clear ${selected?.name ?? "choice"}`}
              >
                <X className="size-4" aria-hidden />
              </button>
            )}
            <span className="pointer-events-none flex size-9 items-center justify-center text-muted">
              <ChevronDown className="size-4" aria-hidden />
            </span>
          </span>
        </div>
      </RPopover.Anchor>
      <RPopover.Portal>
        <RPopover.Content
          role="presentation"
          align="start"
          side="bottom"
          sideOffset={6}
          collisionPadding={12}
          // Focus stays in the text box the whole time.
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            if (e.target instanceof Node && anchorRef.current?.contains(e.target))
              e.preventDefault();
          }}
          onMouseDown={(e) => e.preventDefault()}
          data-vaul-no-drag=""
          className={cn(
            "z-(--z-popover) w-(--radix-popover-trigger-width) min-w-60 overflow-y-auto overscroll-contain rounded-md bg-surface p-1 text-ink shadow-lg ring-1 ring-line",
            "max-h-[min(360px,var(--radix-popover-content-available-height))]",
            "origin-(--radix-popper-transform-origin) data-[state=open]:[animation:pop-in_160ms_cubic-bezier(0.22,1,0.36,1)]",
          )}
        >
          {tap.keyboardOff && flat.length > 0 && (
            <p className="px-2.5 pt-2 pb-1 text-[12.5px] text-muted">
              Pick one below, or tap the box again to type.
            </p>
          )}
          {flat.length === 0 ? (
            <p className="px-2.5 py-3 text-small text-muted" role="status">
              {query?.trim()
                ? `Nothing called “${query.trim()}”. Try the name of a hall, faculty or landmark${offersOffCampus ? ", or Off campus" : ""}.`
                : "No spots to pick from here."}
            </p>
          ) : (
            <div role="listbox" id={listId} aria-label="Spots on campus">
              {groups.map((g) => {
                const headingId = `${listId}-g-${g.kind}`;
                const many = groups.length > 1;
                return (
                  <div
                    key={g.kind}
                    role="group"
                    {...(many ? { "aria-labelledby": headingId } : { "aria-label": g.label })}
                  >
                    {many && (
                      <div id={headingId} className="px-2.5 pt-2.5 pb-1 eyebrow text-muted">
                        {g.label}
                      </div>
                    )}
                    {g.options.map((o) => {
                      const i = flat.indexOf(o);
                      const Icon = kindIcon[o.kind];
                      return (
                        <div
                          key={o.zoneId}
                          id={optionId(o.zoneId)}
                          role="option"
                          aria-selected={i === active}
                          onPointerMove={() => {
                            if (i === active && !keyed) return;
                            setKeyed(false);
                            setActive(i);
                          }}
                          onClick={() => choose(o)}
                          className={cn(
                            "flex min-h-11 cursor-pointer items-center gap-3 rounded-sm px-2.5 py-1.5",
                            i === active && "bg-ink/[0.06]",
                          )}
                        >
                          <span className="grid size-8 shrink-0 place-items-center rounded-md bg-accent-soft text-accent-ink">
                            <Icon className="size-4" aria-hidden />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-body font-medium text-ink">
                              {o.name}
                            </span>
                            {o.hint && (
                              <span className="block truncate text-small text-muted">{o.hint}</span>
                            )}
                          </span>
                          {o.zoneId === value && (
                            <Check className="size-4 shrink-0 text-ink" aria-label="Picked" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </RPopover.Content>
      </RPopover.Portal>
    </RPopover.Root>
  );
}

export type AddressPickerProps = PickerOwnProps & {
  label: ReactNode;
  error?: string | undefined;
  hint?: ReactNode;
  optional?: boolean | undefined;
  className?: string | undefined;
};

/** Pick a spot on campus: a hall, faculty, landmark, gate, market or off-campus area. */
export function AddressPicker({
  label,
  error,
  hint,
  optional,
  className,
  ...picker
}: AddressPickerProps) {
  return (
    <Field
      label={label}
      error={error}
      hint={hint}
      optional={optional ?? false}
      {...(className ? { className } : {})}
    >
      <SpotCombobox {...picker} />
    </Field>
  );
}

export type AddressFieldsProps = {
  campus: Campus | undefined;
  zoneId: string;
  detail: string;
  onZoneChange: (zoneId: string) => void;
  onDetailChange: (detail: string) => void;
  kinds?: readonly ZoneKind[] | undefined;
  zoneIds?: readonly ID[] | undefined;
  /** Label for the spot picker. */
  label?: ReactNode;
  placeholder?: string | undefined;
  errors?: { zoneId?: string | undefined; addressLine?: string | undefined } | undefined;
  /** Ask for the detail line even on campus (off campus it's always needed). */
  detailRequired?: boolean | undefined;
  className?: string | undefined;
};

/**
 * The spot picker with the line under it that pins the place down. That line
 * asks for what makes sense for the spot: a room in a hall, a department in a
 * faculty, a street off campus.
 */
export function AddressFields({
  campus,
  zoneId,
  detail,
  onZoneChange,
  onDetailChange,
  kinds,
  zoneIds,
  label = "Where",
  placeholder,
  errors,
  detailRequired,
  className,
}: AddressFieldsProps) {
  const detailInput = useRef<HTMLInputElement>(null);
  const kind = campus?.zones.find((z) => z.id === zoneId)?.kind;
  const copy = detailCopy(kind);
  const required = copy.required || !!detailRequired;
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <AddressPicker
        campus={campus}
        value={zoneId}
        onChange={onZoneChange}
        kinds={kinds}
        zoneIds={zoneIds}
        label={label}
        placeholder={placeholder}
        error={errors?.zoneId}
        onPicked={() => {
          // The next thing to fill in, while the keyboard is already up.
          if (!detail.trim()) window.setTimeout(() => detailInput.current?.focus(), 0);
        }}
      />
      <Field label={copy.label} error={errors?.addressLine} optional={!required}>
        <Input
          ref={detailInput}
          value={detail}
          onChange={(e) => onDetailChange(e.target.value)}
          placeholder={copy.placeholder}
          autoComplete={copy.autoComplete}
          maxLength={120}
          className="h-11 text-[16px] sm:text-body"
        />
      </Field>
    </div>
  );
}
