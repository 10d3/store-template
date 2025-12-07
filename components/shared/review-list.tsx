"use client";

import { ReviewWithUser } from "@/lib/review/crud";
import StarRating from "./star-rating";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

interface ReviewListProps {
    reviews: ReviewWithUser[];
}

export default function ReviewList({ reviews }: ReviewListProps) {
    if (reviews.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                No reviews yet. Be the first to review this product!
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {reviews.map((review) => (
                <div
                    key={review.id}
                    className="border-b border-gray-100 pb-6 last:border-0"
                >
                    <div className="flex items-start gap-4">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={review.user.image || undefined} />
                            <AvatarFallback>
                                {review.user.name?.charAt(0).toUpperCase() || "U"}
                            </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-900">{review.user.name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <StarRating rating={review.rating} size="sm" />
                                        <span className="text-sm text-gray-500">
                                            {formatDistanceToNow(new Date(review.createdAt), {
                                                addSuffix: true,
                                            })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {review.comment && (
                                <p className="mt-3 text-gray-700 leading-relaxed">
                                    {review.comment}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
