import { User } from "lucide-react";
import Link from "next/link";

import { auth } from "@/auth";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutUser } from "@/lib/actions/user.actions";

const UserButton = async () => {
  const session = await auth();

  if (!session) {
    return (
      <Link
        href="/sign-in"
        className={buttonVariants({
          variant: "default",
          size: "lg",
          className: "w-full gap-2 rounded-lg px-5 md:w-auto",
        })}
      >
        <User className="size-5" />
        <span>Sign In</span>
      </Link>
    );
  }

  const firstInitial = session.user?.name?.charAt(0).toUpperCase() ?? "";

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              className="relative ml-2 flex size-8 items-center justify-center rounded-full bg-gray-300"
              aria-label="Open user menu"
            />
          }
        >
          {firstInitial}
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-56" align="end">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {session.user?.name}
                </p>

                <p className="text-xs leading-none text-muted-foreground">
                  {session.user?.email}
                </p>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuItem
              render={<Link href="/user/profile" className="w-full" />}
            >
              User Profile
            </DropdownMenuItem>

            <DropdownMenuItem
              render={<Link href="/user/orders" className="w-full" />}
            >
              Order History
            </DropdownMenuItem>

            <DropdownMenuItem className="mb-1 p-0">
              <form action={signOutUser} className="w-full">
                <button
                  type="submit"
                  className="flex h-8 w-full items-center justify-start rounded-sm px-2 text-sm hover:bg-accent hover:text-accent-foreground"
                >
                  Sign Out
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default UserButton;
