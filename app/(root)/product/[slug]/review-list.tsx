import { BadgeCheck } from "lucide-react";
import Link from "next/link";

import Rating from "@/components/shared/product/rating";
import {
  getMyReviewStatus,
  getReviews,
} from "@/lib/actions/review.actions";
import { formatDateTime } from "@/lib/utils";

import ReviewForm from "./review-form";

type ReviewListProps = {
  productId: string;
  productSlug: string;
};

const ReviewList = async ({ productId, productSlug }: ReviewListProps) => {
  const [reviews, status] = await Promise.all([
    getReviews(productId),
    getMyReviewStatus(productId),
  ]);

  return (
    <section id="reviews" className="space-y-6 scroll-mt-20">
      <h2 className="h3-bold">Customer reviews</h2>

      {!status.signedIn ? (
        <p className="text-sm text-muted-foreground">
          <Link
            className="link"
            href={`/sign-in?${new URLSearchParams({
              callbackUrl: `/product/${productSlug}#reviews`,
            })}`}
          >
            Sign in
          </Link>{" "}
          to write a review.
        </p>
      ) : status.canReview ? (
        <ReviewForm productId={productId} review={status.review} />
      ) : (
        <p className="text-sm text-muted-foreground">
          You can review this product once your order has been delivered.
        </p>
      )}

      {reviews.length === 0 ? (
        <p className="text-muted-foreground">No reviews yet.</p>
      ) : (
        <ul className="space-y-4">
          {reviews.map((review) => (
            <li key={review.id} className="space-y-2 rounded-lg border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Rating value={review.rating} />

                <span className="text-xs text-muted-foreground">
                  {formatDateTime(review.createdAt).dateOnly}
                </span>
              </div>

              <h3 className="font-semibold">{review.title}</h3>

              <p className="whitespace-pre-line text-sm text-muted-foreground">
                {review.description}
              </p>

              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                {review.userName}
                {review.isVerifiedPurchase && (
                  <>
                    <span aria-hidden="true">·</span>
                    <BadgeCheck className="size-3.5" aria-hidden="true" />
                    Verified purchase
                  </>
                )}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default ReviewList;
