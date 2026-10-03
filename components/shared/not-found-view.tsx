import Link from "next/link";

import SiteLogo from "@/components/shared/site-logo";
import { buttonVariants } from "@/components/ui/button";

/*
 * "Page not found". Inside the storefront the layout already has the page's
 * <main>, so the view is a plain section there; on its own (unknown URLs
 * outside any layout) it is the <main>.
 */
const NotFoundView = ({ as: Tag = "main" }: { as?: "main" | "section" }) => (
  <Tag
    aria-labelledby="not-found-title"
    className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16"
  >
    <SiteLogo size={64} priority />

    <div className="mt-6 w-full max-w-md rounded-lg border p-8 text-center shadow-sm">
      <h1 id="not-found-title" className="text-3xl font-bold tracking-tight">
        Page Not Found
      </h1>

      <p className="mt-3 text-muted-foreground">
        Sorry, we could not find the page you were looking for.
      </p>

      <Link
        href="/"
        className={buttonVariants({
          variant: "outline",
          className: "mt-6",
        })}
      >
        Back to Home
      </Link>
    </div>
  </Tag>
);

export default NotFoundView;
