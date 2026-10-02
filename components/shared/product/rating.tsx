import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

type RatingProps = {
  value: number;
  className?: string;
  size?: "sm" | "md";
};

// Read-only star rating; partial stars are drawn by clipping a filled star
const Rating = ({ value, className, size = "md" }: RatingProps) => {
  const iconClass = size === "sm" ? "size-3.5" : "size-4";

  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      role="img"
      aria-label={`Rated ${value.toFixed(1)} out of 5`}
    >
      {[0, 1, 2, 3, 4].map((index) => {
        const fill = Math.max(0, Math.min(1, value - index));

        return (
          <span key={index} className={cn("relative", iconClass)}>
            <Star
              className={cn("absolute inset-0 text-muted-foreground/40", iconClass)}
              aria-hidden="true"
            />

            <span
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fill * 100}%` }}
            >
              <Star
                className={cn("fill-amber-400 text-amber-400", iconClass)}
                aria-hidden="true"
              />
            </span>
          </span>
        );
      })}
    </div>
  );
};

export default Rating;
