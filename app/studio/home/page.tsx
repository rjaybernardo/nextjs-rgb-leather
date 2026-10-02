import type { Metadata } from "next";

import { getStudioSections } from "@/lib/actions/studio.actions";

import SectionsEditor from "./sections-editor";

export const metadata: Metadata = {
  title: "Home page",
};

export default async function StudioHomePage() {
  const sections = await getStudioSections();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="h2-bold">Home page</h1>
        <p className="text-muted-foreground">
          Sections appear top to bottom in this order. Hidden sections keep their content, so
          you can prepare one and show it when ready.
        </p>
      </div>

      <SectionsEditor sections={sections} />
    </div>
  );
}
