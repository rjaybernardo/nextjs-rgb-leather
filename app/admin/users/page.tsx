import type { Metadata } from "next";
import Link from "next/link";

import DeleteDialog from "@/components/shared/delete-dialog";
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
import { deleteUser, getAllUsers } from "@/lib/actions/user.actions";
import { formatId } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin Users",
};

type AdminUsersPageProps = {
  searchParams: Promise<{
    page?: string;
    query?: string;
  }>;
};

const AdminUsersPage = async ({ searchParams }: AdminUsersPageProps) => {
  const { page, query: searchText = "" } = await searchParams;

  const currentPage = Number(page) || 1;

  const users = await getAllUsers({
    page: currentPage,
    query: searchText,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="h2-bold">Users</h1>

        {searchText && (
          <div>
            Filtered by <i>&quot;{searchText}&quot;</i>{" "}
            <Link
              href="/admin/users"
              className={buttonVariants({
                variant: "outline",
                size: "sm",
              })}
            >
              Remove Filter
            </Link>
          </div>
        )}
      </div>

      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>NAME</TableHead>
              <TableHead>EMAIL</TableHead>
              <TableHead>ROLE</TableHead>
              <TableHead>ACTIONS</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {users.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.data.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{formatId(user.id)}</TableCell>

                  <TableCell>{user.name}</TableCell>

                  <TableCell>{user.email}</TableCell>

                  <TableCell>{user.role}</TableCell>

                  <TableCell>
                    <div className="flex gap-1">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className={buttonVariants({
                          variant: "outline",
                          size: "sm",
                        })}
                      >
                        Edit
                      </Link>

                      <DeleteDialog id={user.id} action={deleteUser} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {users.totalPages > 1 && (
          <Pagination page={currentPage} totalPages={users.totalPages} />
        )}
      </div>
    </div>
  );
};

export default AdminUsersPage;
