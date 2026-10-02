import type { Metadata } from "next";

import { getStudioSettings } from "@/lib/actions/studio.actions";

import ThemeForm from "./theme-form";

export const metadata: Metadata = {
  title: "Theme",
};

export default async function StudioThemePage() {
  const settings = await getStudioSettings();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="h2-bold">Theme</h1>
        <p className="text-muted-foreground">
          Buttons, links, badges and the announcement bar use your brand color. Button text
          switches between white and black automatically so it stays readable.
        </p>
      </div>

      <ThemeForm theme={settings.theme} />
    </div>
  );
}
