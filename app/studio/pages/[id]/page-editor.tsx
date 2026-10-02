"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import Markdown from "@/components/shared/markdown";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { deletePage, updatePage } from "@/lib/actions/studio.actions";
import type { PageInput } from "@/lib/site-config";
import { cn } from "@/lib/utils";

type PageEditorProps = {
  id: string;
  page: PageInput;
};

const MARKDOWN_HELP = "## Heading · **bold** · - list item · [link text](/search) · > note";

export default function PageEditor({ id, page }: PageEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState(page);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const set = <K extends keyof PageInput>(key: K, value: PageInput[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  function save() {
    startTransition(async () => {
      const result = await updatePage(id, values);

      toast.add({ type: result.success ? "success" : "error", description: result.message });

      if (result.success) router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      const result = await deletePage(id);

      toast.add({ type: result.success ? "success" : "error", description: result.message });

      if (result.success) router.push("/studio/pages");
    });
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="page-title">Title</Label>
          <Input
            id="page-title"
            value={values.title}
            maxLength={100}
            onChange={(event) => set("title", event.target.value)}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="page-slug">Address</Label>
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground">/pages/</span>
            <Input
              id="page-slug"
              value={values.slug}
              maxLength={80}
              className="font-mono"
              onChange={(event) => set("slug", event.target.value.toLowerCase())}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Changing this breaks links to the old address.
          </p>
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="page-description">Search description (optional)</Label>
        <Input
          id="page-description"
          value={values.description}
          maxLength={300}
          onChange={(event) => set("description", event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">Content</span>

          <div role="tablist" aria-label="Content view" className="flex gap-1">
            {(["write", "preview"] as const).map((name) => (
              <button
                key={name}
                type="button"
                role="tab"
                aria-selected={tab === name}
                onClick={() => setTab(name)}
                className={cn(
                  "rounded-md px-3 py-1 text-sm",
                  tab === name ? "bg-muted font-medium" : "text-muted-foreground",
                )}
              >
                {name === "write" ? "Write" : "Preview"}
              </button>
            ))}
          </div>
        </div>

        {tab === "write" ? (
          <>
            <label htmlFor="page-content" className="sr-only">
              Content (Markdown)
            </label>
            <Textarea
              id="page-content"
              value={values.content}
              rows={22}
              className="font-mono text-sm"
              onChange={(event) => set("content", event.target.value)}
            />
            <p className="text-xs text-muted-foreground">Markdown: {MARKDOWN_HELP}</p>
          </>
        ) : (
          <div className="min-h-64 rounded-md border p-6">
            <h2 className="text-3xl font-bold">{values.title}</h2>
            <Markdown>{values.content || "_Nothing written yet._"}</Markdown>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={values.published}
            onChange={(event) => set("published", event.target.checked)}
            className="size-4 accent-primary"
          />
          Published (visible to customers)
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={values.showInFooter}
            onChange={(event) => set("showInFooter", event.target.checked)}
            className="size-4 accent-primary"
          />
          Show in the footer
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save page"}
        </Button>

        {page.published && (
          <Link
            href={`/pages/${page.slug}`}
            target="_blank"
            className={buttonVariants({ variant: "outline" })}
          >
            View page
          </Link>
        )}

        <div className="ml-auto">
          {confirmDelete ? (
            <span className="flex gap-2">
              <Button type="button" variant="destructive" disabled={isPending} onClick={remove}>
                Yes, delete page
              </Button>
              <Button type="button" variant="ghost" onClick={() => setConfirmDelete(false)}>
                Keep
              </Button>
            </span>
          ) : (
            <Button type="button" variant="ghost" onClick={() => setConfirmDelete(true)}>
              Delete page
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
