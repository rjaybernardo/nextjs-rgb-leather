"use client";

import { Heart } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { toggleWishlist } from "@/lib/actions/wishlist.actions";
import { cn } from "@/lib/utils";

type WishlistButtonProps = {
  productId: string;
  productName: string;
  initialWishlisted: boolean;
  variant?: "icon" | "full";
  className?: string;
};

const WishlistButton = ({
  productId,
  productName,
  initialWishlisted,
  variant = "icon",
  className,
}: WishlistButtonProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [isPending, startTransition] = useTransition();

  function handleClick(event: React.MouseEvent) {
    // Cards wrap the image in a link; don't navigate when tapping the heart
    event.preventDefault();
    event.stopPropagation();

    const previous = wishlisted;
    setWishlisted(!previous);

    startTransition(async () => {
      const result = await toggleWishlist(productId);

      if ("requiresSignIn" in result && result.requiresSignIn) {
        setWishlisted(previous);
        router.push(`/sign-in?${new URLSearchParams({ callbackUrl: pathname })}`);
        return;
      }

      if (!result.success) {
        setWishlisted(previous);
        toast.add({ type: "error", description: result.message });
        return;
      }

      setWishlisted(Boolean(result.wishlisted));
      router.refresh();
    });
  }

  const label = wishlisted
    ? `Remove ${productName} from wishlist`
    : `Save ${productName} to wishlist`;

  const heart = (
    <Heart
      aria-hidden="true"
      className={cn("size-5", wishlisted && "fill-rose-500 text-rose-500")}
    />
  );

  if (variant === "full") {
    return (
      <Button
        type="button"
        variant="outline"
        className={cn("w-full", className)}
        onClick={handleClick}
        disabled={isPending}
        aria-pressed={wishlisted}
      >
        {heart}
        {wishlisted ? "Saved to wishlist" : "Save to wishlist"}
      </Button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={wishlisted}
      aria-label={label}
      title={label}
      className={cn(
        "flex size-9 items-center justify-center rounded-full bg-background/80 shadow-sm backdrop-blur transition-colors hover:bg-background focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-60",
        className,
      )}
    >
      {heart}
    </button>
  );
};

export default WishlistButton;
