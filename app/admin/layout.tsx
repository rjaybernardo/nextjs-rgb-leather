import Image from "next/image";
import Link from "next/link";

import Menu from "@/components/shared/header/menu";
import { APP_NAME } from "@/lib/constants";

import { MainNav } from "./main-nav";
import AdminSearch from "@/components/shared/admin/admin-search";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b">
        <div className="container mx-auto">
          <div className="flex h-16 items-center px-4">
            <Link href="/" className="w-12">
              <Image
                src="/images/logo.svg"
                width={48}
                height={48}
                alt={`${APP_NAME} logo`}
              />
            </Link>
            <MainNav className="mx-6" />
            <div className="ml-auto flex items-center space-x-4">
              <AdminSearch />
              <Menu />
            </div>{" "}
          </div>
        </div>
      </div>

      <main className="container mx-auto flex-1 space-y-4 p-8 pt-6">
        {children}
      </main>
    </div>
  );
}
