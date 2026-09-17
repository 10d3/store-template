"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Home, RefreshCw, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ErrorPage({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Surface the error for observability (Sentry/console pipelines)
        console.error(error);
    }, [error]);

    return (
        <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
            <Card className="w-full max-w-md text-center">
                <CardContent className="space-y-6 px-6 pb-10 pt-12">
                    <div className="flex justify-center">
                        <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10">
                            <TriangleAlert className="size-7 text-destructive" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold tracking-tight">
                            Something went wrong
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            An unexpected error occurred while loading this
                            page. Please try again.
                        </p>
                    </div>

                    <div className="flex flex-col justify-center gap-3 sm:flex-row">
                        <Button onClick={reset} className="rounded-full">
                            <RefreshCw className="size-4" />
                            Try again
                        </Button>
                        <Button
                            asChild
                            variant="outline"
                            className="rounded-full"
                        >
                            <Link href="/">
                                <Home className="size-4" />
                                Back to Home
                            </Link>
                        </Button>
                    </div>

                    {error.digest && (
                        <p className="text-xs text-muted-foreground/70">
                            Error reference: {error.digest}
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
