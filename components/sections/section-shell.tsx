import { ArrowRight } from "lucide-react";
import Link from "next/link";

import AccentText from "@/components/shared/accent-text";
import { cn } from "@/lib/utils";

// Backgrounds from the storefront design. "brand" uses the Studio accent
// color, with text that stays readable on it.
const TONES = {
  paper: "bg-background",
  stone: "bg-[var(--stone)]",
  brand: "tone-brand bg-[var(--brand)] text-[var(--brand-foreground)]",
} as const;

export type SectionTone = keyof typeof TONES;

// Full-width band with the page's content column inside
export function Section({
  tone = "paper",
  className,
  innerClassName,
  children,
  ...props
}: React.ComponentProps<"section"> & { tone?: SectionTone; innerClassName?: string }) {
  return (
    <section className={cn("full-bleed", TONES[tone], className)} {...props}>
      {/* Plain sections share the gap with their neighbours; bands with their
          own background need more room inside (spacing tokens in globals.css) */}
      <div className={cn("wrap", tone === "paper" ? "py-[var(--section-y)]" : "py-[var(--band-y)]", innerClassName)}>
        {children}
      </div>
    </section>
  );
}

// Section heading; *words* in asterisks get the italic serif accent
export function SectionTitle({
  text,
  as: Tag = "h2",
  className,
  id,
}: {
  text: string;
  as?: "h1" | "h2" | "h3";
  className?: string;
  id?: string;
}) {
  return (
    <Tag id={id} className={cn("h-section", className)}>
      <AccentText text={text} />
    </Tag>
  );
}

// Title row with an optional "View all" style link on the right
export function SectionHeader({
  title,
  subtitle,
  linkText,
  linkUrl,
  id,
}: {
  title: string;
  subtitle?: string;
  linkText?: string;
  linkUrl?: string;
  id?: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
      <div className="flex min-w-0 flex-col gap-2">
        <SectionTitle id={id} text={title} className="text-[clamp(1.75rem,3.4vw,2.75rem)]" />
        {subtitle && <p className="max-w-[48ch] text-muted-foreground">{subtitle}</p>}
      </div>

      {linkText && linkUrl && (
        <Link
          href={linkUrl}
          className="group inline-flex items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ring"
        >
          {linkText}
          <ArrowRight
            className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
            aria-hidden="true"
          />
        </Link>
      )}
    </div>
  );
}

const pill =
  "inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-full border-[1.5px] px-[30px] text-[15px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ring motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-50";

// Pill buttons from the design: dark, outlined, and light (on the accent color)
export const pillButton = {
  dark: cn(pill, "border-foreground bg-foreground text-background hover:opacity-85"),
  ghost: cn(pill, "border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background"),
  light: cn(
    pill,
    "border-[var(--brand-foreground)] bg-[var(--brand-foreground)] text-[var(--brand)] hover:opacity-90",
  ),
};
