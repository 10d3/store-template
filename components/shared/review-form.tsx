"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createReview } from "@/lib/review/crud";
import StarRatingInput from "./star-rating-input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ReviewFormProps {
    productId: string;
    userId: string;
    onSuccess?: () => void;
}

export default function ReviewForm({
    productId,
    userId,
    onSuccess,
}: ReviewFormProps) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (rating === 0) {
            toast.error("Please select a rating");
            return;
        }

        setIsSubmitting(true);

        try {
            await createReview({
                userId,
                productId,
                rating,
                comment: comment.trim() || undefined,
            });

            toast.success("Review submitted successfully!");
            setRating(0);
            setComment("");
            router.refresh();
            onSuccess?.();
        } catch (error) {
            console.error("Error submitting review:", error);
            toast.error("Failed to submit review");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Rating
                </label>
                <StarRatingInput
                    value={rating}
                    onChange={setRating}
                    allowHalf={true}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Review (optional)
                </label>
                <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your thoughts about this product..."
                    className="min-h-[100px] resize-none"
                />
            </div>

            <Button
                type="submit"
                disabled={isSubmitting || rating === 0}
                className="w-full bg-[#063354] hover:bg-[#063354]/80 dark:bg-white dark:hover:bg-white/80"
            >
                {isSubmitting ? "Submitting..." : "Submit Review"}
            </Button>
        </form>
    );
}
