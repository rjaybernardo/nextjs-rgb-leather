import type { Metadata } from "next";

import { getUserById } from "@/lib/actions/user.actions";

export const metadata: Metadata = {
  title: "Update User",
};

const UpdateUserPage = async (props: {
  params: Promise<{
    id: string;
  }>;
}) => {
  const { id } = await props.params;

  const user = await getUserById(id);

  console.log(user);

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <h1 className="h2-bold">Update User</h1>

      {/* FORM WILL BE ADDED IN THE NEXT LESSON */}
    </div>
  );
};

export default UpdateUserPage;
