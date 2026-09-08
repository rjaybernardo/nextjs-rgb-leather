"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader } from "lucide-react";
import { useRouter } from "next/navigation";
import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import { useTransition } from "react";
import { z } from "zod";

import CheckoutSteps from "@/components/shared/checkout-steps";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { updateUserPaymentMethod } from "@/lib/actions/user.actions";
import { DEFAULT_PAYMENT_METHOD, PAYMENT_METHODS } from "@/lib/constants";
import { paymentMethodSchema } from "@/lib/validators";

type PaymentMethodFormProps = {
  preferredPaymentMethod: string | null;
};

type PaymentMethodFormValues = z.infer<typeof paymentMethodSchema>;

const PaymentMethodForm = ({
  preferredPaymentMethod,
}: PaymentMethodFormProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<PaymentMethodFormValues>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      type: preferredPaymentMethod || DEFAULT_PAYMENT_METHOD,
    },
  });

  const onSubmit: SubmitHandler<PaymentMethodFormValues> = (values) => {
    startTransition(async () => {
      const result = await updateUserPaymentMethod(values);

      if (!result.success) {
        console.error(result.message);
        return;
      }

      router.push("/place-order");
    });
  };

  return (
    <div className="mx-auto max-w-md space-y-4">
      <CheckoutSteps current={2} />

      <h1 className="h2-bold">Payment Method</h1>

      <p className="text-sm text-muted-foreground">
        Please select your preferred payment method
      </p>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FieldGroup>
          <Controller
            name="type"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Payment Method</FieldLabel>

                <div className="space-y-3">
                  {PAYMENT_METHODS.map((method) => (
                    <label
                      key={method}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                    >
                      <input
                        type="radio"
                        name={field.name}
                        value={method}
                        checked={field.value === method}
                        onChange={() => field.onChange(method)}
                        onBlur={field.onBlur}
                        disabled={isPending}
                        className="size-4"
                      />

                      <span className="text-sm font-medium">
                        {method === "CashOnDelivery"
                          ? "Cash on Delivery"
                          : method}
                      </span>
                    </label>
                  ))}
                </div>

                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>

        <div className="flex gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
            Continue
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PaymentMethodForm;
