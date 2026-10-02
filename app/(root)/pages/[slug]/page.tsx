import type { Metadata } from "next";
import { notFound } from "next/navigation";

import Markdown from "@/components/shared/markdown";
import { getPublishedPage } from "@/lib/site";
import { formatDateTime } from "@/lib/utils";

type ContentPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ContentPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublishedPage(slug);

  if (!page) return { title: "Page not found" };

  return {
    title: page.title,
    description: page.description || undefined,
    alternates: { canonical: `/pages/${page.slug}` },
  };
}

// Pages written in Site Studio → Pages (only published ones are shown)
const ContentPage = async ({ params }: ContentPageProps) => {
  const { slug } = await params;
  const page = await getPublishedPage(slug);

  if (!page) notFound();

  return (
    <article className="mx-auto max-w-3xl py-10">
      <h1 className="text-4xl font-bold tracking-tight">{page.title}</h1>

      <p className="mt-2 text-sm text-muted-foreground">
        Last updated {formatDateTime(page.updatedAt).dateOnly}
      </p>

      <div className="mt-6">
        <Markdown>{page.content}</Markdown>
      </div>
    </article>
  );
};

export default ContentPage;
