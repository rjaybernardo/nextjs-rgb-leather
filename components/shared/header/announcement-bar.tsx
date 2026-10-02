import Link from "next/link";

import { getSiteSettings } from "@/lib/site";

// Site Studio → Announcement; hidden when switched off or empty
const AnnouncementBar = async () => {
  const { announcement } = await getSiteSettings();

  if (!announcement.enabled || !announcement.text) return null;

  return (
    <div className="bg-primary px-4 py-2 text-center text-sm text-primary-foreground">
      <span>{announcement.text}</span>

      {announcement.linkText && announcement.linkUrl && (
        <>
          {" "}
          <Link href={announcement.linkUrl} className="font-semibold underline underline-offset-4">
            {announcement.linkText}
          </Link>
        </>
      )}
    </div>
  );
};

export default AnnouncementBar;
