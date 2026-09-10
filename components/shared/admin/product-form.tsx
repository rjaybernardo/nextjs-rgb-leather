"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
import { createProduct, updateProduct } from "@/lib/actions/product.actions";
import { productDefaultValues } from "@/lib/constants";
import { insertProductSchema, updateProductSchema } from "@/lib/validators";
import { Product } from "@/types";

type ProductFormValues = z.input<typeof insertProductSchema>;

type ProductFormProps = {
  type: "Create" | "Update";
  product?: Product;
  productId?: string;
};

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function ProductForm({
  type,
  product,
  productId,
}: ProductFormProps) {
  const isUpdate = type === "Update";

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    defaultValues: product
      ? {
          name: product.name,
          slug: product.slug,
          category: product.category,
          brand: product.brand,
          description: product.description,
          stock: product.stock,
          images: product.images,
          price: String(product.price),
          isFeatured: product.isFeatured,
          banner: product.banner,
        }
      : productDefaultValues,
  });

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        slug: product.slug,
        category: product.category,
        brand: product.brand,
        description: product.description,
        stock: product.stock,
        images: product.images,
        price: String(product.price),
        isFeatured: product.isFeatured,
        banner: product.banner,
      });
    }
  }, [product, reset]);

  const onSubmit = async (data: ProductFormValues) => {
    if (isUpdate) {
      if (!productId) {
        return;
      }

      const result = await updateProduct({
        ...data,
        id: productId,
      });

      if (!result.success) {
        console.error(result.message);
        return;
      }

      window.location.href = "/admin/products";
      return;
    }

    const result = await createProduct(data);

    if (!result.success) {
      console.error(result.message);
      return;
    }

    window.location.href = "/admin/products";
  };

  const generateSlug = () => {
    const name =
      document.querySelector<HTMLInputElement>('input[name="name"]')?.value;

    if (name) {
      setValue("slug", createSlug(name), {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
        </CardHeader>

        <CardContent>
          <FieldGroup>
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="name">Name</FieldLabel>

              <Input
                id="name"
                placeholder="Enter product name"
                aria-invalid={!!errors.name}
                {...register("name")}
              />

              <FieldError errors={[errors.name]} />
            </Field>

            <Field data-invalid={!!errors.slug}>
              <FieldLabel htmlFor="slug">Slug</FieldLabel>

              <div className="flex gap-2">
                <Input
                  id="slug"
                  placeholder="product-slug"
                  aria-invalid={!!errors.slug}
                  {...register("slug")}
                />

                <Button type="button" variant="outline" onClick={generateSlug}>
                  Generate
                </Button>
              </div>

              <FieldError errors={[errors.slug]} />
            </Field>

            <div className="grid gap-6 md:grid-cols-2">
              <Field data-invalid={!!errors.category}>
                <FieldLabel htmlFor="category">Category</FieldLabel>

                <Input
                  id="category"
                  placeholder="Enter category"
                  aria-invalid={!!errors.category}
                  {...register("category")}
                />

                <FieldError errors={[errors.category]} />
              </Field>

              <Field data-invalid={!!errors.brand}>
                <FieldLabel htmlFor="brand">Brand</FieldLabel>

                <Input
                  id="brand"
                  placeholder="Enter brand"
                  aria-invalid={!!errors.brand}
                  {...register("brand")}
                />

                <FieldError errors={[errors.brand]} />
              </Field>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Field data-invalid={!!errors.price}>
                <FieldLabel htmlFor="price">Price</FieldLabel>

                <Input
                  id="price"
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  aria-invalid={!!errors.price}
                  {...register("price")}
                />

                <FieldError errors={[errors.price]} />
              </Field>

              <Field data-invalid={!!errors.stock}>
                <FieldLabel htmlFor="stock">Stock</FieldLabel>

                <Input
                  id="stock"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  aria-invalid={!!errors.stock}
                  {...register("stock", {
                    valueAsNumber: true,
                  })}
                />

                <FieldError errors={[errors.stock]} />
              </Field>
            </div>

            <Field data-invalid={!!errors.description}>
              <FieldLabel htmlFor="description">Description</FieldLabel>

              <Textarea
                id="description"
                placeholder="Enter product description"
                aria-invalid={!!errors.description}
                {...register("description")}
              />

              <FieldError errors={[errors.description]} />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving..."
            : type === "Create"
              ? "Create Product"
              : "Update Product"}
        </Button>
      </div>
    </form>
  );
}
