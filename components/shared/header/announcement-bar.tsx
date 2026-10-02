import Link from "next/link";

import { getSiteSettings } from "@/lib/site";

// Site Studio → Announcement; hidden when switched off or empty
const AnnouncementBar = async () => {
  const { announcement } = await getSiteSettings();

  if (!announcement.enabled || !announcement.text) return null;

  return (
    <div className="bg-[var(--night)] text-[13px] font-medium text-[var(--on-night)]">
      <div className="wrap flex min-h-10 items-center justify-center gap-7 text-center">
        <span>
          {announcement.text}
          {announcement.linkText && announcement.linkUrl && (
            <>
              {" "}
              <Link href={announcement.linkUrl} className="font-semibold underline underline-offset-4">
                {announcement.linkText}
              </Link>
            </>
          )}
        </span>

        {announcement.secondaryText && (
          <span className="hidden text-[var(--on-night-muted)] sm:inline">
            {announcement.secondaryText}
          </span>
        )}
      </div>
    </div>
  );
};

export default AnnouncementBar;
