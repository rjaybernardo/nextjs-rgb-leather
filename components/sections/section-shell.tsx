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
      <div className={cn("wrap py-[clamp(64px,8vw,120px)]", innerClassName)}>{children}</div>
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
