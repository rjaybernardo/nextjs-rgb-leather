"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { updateSiteSettings } from "@/lib/actions/studio.actions";
import {
  contrastText,
  FONT_OPTIONS,
  radiusRem,
  RADIUS_OPTIONS,
  THEME_PRESETS,
  type SiteSettings,
} from "@/lib/site-config";
import { cn } from "@/lib/utils";

type Theme = SiteSettings["theme"];

const selectClass = "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm";

const isHex = (value: string) => /^#[0-9a-fA-F]{6}$/.test(value);

export default function ThemeForm({ theme }: { theme: Theme }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState(theme);
  const [hexInput, setHexInput] = useState(theme.primaryColor);

  const set = <K extends keyof Theme>(key: K, value: Theme[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  const setColor = (color: string) => {
    setHexInput(color);
    if (isHex(color)) set("primaryColor", color.toUpperCase());
  };

  function save() {
    startTransition(async () => {
      const result = await updateSiteSettings({ theme: values });

      toast.add({ type: result.success ? "success" : "error", description: result.message });

      if (result.success) router.refresh();
    });
  }

  const foreground = contrastText(values.primaryColor);
  const radius = radiusRem(values.radius);

  return (
    <form
      className="grid gap-8 lg:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <div className="space-y-6">
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Accent color</legend>

          <div className="flex flex-wrap gap-2">
            {THEME_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => setColor(preset.color)}
                aria-pressed={values.primaryColor.toUpperCase() === preset.color.toUpperCase()}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
                  values.primaryColor.toUpperCase() === preset.color.toUpperCase() && "ring-2 ring-ring",
                )}
              >
                <span className="size-4 rounded-full border" style={{ backgroundColor: preset.color }} />
                {preset.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <label htmlFor="theme-color-picker" className="sr-only">
              Pick a color
            </label>
            <input
              id="theme-color-picker"
              type="color"
              value={values.primaryColor}
              onChange={(event) => setColor(event.target.value)}
              className="h-9 w-14 cursor-pointer rounded-md border bg-transparent p-1"
            />

            <Label htmlFor="theme-hex" className="sr-only">
              Hex color
            </Label>
            <Input
              id="theme-hex"
              value={hexInput}
              onChange={(event) => setColor(event.target.value)}
              aria-invalid={!isHex(hexInput)}
              className="w-32 font-mono"
              maxLength={7}
            />
          </div>

          {!isHex(hexInput) && (
            <p className="text-xs text-destructive">Use a 6-digit hex color like #8A4B22</p>
          )}
        </fieldset>

        <div className="space-y-1">
          <Label htmlFor="theme-radius">Corners</Label>
          <select
            id="theme-radius"
            value={values.radius}
            onChange={(event) => set("radius", event.target.value as Theme["radius"])}
            className={selectClass}
          >
            {RADIUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="theme-font">Font</Label>
          <select
            id="theme-font"
            value={values.font}
            onChange={(event) => set("font", event.target.value as Theme["font"])}
            className={selectClass}
          >
            {FONT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">You&apos;ll see the font after saving.</p>
        </div>

        <div className="space-y-1">
          <Label htmlFor="theme-mode">Default appearance</Label>
          <select
            id="theme-mode"
            value={values.defaultMode}
            onChange={(event) => set("defaultMode", event.target.value as Theme["defaultMode"])}
            className={selectClass}
          >
            <option value="system">Match the visitor&apos;s device</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
          <p className="text-xs text-muted-foreground">
            Visitors can still switch with the theme button.
          </p>
        </div>

        <Button type="submit" disabled={isPending || !isHex(hexInput)}>
          {isPending ? "Saving..." : "Save theme"}
        </Button>
      </div>

      <section aria-label="Preview" className="space-y-3">
        <h2 className="text-sm font-medium">Preview</h2>

        <div className="space-y-4 border p-6" style={{ borderRadius: radius }}>
          <p className="text-lg font-semibold">Sample product</p>
          <p className="text-sm text-muted-foreground">A short product description.</p>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-9 items-center rounded-full bg-foreground px-4 text-sm font-medium text-background">
              Add to bag
            </span>
            <span
              className="inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold"
              style={{ backgroundColor: values.primaryColor, color: foreground }}
              title="Bag count"
            >
              2
            </span>
          </div>

          <div
            className="space-y-1 px-4 py-5"
            style={{ backgroundColor: values.primaryColor, color: foreground, borderRadius: radius }}
          >
            <p className="font-semibold">What goes into one card sleeve</p>
            <p className="text-sm opacity-75">Dark bands use the accent color.</p>
          </div>
        </div>
      </section>
    </form>
  );
}
