import type { Metadata } from "next";

import SettingsForm from "@/components/studio/settings-form";
import { getStudioSettings } from "@/lib/actions/studio.actions";
import { SETTINGS_FIELDS } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Footer & SEO",
};

export default async function StudioFooterSEOPage() {
  const settings = await getStudioSettings();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="h2-bold">Footer & SEO</h1>
        <p className="text-muted-foreground">The bottom of every page, and how links look in search results and when shared.</p>
      </div>

      <SettingsForm fields={SETTINGS_FIELDS.footer} settings={settings} />
    </div>
  );
}
