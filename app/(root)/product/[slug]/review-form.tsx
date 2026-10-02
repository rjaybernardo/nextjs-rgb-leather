"use client";

import { Star } from "lucide-react";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { upsertReview } from "@/lib/actions/review.actions";
import { cn } from "@/lib/utils";

type ReviewFormProps = {
  productId: string;
  review: {
    rating: number;
    title: string;
    description: string;
  } | null;
};

const initialState = {
  success: false,
  message: "",
};

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : isEdit ? "Update review" : "Post review"}
    </Button>
  );
}

const ReviewForm = ({ productId, review }: ReviewFormProps) => {
  const [state, action] = useActionState(upsertReview, initialState);
  const [rating, setRating] = useState(review?.rating ?? 0);

  return (
    <form action={action} className="space-y-4 rounded-lg border p-4">
      <h3 className="font-semibold">
        {review ? "Edit your review" : "Write a review"}
      </h3>

      <input type="hidden" name="productId" value={productId} />

      <fieldset>
        <legend className="mb-1 text-sm font-medium">Your rating</legend>

        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <label key={value} className="cursor-pointer">
              <input
                type="radio"
                name="rating"
                value={value}
                checked={rating === value}
                onChange={() => setRating(value)}
                className="peer sr-only"
                required
              />

              <span className="sr-only">
                {value} star{value === 1 ? "" : "s"}
              </span>

              <Star
                aria-hidden="true"
                className={cn(
                  "size-7 rounded-sm text-muted-foreground/50 peer-focus-visible:outline-2 peer-focus-visible:outline-ring",
                  value <= rating && "fill-amber-400 text-amber-400",
                )}
              />
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <Label htmlFor="review-title">Title</Label>

        <Input
          id="review-title"
          name="title"
          required
          minLength={3}
          maxLength={120}
          defaultValue={review?.title}
          placeholder="Sum it up in a few words"
        />
      </div>

      <div>
        <Label htmlFor="review-description">Review</Label>

        <Textarea
          id="review-description"
          name="description"
          required
          minLength={3}
          maxLength={2000}
          rows={4}
          defaultValue={review?.description}
          placeholder="How's the leather, stitching and fit?"
        />
      </div>

      <SubmitButton isEdit={Boolean(review)} />

      {state.message && (
        <p
          className={cn(
            "text-sm",
            state.success ? "text-muted-foreground" : "text-destructive",
          )}
          role="status"
        >
          {state.message}
        </p>
      )}
    </form>
  );
};

export default ReviewForm;
