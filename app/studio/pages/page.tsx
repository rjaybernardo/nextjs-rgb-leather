import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { getStudioPages } from "@/lib/actions/studio.actions";
import { formatDateTime } from "@/lib/utils";

import NewPageForm from "./new-page-form";

export const metadata: Metadata = {
  title: "Pages",
};

export default async function StudioPagesPage() {
  const pages = await getStudioPages();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="h2-bold">Pages</h1>
        <p className="text-muted-foreground">
          Published pages live at /pages/&lt;address&gt;. Pages set to show in the footer are
          listed under Help.
        </p>
      </div>

      <ul className="divide-y rounded-lg border">
        {pages.map((page) => (
          <li key={page.id}>
            <Link
              href={`/studio/pages/${page.id}`}
              className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-muted/50"
            >
              <span className="min-w-0 flex-1">
                <span className="font-medium">{page.title}</span>
                <span className="ml-2 font-mono text-xs text-muted-foreground">/pages/{page.slug}</span>
              </span>

              {page.published ? (
                <Badge variant="secondary">Published</Badge>
              ) : (
                <Badge variant="outline">Draft</Badge>
              )}

              {page.published && page.showInFooter && <Badge variant="outline">In footer</Badge>}

              <span className="text-xs text-muted-foreground">
                Edited {formatDateTime(page.updatedAt).dateOnly}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <NewPageForm />
    </div>
  );
}
