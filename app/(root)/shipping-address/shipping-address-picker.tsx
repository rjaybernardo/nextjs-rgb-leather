"use client";

import { ArrowRight, Loader, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import AddressForm from "@/components/shared/address/address-form";
import AddressSummary from "@/components/shared/address/address-summary";
import CheckoutSteps from "@/components/shared/checkout-steps";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import {
  createAddress,
  selectShippingAddress,
  updateAddress,
} from "@/lib/actions/address.actions";
import type { Address } from "@/lib/generated/prisma/client";
import { cn } from "@/lib/utils";

type ShippingAddressPickerProps = {
  addresses: Address[];
  selectedId?: string;
};

const ShippingAddressPicker = ({
  addresses,
  selectedId,
}: ShippingAddressPickerProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [chosenId, setChosenId] = useState(
    selectedId ?? addresses.find((address) => address.isDefault)?.id,
  );
  const [mode, setMode] = useState<"pick" | "add" | "edit">(
    addresses.length === 0 ? "add" : "pick",
  );

  const chosen = addresses.find((address) => address.id === chosenId);

  const goToPayment = () => router.push("/payment-method");

  function deliverHere() {
    if (!chosenId) return;

    startTransition(async () => {
      const result = await selectShippingAddress(chosenId);

      if (result.success) {
        goToPayment();
        return;
      }

      toast.add({ type: "error", description: result.message });

      if ("incomplete" in result && result.incomplete) {
        setMode("edit");
      }
    });
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <CheckoutSteps current={1} />

      <h1 className="h2-bold mt-4">Shipping Address</h1>

      {mode === "pick" && (
        <>
          <p className="text-sm text-muted-foreground">
            Choose where we should deliver your order.
          </p>

          <fieldset className="space-y-3">
            <legend className="sr-only">Saved addresses</legend>

            {addresses.map((address) => (
              <label
                key={address.id}
                htmlFor={`ship-${address.id}`}
                className={cn(
                  "flex cursor-pointer gap-3 rounded-lg border p-4 transition-colors",
                  chosenId === address.id
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50",
                )}
              >
                <input
                  id={`ship-${address.id}`}
                  type="radio"
                  name="shipping-address"
                  checked={chosenId === address.id}
                  onChange={() => setChosenId(address.id)}
                  disabled={isPending}
                  className="mt-1 size-4 accent-primary"
                />

                <AddressSummary address={address} />
              </label>
            ))}
          </fieldset>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={deliverHere}
              disabled={!chosenId || isPending}
            >
              {isPending ? (
                <Loader className="size-4 animate-spin" />
              ) : (
                <ArrowRight className="size-4" />
              )}
              Deliver here
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => setMode("add")}
              disabled={isPending}
            >
              <Plus className="size-4" />
              Add a new address
            </Button>
          </div>
        </>
      )}

      {mode === "add" && (
        <>
          <p className="text-sm text-muted-foreground">
            We&apos;ll save this address to your account for next time.
          </p>

          <AddressForm
            submitLabel="Save and continue"
            showDefaultOption={addresses.length > 0}
            onSubmit={(values) =>
              createAddress(values, { useForShipping: true })
            }
            onSuccess={goToPayment}
            onCancel={addresses.length > 0 ? () => setMode("pick") : undefined}
          />
        </>
      )}

      {mode === "edit" && chosen && (
        <>
          <p className="text-sm text-muted-foreground">
            Add the missing details to deliver to this address.
          </p>

          <AddressForm
            key={chosen.id}
            submitLabel="Save and continue"
            defaultValues={{
              ...chosen,
              label: chosen.label ?? "",
              country: chosen.country || "Philippines",
            }}
            onSubmit={async (values) => {
              const updated = await updateAddress(chosen.id, values);

              return updated.success
                ? selectShippingAddress(chosen.id)
                : updated;
            }}
            onSuccess={goToPayment}
            onCancel={() => setMode("pick")}
          />
        </>
      )}
    </div>
  );
};

export default ShippingAddressPicker;
