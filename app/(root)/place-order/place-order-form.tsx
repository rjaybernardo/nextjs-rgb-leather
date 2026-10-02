"use client";

import { Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { createOrder } from "@/lib/actions/order.actions";

const PlaceOrderForm = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await createOrder();

      if (!result.success) {
        toast.add({
          title: "Unable to place order",
          description: result.message,
          type: "error",
        });
      }

      if (result.redirectTo) {
        router.push(result.redirectTo);
        router.refresh();
      }
    });
  };

  return (
    <form action={handleSubmit} className="w-full">
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Check className="mr-2 size-4" />
            Place Order
          </>
        )}
      </Button>
    </form>
  );
};

export default PlaceOrderForm;
