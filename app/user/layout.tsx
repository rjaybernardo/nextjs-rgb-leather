import Link from "next/link";

import Menu from "@/components/shared/header/menu";

import MainNav from "./main-nav";
import SiteLogo from "@/components/shared/site-logo";

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
            <SiteLogo size={48} priority />
          </Link>

          <MainNav className="mx-6" />

          <div className="ml-auto flex items-center gap-2">
            <Menu />
          </div>
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="wrapper flex-1 space-y-4 p-8 pt-6 outline-none"
      >{children}</main>
    </div>
  );
}
