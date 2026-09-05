import Image from "next/image";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";

const NotFound = () => {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16">
      <Image
        src="/images/logo.svg"
        alt={`${APP_NAME} logo`}
        width={64}
        height={64}
        priority
      />

      <div className="mt-6 w-full max-w-md rounded-lg border p-8 text-center shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight">Page Not Found</h1>

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
    </main>
  );
};

export default NotFound;
