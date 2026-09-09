"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { formUrlQuery } from "@/lib/utils";

type PaginationProps = {
  page: number | string;
  totalPages: number;
  urlParamName?: string;
};

const Pagination = ({
  page,
  totalPages,
  urlParamName = "page",
}: PaginationProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentPage = Number(page);

  const onClick = (btnType: "prev" | "next") => {
    const pageValue = btnType === "next" ? currentPage + 1 : currentPage - 1;

    const newUrl = formUrlQuery({
      params: searchParams.toString(),
      key: urlParamName,
      value: pageValue.toString(),
    });

    router.push(newUrl, { scroll: false });
  };

  return (
    <div className="flex gap-2">
      <Button
        type="button"
        size="lg"
        variant="outline"
        className="w-28"
        onClick={() => onClick("prev")}
        disabled={currentPage <= 1}
      >
        Previous
      </Button>

      <Button
        type="button"
        size="lg"
        variant="outline"
        className="w-28"
        onClick={() => onClick("next")}
        disabled={currentPage >= totalPages}
      >
        Next
      </Button>
    </div>
  );
};

export default Pagination;
