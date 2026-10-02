import { ImageIcon } from "lucide-react";

import { cn } from "@/lib/utils";

// Shown where no photo has been uploaded yet; upload one in Site Studio
export function ImagePlaceholder({ label = "Image", className }: { label?: string; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative z-[1] flex flex-col items-center justify-center gap-2 opacity-40",
        className,
      )}
    >
      <ImageIcon className="size-[clamp(28px,4vw,44px)]" strokeWidth={1.3} />
      {label && <span className="text-xs font-semibold uppercase tracking-[0.14em]">{label}</span>}
    </div>
  );
}
