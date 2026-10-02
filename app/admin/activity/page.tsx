import type { Metadata } from "next";
import Link from "next/link";

import Pagination from "@/components/shared/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAuditLog } from "@/lib/actions/admin-log.actions";
import { formatDateTime, formatId } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Activity",
};

// Readable descriptions for the stored action keys
const ACTION_LABELS: Record<string, string> = {
  "order.ship": "Shipped order",
  "order.deliver": "Marked order delivered",
  "order.cancel": "Cancelled order",
  "order.delete": "Deleted order",
  "order.tracking.update": "Updated tracking",
  "product.create": "Created product",
  "product.update": "Updated product",
  "product.delete": "Deleted product",
  "user.update": "Updated user",
  "user.role.change": "Changed user role",
  "user.delete": "Deleted user",
  "settings.shipping.update": "Changed shipping settings",
  "category.create": "Created category",
  "category.update": "Renamed category",
  "category.delete": "Deleted category",
  "brand.create": "Created brand",
  "brand.update": "Renamed brand",
  "brand.delete": "Deleted brand",
  "site.settings.update": "Changed site settings",
  "site.section.create": "Added home section",
  "site.section.update": "Edited home section",
  "site.section.show": "Showed home section",
  "site.section.hide": "Hid home section",
  "site.section.delete": "Deleted home section",
  "site.page.create": "Created page",
  "site.page.update": "Edited page",
  "site.page.delete": "Deleted page",
  "site.subscriber.delete": "Removed subscriber",
  "coupon.create": "Created discount code",
  "coupon.update": "Edited discount code",
  "coupon.pause": "Paused discount code",
  "coupon.resume": "Resumed discount code",
  "coupon.delete": "Deleted discount code",
};

const entityHref = (entityType: string, entityId: string | null) => {
  if (!entityId) return null;
  if (entityType === "order") return `/order/${entityId}`;
  if (entityType === "product") return `/admin/products/${entityId}`;
  if (entityType === "user") return `/admin/users/${entityId}`;
  return null;
};

// Short summary of the stored details for the table
const describe = (details: unknown) => {
  if (!details || typeof details !== "object") return "";

  return Object.entries(details as Record<string, unknown>)
    .map(([key, value]) => {
      if (value && typeof value === "object" && "before" in value && "after" in value) {
        const change = value as { before: unknown; after: unknown };
        return `${key}: ${JSON.stringify(change.before)} → ${JSON.stringify(change.after)}`;
      }

      return `${key}: ${typeof value === "string" ? value : JSON.stringify(value)}`;
    })
    .join(" · ");
};

export default async function ActivityPage(props: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await props.searchParams;
  const currentPage = Number(page) || 1;

  const { entries, totalPages } = await getAuditLog({ page: currentPage });

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="h2-bold">Activity</h1>
        <p className="text-sm text-muted-foreground">
          Changes made in admin, newest first.
        </p>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>WHEN</TableHead>
              <TableHead>WHO</TableHead>
              <TableHead>WHAT</TableHead>
              <TableHead>ITEM</TableHead>
              <TableHead>DETAILS</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No admin activity yet.
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => {
                const href = entityHref(entry.entityType, entry.entityId);

                return (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDateTime(entry.createdAt).dateTime}
                    </TableCell>
                    <TableCell>{entry.actorEmail}</TableCell>
                    <TableCell>
                      {ACTION_LABELS[entry.action] ?? entry.action}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {href ? (
                        <Link href={href} className="hover:underline">
                          {entry.entityType} {formatId(entry.entityId!)}
                        </Link>
                      ) : (
                        entry.entityType
                      )}
                    </TableCell>
                    <TableCell className="max-w-md whitespace-normal text-xs text-muted-foreground">
                      {describe(entry.details)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && <Pagination page={currentPage} totalPages={totalPages} />}
    </div>
  );
}
