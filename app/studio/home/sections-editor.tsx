"use client";

import { ArrowDown, ArrowUp, Eye, EyeOff, LayoutTemplate, Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { FieldEditor } from "@/components/studio/field-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import {
  addSection,
  applyDesignPreset,
  deleteSection,
  moveSection,
  setSectionEnabled,
  updateSectionData,
} from "@/lib/actions/studio.actions";
import {
  SECTION_FIELDS,
  SECTION_LABELS,
  SECTION_TYPES,
  type SectionType,
} from "@/lib/site-config";
import { cn } from "@/lib/utils";

type Section = {
  id: string;
  type: SectionType;
  enabled: boolean;
  data: Record<string, unknown>;
};

type Result = { success: boolean; message: string };

export default function SectionsEditor({ sections }: { sections: Section[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [newType, setNewType] = useState<SectionType>("hero");
  const [confirmPreset, setConfirmPreset] = useState(false);

  function run(action: () => Promise<Result>, onSuccess?: () => void) {
    startTransition(async () => {
      const result = await action();

      toast.add({ type: result.success ? "success" : "error", description: result.message });

      if (result.success) {
        onSuccess?.();
        router.refresh();
      }
    });
  }

  const startEditing = (section: Section) => {
    setEditingId(section.id);
    setDraft(section.data);
  };

  return (
    <div className="space-y-6">
      <ol className="space-y-3">
        {sections.map((section, index) => {
          const label = SECTION_LABELS[section.type];
          const editing = editingId === section.id;

          return (
            <li
              key={section.id}
              className={cn("rounded-lg border bg-card", !section.enabled && "opacity-70")}
            >
              <div className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{label.name}</span>
                    {section.enabled ? (
                      <Badge variant="secondary">Shown</Badge>
                    ) : (
                      <Badge variant="outline">Hidden</Badge>
                    )}
                  </div>
                  <p className="truncate text-sm text-muted-foreground">
                    {String(section.data.title || section.data.heading || label.hint)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={isPending || index === 0}
                    onClick={() => run(() => moveSection(section.id, "up"))}
                    aria-label={`Move ${label.name} up`}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={isPending || index === sections.length - 1}
                    onClick={() => run(() => moveSection(section.id, "down"))}
                    aria-label={`Move ${label.name} down`}
                  >
                    <ArrowDown />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => run(() => setSectionEnabled(section.id, !section.enabled))}
                  >
                    {section.enabled ? <EyeOff /> : <Eye />}
                    {section.enabled ? "Hide" : "Show"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => (editing ? setEditingId(null) : startEditing(section))}
                    aria-expanded={editing}
                  >
                    <Pencil />
                    {editing ? "Close" : "Edit"}
                  </Button>
                </div>
              </div>

              {editing && (
                <form
                  className="space-y-5 border-t p-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    run(() => updateSectionData(section.id, draft), () => setEditingId(null));
                  }}
                >
                  {SECTION_FIELDS[section.type].map((field) => (
                    <FieldEditor
                      key={field.key}
                      field={field}
                      idPrefix={`section-${section.id}`}
                      value={draft[field.key]}
                      onChange={(value) => setDraft((current) => ({ ...current, [field.key]: value }))}
                    />
                  ))}

                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" disabled={isPending}>
                      {isPending ? "Saving..." : "Save section"}
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>

                    <div className="ml-auto">
                      {confirmDeleteId === section.id ? (
                        <span className="flex gap-2">
                          <Button
                            type="button"
                            variant="destructive"
                            disabled={isPending}
                            onClick={() => run(() => deleteSection(section.id), () => setEditingId(null))}
                          >
                            Yes, delete section
                          </Button>
                          <Button type="button" variant="ghost" onClick={() => setConfirmDeleteId(null)}>
                            Keep
                          </Button>
                        </span>
                      ) : (
                        <Button type="button" variant="ghost" onClick={() => setConfirmDeleteId(section.id)}>
                          Delete section
                        </Button>
                      )}
                    </div>
                  </div>
                </form>
              )}
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap items-end gap-2 rounded-lg border border-dashed p-4">
        <div className="space-y-1">
          <Label htmlFor="new-section-type">Add a section</Label>
          <select
            id="new-section-type"
            value={newType}
            onChange={(event) => setNewType(event.target.value as SectionType)}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          >
            {SECTION_TYPES.map((type) => (
              <option key={type} value={type}>
                {SECTION_LABELS[type].name}: {SECTION_LABELS[type].hint}
              </option>
            ))}
          </select>
        </div>

        <Button type="button" disabled={isPending} onClick={() => run(() => addSection(newType))}>
          <Plus />
          Add section
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border p-4">
        <LayoutTemplate className="size-5 text-muted-foreground" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="font-medium">Use the RGB Leathercrafts layout</div>
          <p className="text-sm text-muted-foreground">
            Adds the full store design (hero, shop tabs, craft, reviews, set, made to order,
            gallery, FAQ) with ready-to-edit wording, and sets the cordovan color and Schibsted
            Grotesk font. Your current sections are hidden, not deleted.
          </p>
        </div>

        {confirmPreset ? (
          <div className="flex gap-2">
            <Button
              type="button"
              disabled={isPending}
              onClick={() => run(applyDesignPreset, () => setConfirmPreset(false))}
            >
              Yes, add the layout
            </Button>
            <Button type="button" variant="outline" onClick={() => setConfirmPreset(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button type="button" variant="outline" onClick={() => setConfirmPreset(true)}>
            Use this layout
          </Button>
        )}
      </div>
    </div>
  );
}
