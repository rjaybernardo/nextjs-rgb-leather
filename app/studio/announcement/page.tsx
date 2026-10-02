import type { Metadata } from "next";

import SettingsForm from "@/components/studio/settings-form";
import { getStudioSettings } from "@/lib/actions/studio.actions";
import { SETTINGS_FIELDS } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Announcement",
};

export default async function StudioAnnouncementPage() {
  const settings = await getStudioSettings();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="h2-bold">Announcement</h1>
        <p className="text-muted-foreground">A short message in a bar across the top of every page.</p>
      </div>

      <SettingsForm fields={SETTINGS_FIELDS.announcement} settings={settings} />
    </div>
  );
}
