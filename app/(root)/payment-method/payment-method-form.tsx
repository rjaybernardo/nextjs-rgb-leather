"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Controller, useForm, type SubmitHandler } from "react-hook-form";
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
        form.setError("type", {
          type: "server",
          message: result.message,
        });

        return;
      }

      router.push("/place-order");
    });
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <CheckoutSteps current={2} />

      <div>
        <h1 className="h2-bold mt-4">Payment Method</h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Please select your preferred payment method
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FieldGroup>
          <Controller
            name="type"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Payment Method</FieldLabel>

                <div className="flex flex-col gap-3">
                  {PAYMENT_METHODS.map((paymentMethod) => {
                    const id = `payment-${paymentMethod
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")}`;

                    const label =
                      paymentMethod === "CashOnDelivery"
                        ? "Cash on Delivery"
                        : paymentMethod;

                    return (
                      <label
                        key={paymentMethod}
                        htmlFor={id}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                          field.value === paymentMethod
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <input
                          id={id}
                          type="radio"
                          name={field.name}
                          value={paymentMethod}
                          checked={field.value === paymentMethod}
                          onChange={() => field.onChange(paymentMethod)}
                          onBlur={field.onBlur}
                          disabled={isPending}
                          className="size-4 accent-primary"
                        />

                        <span className="text-sm font-medium">{label}</span>
                      </label>
                    );
                  })}
                </div>

                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>

        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <Loader className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
          Continue
        </Button>
      </form>
    </div>
  );
};

export default PaymentMethodForm;
