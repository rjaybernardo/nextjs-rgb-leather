"use client";

import slugify from "slugify";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createProduct } from "@/lib/actions/product.actions";
import { productDefaultValues } from "@/lib/constants";
import { insertProductSchema } from "@/lib/validators";

type ProductFormProps = {
  type: "Create" | "Update";
};

type ProductFormValues = {
  name: string;
  slug: string;
  category: string;
  brand: string;
  description: string;
  stock: number;
  images: string[];
  price: string;
  isFeatured: boolean;
  banner: string | null;
};

export default function ProductForm({ type }: ProductFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    defaultValues: {
      ...productDefaultValues,
      price: String(productDefaultValues.price),
      stock: Number(productDefaultValues.stock),
    },
  });

  const onSubmit = async (data: ProductFormValues) => {
    setError(null);

    const parsedData = insertProductSchema.safeParse({
      ...data,
      price: data.price,
      stock: data.stock,
    });

    if (!parsedData.success) {
      setError("Please check the form fields and try again.");
      return;
    }

    const result = await createProduct(parsedData.data);

    if (!result.success) {
      setError(result.message);
      return;
    }

    router.push("/admin/products");
  };

  const generateSlug = () => {
    const name = getValues("name");

    setValue("slug", slugify(name, { lower: true }), {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>
            {type === "Create" ? "Product Information" : "Edit Product"}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <FieldGroup>
            {/* Name & Slug */}
            <div className="flex flex-col gap-5 md:flex-row">
              <Field data-invalid={!!errors.name} className="w-full">
                <FieldLabel htmlFor="name">Name</FieldLabel>

                <Input
                  id="name"
                  placeholder="Enter product name"
                  aria-invalid={!!errors.name}
                  {...register("name")}
                />

                <FieldError errors={[errors.name]} />
              </Field>

              <Field data-invalid={!!errors.slug} className="w-full">
                <FieldLabel htmlFor="slug">Slug</FieldLabel>

                <div className="flex gap-2">
                  <Input
                    id="slug"
                    placeholder="Enter product slug"
                    aria-invalid={!!errors.slug}
                    {...register("slug")}
                  />

                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateSlug}
                  >
                    Generate
                  </Button>
                </div>

                <FieldError errors={[errors.slug]} />
              </Field>
            </div>

            {/* Category & Brand */}
            <div className="flex flex-col gap-5 md:flex-row">
              <Field data-invalid={!!errors.category} className="w-full">
                <FieldLabel htmlFor="category">Category</FieldLabel>

                <Input
                  id="category"
                  placeholder="Enter category"
                  aria-invalid={!!errors.category}
                  {...register("category")}
                />

                <FieldError errors={[errors.category]} />
              </Field>

              <Field data-invalid={!!errors.brand} className="w-full">
                <FieldLabel htmlFor="brand">Brand</FieldLabel>

                <Input
                  id="brand"
                  placeholder="Enter product brand"
                  aria-invalid={!!errors.brand}
                  {...register("brand")}
                />

                <FieldError errors={[errors.brand]} />
              </Field>
            </div>

            {/* Price & Stock */}
            <div className="flex flex-col gap-5 md:flex-row">
              <Field data-invalid={!!errors.price} className="w-full">
                <FieldLabel htmlFor="price">Price</FieldLabel>

                <Input
                  id="price"
                  placeholder="Enter product price"
                  inputMode="decimal"
                  aria-invalid={!!errors.price}
                  {...register("price")}
                />

                <FieldError errors={[errors.price]} />
              </Field>

              <Field data-invalid={!!errors.stock} className="w-full">
                <FieldLabel htmlFor="stock">Stock</FieldLabel>

                <Input
                  id="stock"
                  type="number"
                  placeholder="Enter product stock"
                  aria-invalid={!!errors.stock}
                  {...register("stock", {
                    valueAsNumber: true,
                  })}
                />

                <FieldError errors={[errors.stock]} />
              </Field>
            </div>

            {/* Description */}
            <Field data-invalid={!!errors.description}>
              <FieldLabel htmlFor="description">Description</FieldLabel>

              <Textarea
                id="description"
                placeholder="Enter product description"
                className="resize-none"
                aria-invalid={!!errors.description}
                {...register("description")}
              />

              <FieldError errors={[errors.description]} />
            </Field>

            {error && (
              <div
                role="alert"
                className="text-sm font-normal text-destructive"
              >
                {error}
              </div>
            )}
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Creating..."
            : type === "Create"
              ? "Create Product"
              : "Update Product"}
        </Button>
      </div>
    </form>
  );
}
