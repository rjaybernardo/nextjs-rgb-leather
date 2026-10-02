"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const links = [
  { title: "Overview", href: "/studio" },
  { title: "Branding", href: "/studio/branding" },
  { title: "Theme", href: "/studio/theme" },
  { title: "Home page", href: "/studio/home" },
  { title: "Pages", href: "/studio/pages" },
  { title: "Announcement", href: "/studio/announcement" },
  { title: "Footer & SEO", href: "/studio/footer" },
  { title: "Emails", href: "/studio/emails" },
  { title: "Subscribers", href: "/studio/subscribers" },
];

export default function StudioNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Site Studio" className="flex gap-1 overflow-x-auto pb-1 md:flex-col md:overflow-visible">
      {links.map((link) => {
        const active =
          link.href === "/studio" ? pathname === "/studio" : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted",
              active ? "bg-muted text-foreground" : "text-muted-foreground",
            )}
          >
            {link.title}
          </Link>
        );
      })}
    </nav>
  );
}
