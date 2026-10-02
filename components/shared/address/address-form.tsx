"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader } from "lucide-react";
import { useTransition } from "react";
import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { shippingAddressDefaultValues } from "@/lib/constants";
import { addressSchema } from "@/lib/validators";

export type AddressFormValues = z.infer<typeof addressSchema>;

type TextField = Exclude<
  keyof AddressFormValues,
  "isDefault" | "lat" | "lng" | "country"
>;

const FIELDS: {
  name: TextField;
  label: string;
  placeholder: string;
  autoComplete: string;
  inputMode?: "tel" | "numeric";
  half?: boolean;
}[] = [
  {
    name: "fullName",
    label: "Full name",
    placeholder: "Juan dela Cruz",
    autoComplete: "name",
  },
  {
    name: "phone",
    label: "Mobile number",
    placeholder: "0917 123 4567",
    autoComplete: "tel",
    inputMode: "tel",
  },
  {
    name: "streetAddress",
    label: "House no., street, barangay",
    placeholder: "123 Rizal St., Brgy. San Antonio",
    autoComplete: "street-address",
  },
  {
    name: "city",
    label: "City / municipality",
    placeholder: "Quezon City",
    autoComplete: "address-level2",
    half: true,
  },
  {
    name: "province",
    label: "Province",
    placeholder: "Metro Manila",
    autoComplete: "address-level1",
    half: true,
  },
  {
    name: "postalCode",
    label: "ZIP code",
    placeholder: "1100",
    autoComplete: "postal-code",
    inputMode: "numeric",
    half: true,
  },
  {
    name: "label",
    label: "Label (optional)",
    placeholder: "Home, Office...",
    autoComplete: "off",
    half: true,
  },
];

type AddressFormProps = {
  defaultValues?: Partial<AddressFormValues>;
  submitLabel: string;
  showDefaultOption?: boolean;
  onSubmit: (
    values: AddressFormValues,
  ) => Promise<{ success: boolean; message: string }>;
  onSuccess?: () => void;
  onCancel?: () => void;
};

const AddressForm = ({
  defaultValues,
  submitLabel,
  showDefaultOption = false,
  onSubmit,
  onSuccess,
  onCancel,
}: AddressFormProps) => {
  const [isPending, startTransition] = useTransition();

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      ...shippingAddressDefaultValues,
      label: "",
      isDefault: false,
      ...defaultValues,
    },
  });

  const handleSubmit: SubmitHandler<AddressFormValues> = (values) => {
    startTransition(async () => {
      const result = await onSubmit(values);

      if (!result.success) {
        toast.add({
          type: "error",
          title: "Unable to save address",
          description: result.message,
        });
        return;
      }

      onSuccess?.();
    });
  };

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmit)}
      className="space-y-4"
      noValidate
    >
      <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {FIELDS.map((config) => (
          <Controller
            key={config.name}
            name={config.name}
            control={form.control}
            render={({ field, fieldState }) => (
              <Field
                data-invalid={fieldState.invalid}
                className={config.half ? undefined : "sm:col-span-2"}
              >
                <FieldLabel htmlFor={`address-${field.name}`}>
                  {config.label}
                </FieldLabel>

                <Input
                  {...field}
                  value={field.value ?? ""}
                  id={`address-${field.name}`}
                  aria-invalid={fieldState.invalid}
                  placeholder={config.placeholder}
                  autoComplete={config.autoComplete}
                  inputMode={config.inputMode}
                  disabled={isPending}
                />

                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        ))}
      </FieldGroup>

      {showDefaultOption && (
        <Controller
          name="isDefault"
          control={form.control}
          render={({ field }) => (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(field.value)}
                onChange={(event) => field.onChange(event.target.checked)}
                disabled={isPending}
                className="size-4 accent-primary"
              />
              Make this my default address
            </label>
          )}
        />
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader className="size-4 animate-spin" />}
          {submitLabel}
        </Button>

        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
};

export default AddressForm;
