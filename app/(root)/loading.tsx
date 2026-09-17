import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="container mx-auto px-4 py-10 md:py-14">
            {/* Heading */}
            <Skeleton className="h-8 w-64 max-w-full" />
            <Skeleton className="mt-3 h-4 w-96 max-w-full" />

            {/* Content grid */}
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="space-y-3">
                        <Skeleton className="aspect-square w-full rounded-xl" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/3" />
                    </div>
                ))}
            </div>
        </div>
    );
}
