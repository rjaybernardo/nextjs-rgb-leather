import Image from "next/image";
import Link from "next/link";

import { APP_NAME } from "@/lib/constants";
import Menu from "@/components/shared/header/menu";

import MainNav from "./main-nav";

export default function UserLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="wrapper flex min-h-16 items-center px-4">
          <Link href="/" className="shrink-0">
            <Image
              src="/images/logo.svg"
              width={48}
              height={48}
              alt={`${APP_NAME} logo`}
              priority
            />
          </Link>

          <MainNav className="mx-6" />

          <div className="ml-auto flex items-center gap-2">
            <Menu />
          </div>
        </div>
      </header>

      <main className="wrapper flex-1 space-y-4 p-8 pt-6">{children}</main>
    </div>
  );
}
