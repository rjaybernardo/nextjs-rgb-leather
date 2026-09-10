"use client";

import Image from "next/image";
import slugify from "slugify";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";

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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/toast";
import { createProduct } from "@/lib/actions/product.actions";
import { productDefaultValues } from "@/lib/constants";
import { UploadButton } from "@/lib/uploadthing";

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
    control,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    defaultValues: {
      ...productDefaultValues,
      price: String(productDefaultValues.price),
      stock: Number(productDefaultValues.stock),
      images: [],
      isFeatured: false,
      banner: null,
    },
  });

  const images = useWatch({
    control,
    name: "images",
    defaultValue: [],
  });

  const isFeatured = useWatch({
    control,
    name: "isFeatured",
    defaultValue: false,
  });

  const banner = useWatch({
    control,
    name: "banner",
    defaultValue: null,
  });

  register("images", {
    validate: (value) =>
      value.length > 0 || "Product must have at least one image",
  });

  register("isFeatured");

  register("banner");

  const onSubmit = async (data: ProductFormValues) => {
    setError(null);

    if (type === "Create") {
      const result = await createProduct({
        name: data.name,
        slug: data.slug,
        category: data.category,
        brand: data.brand,
        description: data.description,
        stock: data.stock,
        images: data.images,
        isFeatured: data.isFeatured,
        banner: data.isFeatured ? data.banner : null,
        price: data.price,
      });

      if (!result.success) {
        setError(result.message);
        return;
      }

      toast.add({
        type: "success",
        description: result.message,
      });

      router.push("/admin/products");
    }
  };

  const generateSlug = () => {
    const name = getValues("name");

    setValue("slug", slugify(name, { lower: true }), {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleUploadComplete = (
    uploadedFiles: Array<{
      ufsUrl: string;
    }>,
  ) => {
    const uploadedImages = uploadedFiles
      .map((file) => file.ufsUrl)
      .filter((url): url is string => Boolean(url));

    if (uploadedImages.length === 0) {
      toast.add({
        type: "error",
        description: "Image upload completed without a valid file URL.",
      });

      return;
    }

    setValue("images", [...images, ...uploadedImages], {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleBannerUploadComplete = (
    uploadedFiles: Array<{
      ufsUrl: string;
    }>,
  ) => {
    const bannerUrl = uploadedFiles[0]?.ufsUrl;

    if (!bannerUrl) {
      toast.add({
        type: "error",
        description: "Banner upload completed without a valid file URL.",
      });

      return;
    }

    setValue("banner", bannerUrl, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleUploadError = (uploadError: Error) => {
    toast.add({
      type: "error",
      description: `Image upload failed: ${uploadError.message}`,
    });
  };

  const handleBannerUploadError = (uploadError: Error) => {
    toast.add({
      type: "error",
      description: `Banner upload failed: ${uploadError.message}`,
    });
  };

  const handleFeaturedChange = (checked: boolean) => {
    setValue("isFeatured", checked, {
      shouldDirty: true,
      shouldValidate: true,
    });

    if (!checked) {
      setValue("banner", null, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  };

  return (
    <form method="post" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
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

            {/* Images */}
            <Field data-invalid={!!errors.images}>
              <FieldLabel>Images</FieldLabel>

              <Card>
                <CardContent className="mt-2 min-h-48 space-y-4">
                  {images.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                      {images.map((image, index) => (
                        <div
                          key={`${image}-${index}`}
                          className="relative h-20 w-20 overflow-hidden rounded-sm border"
                        >
                          <Image
                            src={image}
                            alt={`Product image ${index + 1}`}
                            fill
                            sizes="80px"
                            className="object-cover object-center"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="upload-field">
                    <UploadButton
                      endpoint="imageUploader"
                      onClientUploadComplete={handleUploadComplete}
                      onUploadError={handleUploadError}
                    />
                  </div>

                  <FieldError errors={[errors.images]} />
                </CardContent>
              </Card>
            </Field>

            {/* Featured Product */}
            <Field data-invalid={!!errors.isFeatured}>
              <FieldLabel>Featured Product</FieldLabel>

              <Card>
                <CardContent className="mt-2 space-y-4">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={isFeatured}
                      onCheckedChange={(checked) =>
                        handleFeaturedChange(checked === true)
                      }
                    />

                    <span className="text-sm font-medium">Is Featured?</span>
                  </div>

                  {isFeatured && banner && (
                    <div className="relative aspect-[1920/680] w-full overflow-hidden rounded-sm">
                      <Image
                        src={banner}
                        alt="Product banner"
                        fill
                        sizes="(max-width: 768px) 100vw, 100vw"
                        className="object-cover object-center"
                      />
                    </div>
                  )}

                  {isFeatured && !banner && (
                    <div className="upload-field">
                      <UploadButton
                        endpoint="imageUploader"
                        onClientUploadComplete={handleBannerUploadComplete}
                        onUploadError={handleBannerUploadError}
                      />
                    </div>
                  )}

                  <FieldError errors={[errors.banner]} />
                </CardContent>
              </Card>
            </Field>

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
          {isSubmitting ? "Creating..." : "Create Product"}
        </Button>
      </div>
    </form>
  );
}
