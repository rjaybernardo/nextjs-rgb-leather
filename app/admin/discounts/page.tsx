import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCoupons } from "@/lib/actions/coupon.actions";
import { couponStatus, describeDiscount, STATUS_LABELS } from "@/lib/coupon-format";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Discounts",
};

export default async function DiscountsPage() {
  const coupons = await getCoupons();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="h2-bold">Discounts</h1>
          <p className="text-sm text-muted-foreground">
            Codes customers enter on the place-order page.
          </p>
        </div>

        <Link href="/admin/discounts/new" className={buttonVariants()}>
          New discount code
        </Link>
      </div>

      {coupons.length === 0 ? (
        <p className="rounded-lg border p-8 text-center text-muted-foreground">
          No discount codes yet. Create one to offer percent off, a fixed amount off, or free
          shipping.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CODE</TableHead>
                <TableHead>DISCOUNT</TableHead>
                <TableHead>MIN ORDER</TableHead>
                <TableHead>USED</TableHead>
                <TableHead>VALID</TableHead>
                <TableHead>STATUS</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {coupons.map((coupon) => {
                const status = couponStatus(coupon);

                return (
                  <TableRow key={coupon.id}>
                    <TableCell>
                      <Link href={`/admin/discounts/${coupon.id}`} className="font-mono font-semibold hover:underline">
                        {coupon.code}
                      </Link>
                      {coupon.description && (
                        <div className="text-xs text-muted-foreground">{coupon.description}</div>
                      )}
                    </TableCell>
                    <TableCell>{describeDiscount(coupon)}</TableCell>
                    <TableCell>{coupon.minOrder > 0 ? formatCurrency(coupon.minOrder) : "None"}</TableCell>
                    <TableCell className="tabular-nums">
                      {coupon.usedCount}
                      {coupon.usageLimit !== null && ` / ${coupon.usageLimit}`}
                    </TableCell>
                    <TableCell className="text-xs">
                      {coupon.startsAt || coupon.endsAt ? (
                        <>
                          {coupon.startsAt ? formatDateTime(coupon.startsAt).dateOnly : "Now"}
                          {" → "}
                          {coupon.endsAt ? formatDateTime(coupon.endsAt).dateOnly : "No end"}
                        </>
                      ) : (
                        "Always"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status === "active" ? "secondary" : status === "paused" || status === "scheduled" ? "outline" : "destructive"}>
                        {STATUS_LABELS[status]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
