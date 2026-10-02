"use client";

import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { isAllowedImageUrl } from "@/lib/site-config";
import { UploadButton } from "@/lib/uploadthing";

type ImageFieldProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
};

// Upload to UploadThing, or type a site path like /images/banner.jpg
const ImageField = ({ id, value, onChange }: ImageFieldProps) => {
  const previewable = value && isAllowedImageUrl(value);

  return (
    <div className="space-y-2">
      {previewable && (
        <div className="relative h-32 w-full max-w-xs overflow-hidden rounded-md border bg-muted">
          <Image src={value} alt="" fill sizes="320px" className="object-contain" />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <UploadButton
          endpoint="imageUploader"
          onClientUploadComplete={(files) => {
            const url = files?.[0]?.ufsUrl;
            if (url) onChange(url);
          }}
          onUploadError={(error) => {
            toast.add({ type: "error", title: "Upload failed", description: error.message });
          }}
        />

        {value && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
            Remove image
          </Button>
        )}
      </div>

      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Or a path like /images/banner.jpg"
      />
    </div>
  );
};

export default ImageField;
