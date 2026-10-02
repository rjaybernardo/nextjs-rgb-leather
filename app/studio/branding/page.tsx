import type { Metadata } from "next";

import SettingsForm from "@/components/studio/settings-form";
import { getStudioSettings } from "@/lib/actions/studio.actions";
import { SETTINGS_FIELDS } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Branding",
};

export default async function StudioBrandingPage() {
  const settings = await getStudioSettings();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="h2-bold">Branding</h1>
        <p className="text-muted-foreground">How your shop is named and how customers reach you.</p>
      </div>

      <SettingsForm fields={SETTINGS_FIELDS.branding} settings={settings} />
    </div>
  );
}
