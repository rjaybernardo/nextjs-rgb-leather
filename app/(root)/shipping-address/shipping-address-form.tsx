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
import { Input } from "@/components/ui/input";
import { updateUserAddress } from "@/lib/actions/user.actions";
import { shippingAddressDefaultValues } from "@/lib/constants";
import { shippingAddressSchema } from "@/lib/validators";
import type { ShippingAddress } from "@/types";

type ShippingAddressFormProps = {
  address: ShippingAddress | null;
};

type ShippingAddressFormValues = z.infer<typeof shippingAddressSchema>;

const ShippingAddressForm = ({ address }: ShippingAddressFormProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<ShippingAddressFormValues>({
    resolver: zodResolver(shippingAddressSchema),
    defaultValues: address ?? shippingAddressDefaultValues,
  });

  const onSubmit: SubmitHandler<ShippingAddressFormValues> = (values) => {
    startTransition(async () => {
      const result = await updateUserAddress(values);

      if (!result.success) {
        console.error(result.message);
        return;
      }

      router.push("/payment-method");
    });
  };

  return (
    <div className="mx-auto max-w-md space-y-4">
      <CheckoutSteps current={1} />

      <h1 className="h2-bold mt-4">Shipping Address</h1>

      <p className="text-sm text-muted-foreground">
        Please enter the address that you want to ship to
      </p>

      <form
        method="post"
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <FieldGroup>
          <Controller
            name="fullName"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Full Name</FieldLabel>

                <Input
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  placeholder="Enter full name"
                  autoComplete="name"
                  disabled={isPending}
                />

                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="streetAddress"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Address</FieldLabel>

                <Input
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  placeholder="Enter address"
                  autoComplete="street-address"
                  disabled={isPending}
                />

                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <div className="flex flex-col gap-5 md:flex-row">
            <Controller
              name="city"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="w-full">
                  <FieldLabel htmlFor={field.name}>City</FieldLabel>

                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="Enter city"
                    autoComplete="address-level2"
                    disabled={isPending}
                  />

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="country"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="w-full">
                  <FieldLabel htmlFor={field.name}>Country</FieldLabel>

                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="Enter country"
                    autoComplete="country-name"
                    disabled={isPending}
                  />

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="postalCode"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="w-full">
                  <FieldLabel htmlFor={field.name}>Postal Code</FieldLabel>

                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="Enter postal code"
                    autoComplete="postal-code"
                    disabled={isPending}
                  />

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>
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

export default ShippingAddressForm;
