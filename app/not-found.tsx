import Link from "next/link";
import { Compass, Home, SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-20 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                <SearchX className="size-8 text-muted-foreground" />
            </div>

            <p className="mt-8 text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Error 404
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight md:text-5xl">
                Page not found
            </h1>
            <p className="mt-4 max-w-md text-muted-foreground">
                Sorry, we couldn&apos;t find the page you&apos;re looking for.
                It may have been moved or no longer exists.
            </p>

            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" className="rounded-full">
                    <Link href="/">
                        <Home className="size-4" />
                        Back to Home
                    </Link>
                </Button>
                <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="rounded-full"
                >
                    <Link href="/collections">
                        <Compass className="size-4" />
                        Browse Collections
                    </Link>
                </Button>
            </div>
        </div>
    );
}
