"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";

type ProductImagesProps = {
  images: string[];
};

const ProductImages = ({ images }: ProductImagesProps) => {
  const [current, setCurrent] = useState(0);

  if (images.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square w-full overflow-hidden rounded-lg">
        <Image
          src={images[current]}
          alt="Product image"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover object-center"
        />
      </div>

      {/* Thumbnail Images */}
      <div className="flex flex-wrap gap-2">
        {images.map((image, index) => (
          <button
            key={`${image}-${index}`}
            type="button"
            onClick={() => setCurrent(index)}
            aria-label={`View product image ${index + 1}`}
            aria-current={current === index ? "true" : undefined}
            className={cn(
              "relative h-20 w-20 overflow-hidden rounded-md border-2",
              "cursor-pointer transition-colors hover:border-orange-500",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              current === index ? "border-orange-500" : "border-border",
            )}
          >
            <Image
              src={image}
              alt={`Product image ${index + 1}`}
              fill
              sizes="80px"
              className="object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProductImages;
