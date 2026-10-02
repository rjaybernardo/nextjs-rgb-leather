import SiteLogo from "@/components/shared/site-logo";
import { getSiteSettings } from "@/lib/site";
import { cn } from "@/lib/utils";

/*
 * The uploaded logo, or the site name as a wordmark: the first word bold
 * ("RGB") and the rest in the italic serif ("Leathercrafts"), as in the design.
 */
export default async function Wordmark({ size = "md", className }: { size?: "md" | "lg"; className?: string }) {
  const { siteName, logoUrl } = await getSiteSettings();

  if (logoUrl) {
    return <SiteLogo size={size === "lg" ? 48 : 40} priority className={className} />;
  }

  const [first, ...rest] = siteName.split(/\s+/);

  return (
    <span className={cn("flex items-baseline gap-2", className)}>
      <span className={cn("font-extrabold tracking-[-0.06em]", size === "lg" ? "text-[28px]" : "text-[26px]")}>
        {first}
      </span>
      {/* Keeps the words apart in the link's accessible name */}
      {rest.length > 0 && " "}
      {rest.length > 0 && (
        <span className={cn("font-accent text-muted-foreground", size === "lg" ? "text-xl" : "text-[19px]")}>
          {rest.join(" ")}
        </span>
      )}
    </span>
  );
}
