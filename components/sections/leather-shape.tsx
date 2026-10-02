import { cn } from "@/lib/utils";

// CSS drawings of leather pieces, shown where no photo has been uploaded yet
const LEATHER = {
  cognac: ["#94512A", "#5E2F15"],
  tan: ["#C79A68", "#946A3E"],
  oxblood: ["#6E2622", "#45150F"],
  black: ["#2A2522", "#141110"],
  olive: ["#4E4B2C", "#2E2C19"],
  brown: ["#7A3D1C", "#4A230E"],
} as const;

export type LeatherTone = keyof typeof LEATHER;

export const LEATHER_TONES = Object.keys(LEATHER) as LeatherTone[];

const SHAPES = {
  bifold: "w-[72%] h-[52%] rounded-[10px]",
  sleeve: "w-[58%] h-[42%] rounded-[10px]",
  card: "w-[50%] h-[38%] rounded-lg",
  tote: "w-[62%] h-[54%] rounded-[30px_30px_8px_8px]",
  strap: "w-[14%] h-[58%] rounded-[30px]",
} as const;

export type LeatherShapeKind = keyof typeof SHAPES;

export function LeatherShape({
  shape = "bifold",
  tone = "cognac",
  className,
}: {
  shape?: LeatherShapeKind;
  tone?: LeatherTone;
  className?: string;
}) {
  const [from, to] = LEATHER[tone];

  return (
    <div
      aria-hidden="true"
      className={cn("relative z-[1] shadow-[0_18px_30px_-18px_rgba(30,15,5,.55)]", SHAPES[shape], className)}
      style={{
        background: `radial-gradient(120% 90% at 25% 15%, rgba(255,255,255,.22), rgba(255,255,255,0) 55%), linear-gradient(160deg, ${from}, ${to})`,
      }}
    >
      {/* Stitch line */}
      <span className="pointer-events-none absolute inset-[7px] rounded-[inherit] border-[1.5px] border-dashed border-[rgba(255,240,220,.38)]" />
      {shape === "bifold" && <span className="absolute inset-y-0 left-1/2 border-l border-black/25" />}
    </div>
  );
}
