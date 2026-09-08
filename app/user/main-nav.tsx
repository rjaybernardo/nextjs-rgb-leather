"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const links = [
  {
    title: "Profile",
    href: "/user/profile",
  },
  {
    title: "Orders",
    href: "/user/orders",
  },
];

export default function MainNav({
  className,
  ...props
}: HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();

  return (
    <nav
      className={cn("flex items-center gap-4 lg:gap-6", className)}
      {...props}
    >
      {links.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              !isActive && "text-muted-foreground",
            )}
          >
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}
