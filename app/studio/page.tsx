import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { getStudioPages, getStudioSections, getStudioSettings } from "@/lib/actions/studio.actions";

const AREAS = [
  { href: "/studio/branding", title: "Branding", text: "Site name, logo, contact details and social links." },
  { href: "/studio/theme", title: "Theme", text: "Brand color, font, corner roundness and light or dark mode." },
  { href: "/studio/home", title: "Home page", text: "Add, reorder, show or hide and edit home page sections." },
  { href: "/studio/pages", title: "Pages", text: "About, contact and policy pages, written in Markdown." },
  { href: "/studio/announcement", title: "Announcement", text: "The bar across the top of every page." },
  { href: "/studio/footer", title: "Footer & SEO", text: "Footer text, copyright, search description and share image." },
  { href: "/studio/subscribers", title: "Subscribers", text: "Emails from the newsletter section." },
];

export default async function StudioOverviewPage() {
  const [settings, sections, pages] = await Promise.all([
    getStudioSettings(),
    getStudioSections(),
    getStudioPages(),
  ]);

  const shownSections = sections.filter((section) => section.enabled).length;
  const drafts = pages.filter((page) => !page.published).length;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="h2-bold">Site Studio</h1>
        <p className="text-muted-foreground">
          {settings.siteName}: {shownSections} of {sections.length} home sections shown,{" "}
          {pages.length - drafts} pages published, {drafts} drafts.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {AREAS.map((area) => (
          <Link key={area.href} href={area.href} className="group">
            <Card className="h-full transition-colors group-hover:border-primary">
              <CardContent className="space-y-1 p-5">
                <h2 className="font-semibold">{area.title}</h2>
                <p className="text-sm text-muted-foreground">{area.text}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
