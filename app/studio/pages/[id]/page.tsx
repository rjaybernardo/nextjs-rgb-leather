import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getStudioPage } from "@/lib/actions/studio.actions";

import PageEditor from "./page-editor";

export const metadata: Metadata = {
  title: "Edit page",
};

export default async function StudioEditPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const page = await getStudioPage(id);

  if (!page) notFound();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link href="/studio/pages" className="text-sm text-muted-foreground hover:underline">
          ← All pages
        </Link>
        <h1 className="h2-bold">{page.title}</h1>
      </div>

      <PageEditor
        id={page.id}
        page={{
          title: page.title,
          slug: page.slug,
          content: page.content,
          description: page.description,
          published: page.published,
          showInFooter: page.showInFooter,
        }}
      />
    </div>
  );
}
