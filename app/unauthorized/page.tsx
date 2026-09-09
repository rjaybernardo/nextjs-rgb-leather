import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Unauthorized Access",
};

export default function UnauthorizedPage() {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-200px)] flex-col items-center justify-center space-y-4">
      <h1 className="text-4xl font-bold tracking-tight">Unauthorized Access</h1>

      <p className="text-muted-foreground">
        You do not have permission to access this page.
      </p>

      <Button render={<Link href="/" />}>Return Home</Button>
    </div>
  );
}
