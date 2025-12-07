"use client";

import { useSession } from "@/lib/auth-client";
import ReviewForm from "./review-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ReviewSectionProps {
    productId: string;
}

export default function ReviewSection({ productId }: ReviewSectionProps) {
    const { data: session } = useSession();

    if (!session?.user) {
        return (
            <Card className="border-dashed">
                <CardContent className="py-6 text-center">
                    <p className="text-gray-600 mb-4">
                        Sign in to leave a review
                    </p>
                    <Link href="/sign-in">
                        <Button variant="outline">Sign In</Button>
                    </Link>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Write a Review</CardTitle>
            </CardHeader>
            <CardContent>
                <ReviewForm productId={productId} userId={session.user.id} />
            </CardContent>
        </Card>
    );
}
