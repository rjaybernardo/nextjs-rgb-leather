import Image from "next/image";

import { getSiteSettings } from "@/lib/site";
import { cn } from "@/lib/utils";

type SiteLogoProps = {
  size?: number;
  priority?: boolean;
  className?: string;
};

// The logo set in Site Studio → Branding, or the default logo
const SiteLogo = async ({ size = 48, priority, className }: SiteLogoProps) => {
  const { logoUrl, siteName } = await getSiteSettings();

  return (
    <Image
      src={logoUrl || "/images/logo.svg"}
      alt={`${siteName} logo`}
      width={size}
      height={size}
      priority={priority}
      className={cn("object-contain", className)}
    />
  );
};

export default SiteLogo;
