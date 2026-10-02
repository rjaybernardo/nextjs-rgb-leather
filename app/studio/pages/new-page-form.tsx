"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import slugify from "slugify";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { createPage } from "@/lib/actions/studio.actions";

// Creates a draft page, then opens it in the editor
export default function NewPageForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");

  return (
    <form
      className="flex flex-wrap items-end gap-2 rounded-lg border border-dashed p-4"
      onSubmit={(event) => {
        event.preventDefault();

        startTransition(async () => {
          const result = await createPage({
            title,
            slug: slugify(title, { lower: true, strict: true }),
            content: "",
            description: "",
            published: false,
            showInFooter: true,
          });

          if (!result.success || !result.id) {
            toast.add({ type: "error", description: result.message });
            return;
          }

          router.push(`/studio/pages/${result.id}`);
        });
      }}
    >
      <div className="min-w-60 flex-1 space-y-1">
        <Label htmlFor="new-page-title">New page</Label>
        <Input
          id="new-page-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g. Size guide"
          maxLength={100}
        />
      </div>

      <Button type="submit" disabled={isPending || title.trim().length < 2}>
        {isPending ? "Creating..." : "Create draft"}
      </Button>
    </form>
  );
}
