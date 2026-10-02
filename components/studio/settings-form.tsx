"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { updateSiteSettings } from "@/lib/actions/studio.actions";
import type { FieldDef, SiteSettings } from "@/lib/site-config";

import { FieldEditor, getPath, setPath } from "./field-editor";

type SettingsFormProps = {
  fields: FieldDef[];
  settings: SiteSettings;
};

// Edits a group of site settings; only these fields are sent when saving
export default function SettingsForm({ fields, settings }: SettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState<Record<string, unknown>>(settings);

  function save() {
    const changes = fields.reduce<Record<string, unknown>>(
      (result, field) => setPath(result, field.key, getPath(values, field.key)),
      {},
    );

    startTransition(async () => {
      const result = await updateSiteSettings(changes);

      toast.add({ type: result.success ? "success" : "error", description: result.message });

      if (result.success) router.refresh();
    });
  }

  return (
    <form
      className="max-w-xl space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      {fields.map((field) => (
        <FieldEditor
          key={field.key}
          field={field}
          idPrefix="settings"
          value={getPath(values, field.key)}
          onChange={(value) => setValues((current) => setPath(current, field.key, value))}
        />
      ))}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
