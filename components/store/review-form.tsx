"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createReview, type ReviewFormState } from "@/lib/reviews/actions";
import { cn } from "@/lib/utils";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Submitting…" : "Submit review"}
    </Button>
  );
}

export function ReviewForm({ productId }: { productId: string }) {
  const [rating, setRating] = useState(5);
  const [state, action] = useActionState(createReview, {} as ReviewFormState);

  if (state.success) {
    return (
      <p className="rounded-lg bg-muted p-4 text-sm">
        Thanks! Your review is pending approval.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating} />

      <div className="space-y-2">
        <span className="text-sm font-medium">Rating</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              aria-label={`${value} star${value > 1 ? "s" : ""}`}
              className="rounded p-0.5"
            >
              <Star
                className={cn(
                  "size-6",
                  value <= rating
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground/40"
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="review-title" className="text-sm font-medium">
          Title <span className="text-muted-foreground">(optional)</span>
        </label>
        <input
          id="review-title"
          name="title"
          maxLength={120}
          className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="review-body" className="text-sm font-medium">
          Review
        </label>
        <textarea
          id="review-body"
          name="body"
          required
          minLength={10}
          maxLength={2000}
          rows={4}
          placeholder="What did you like or dislike?"
          className="w-full rounded-md border border-border bg-background p-3 text-sm"
        />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
