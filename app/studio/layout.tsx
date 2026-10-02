import type { Metadata } from "next";
import Link from "next/link";

import SiteLogo from "@/components/shared/site-logo";
import { buttonVariants } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth-guard";

import StudioNav from "./studio-nav";

export const metadata: Metadata = {
  title: {
    template: "%s | Site Studio",
    default: "Site Studio",
  },
};

// A separate dashboard for how the site looks and what it says
export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center gap-3 px-4">
          <Link href="/studio" className="flex items-center gap-3">
            <SiteLogo size={36} />
            <span className="font-bold">Site Studio</span>
          </Link>

          <div className="ml-auto flex gap-2">
            <Link href="/" target="_blank" className={buttonVariants({ variant: "outline", size: "sm" })}>
              View site
            </Link>
            <Link href="/admin/overview" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Store admin
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto flex flex-1 flex-col gap-6 px-4 py-6 md:flex-row">
        <aside className="md:w-48 md:shrink-0">
          <StudioNav />
        </aside>

        <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}
