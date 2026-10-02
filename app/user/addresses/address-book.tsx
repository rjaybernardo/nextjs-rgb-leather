"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import AddressForm from "@/components/shared/address/address-form";
import AddressSummary from "@/components/shared/address/address-summary";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import {
  createAddress,
  deleteAddress,
  setDefaultAddress,
  updateAddress,
} from "@/lib/actions/address.actions";
import type { Address } from "@/lib/generated/prisma/client";

const AddressBook = ({ addresses }: { addresses: Address[] }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // "new", an address id being edited, or null when just listing
  const [editing, setEditing] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const done = () => {
    setEditing(null);
    router.refresh();
  };

  function runAction(action: () => Promise<{ success: boolean; message: string }>) {
    startTransition(async () => {
      const result = await action();

      toast.add({
        type: result.success ? "success" : "error",
        description: result.message,
      });

      setConfirmDeleteId(null);

      if (result.success) router.refresh();
    });
  }

  if (editing === "new") {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">New address</h2>

        <AddressForm
          submitLabel="Save address"
          showDefaultOption={addresses.length > 0}
          onSubmit={(values) => createAddress(values)}
          onSuccess={done}
          onCancel={() => setEditing(null)}
        />
      </div>
    );
  }

  const editingAddress = addresses.find((address) => address.id === editing);

  if (editingAddress) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Edit address</h2>

        <AddressForm
          key={editingAddress.id}
          submitLabel="Save changes"
          showDefaultOption={!editingAddress.isDefault}
          defaultValues={{
            ...editingAddress,
            label: editingAddress.label ?? "",
            isDefault: false,
          }}
          onSubmit={(values) => updateAddress(editingAddress.id, values)}
          onSuccess={done}
          onCancel={() => setEditing(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {addresses.length === 0 ? (
        <p className="text-muted-foreground">
          You haven&apos;t saved any addresses yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {addresses.map((address) => (
            <li key={address.id} className="space-y-3 rounded-lg border p-4">
              <AddressSummary address={address} />

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setEditing(address.id)}
                  disabled={isPending}
                >
                  Edit
                </Button>

                {!address.isDefault && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      runAction(() => setDefaultAddress(address.id))
                    }
                    disabled={isPending}
                  >
                    Set as default
                  </Button>
                )}

                {confirmDeleteId === address.id ? (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => runAction(() => deleteAddress(address.id))}
                      disabled={isPending}
                    >
                      Yes, delete
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setConfirmDeleteId(null)}
                      disabled={isPending}
                    >
                      Keep
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmDeleteId(address.id)}
                    disabled={isPending}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Button
        type="button"
        onClick={() => setEditing("new")}
        disabled={isPending}
      >
        <Plus className="size-4" />
        Add address
      </Button>
    </div>
  );
};

export default AddressBook;
