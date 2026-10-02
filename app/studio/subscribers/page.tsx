import type { Metadata } from "next";

import Pagination from "@/components/shared/pagination";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getSubscribers } from "@/lib/actions/studio.actions";
import { formatDateTime } from "@/lib/utils";

import DeleteSubscriberButton from "./delete-subscriber-button";

export const metadata: Metadata = {
  title: "Subscribers",
};

export default async function StudioSubscribersPage(props: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await props.searchParams;
  const currentPage = Number(page) || 1;

  const { subscribers, total, totalPages } = await getSubscribers({ page: currentPage });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="h2-bold">Subscribers</h1>
          <p className="text-muted-foreground">
            {total} {total === 1 ? "person has" : "people have"} signed up through the
            newsletter section. Only email them about what they signed up for.
          </p>
        </div>

        {total > 0 && (
          <a href="/studio/subscribers/export" className={buttonVariants({ variant: "outline" })}>
            Export CSV
          </a>
        )}
      </div>

      {subscribers.length === 0 ? (
        <p className="rounded-lg border p-8 text-center text-muted-foreground">
          No subscribers yet. Show the Newsletter sign-up section on the home page to start
          collecting emails.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>EMAIL</TableHead>
                <TableHead>SIGNED UP</TableHead>
                <TableHead className="text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {subscribers.map((subscriber) => (
                <TableRow key={subscriber.id}>
                  <TableCell>{subscriber.email}</TableCell>
                  <TableCell>{formatDateTime(subscriber.createdAt).dateTime}</TableCell>
                  <TableCell className="text-right">
                    <DeleteSubscriberButton id={subscriber.id} email={subscriber.email} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 && <Pagination page={currentPage} totalPages={totalPages} />}
    </div>
  );
}
