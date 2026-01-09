"use client";

import dynamic from "next/dynamic";

const ReviewSection = dynamic(
    () => import("@/components/shared/review-section-wrapper"),
    { ssr: false }
);

const ReviewList = dynamic(
    () => import("@/components/shared/review-list"),
    { ssr: false }
);

export default function ReviewsClient({
    productId,
    reviews,
}: {
    productId: string;
    reviews: any[];
}) {
    return (
        <>
            <ReviewSection productId={productId} />
            <ReviewList reviews={reviews} />
        </>
    );
}
