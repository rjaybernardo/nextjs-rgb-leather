"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Input } from "@/components/ui/input";

const AdminSearch = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const formActionUrl = pathname.includes("/admin/orders")
    ? "/admin/orders"
    : pathname.includes("/admin/users")
      ? "/admin/users"
      : "/admin/products";

  const query = searchParams.get("query") ?? "";

  return (
    <AdminSearchInput
      key={`${pathname}?${query}`}
      formActionUrl={formActionUrl}
      initialValue={query}
    />
  );
};

function AdminSearchInput({
  formActionUrl,
  initialValue,
}: {
  formActionUrl: string;
  initialValue: string;
}) {
  const [queryValue, setQueryValue] = useState(initialValue);

  return (
    <form action={formActionUrl} method="GET">
      <Input
        type="search"
        placeholder="Search..."
        name="query"
        value={queryValue}
        onChange={(event) => setQueryValue(event.target.value)}
        className="md:w-[100px] lg:w-[300px]"
      />

      <button type="submit" className="sr-only">
        Search
      </button>
    </form>
  );
}

export default AdminSearch;
