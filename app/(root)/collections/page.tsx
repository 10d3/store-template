import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Package } from "lucide-react";

import {
    COLLECTION_NAMES,
    getCollectionDisplay,
} from "@/lib/product/collection-names";
import { getCollections } from "@/lib/product/crud";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
    title: "Collections | Vitanou",
    description:
        "Browse our curated product collections — new arrivals, best sellers, seasonal picks and more.",
};

export default async function CollectionsPage() {
    const dbCollections = await getCollections();

    // Union of DB-backed slugs and known curated slugs (deduped, stable order)
    const slugs = Array.from(
        new Set([...dbCollections.map((c) => c.slug), ...Object.keys(COLLECTION_NAMES)])
    );
    const countBySlug = new Map(dbCollections.map((c) => [c.slug, c.productCount]));

    return (
        <div className="container mx-auto px-4 py-10 md:py-14">
            {/* Header */}
            <div className="mb-10 max-w-2xl">
                <div className="flex items-center gap-3">
                    <Package className="size-8 text-primary" />
                    <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                        Collections
                    </h1>
                </div>
                <p className="mt-2 text-lg text-muted-foreground">
                    Curated selections to help you find exactly what you need.
                </p>
            </div>

            {/* Grid */}
            {slugs.length === 0 ? (
                <div className="py-16 text-center">
                    <Package className="mx-auto mb-4 size-16 text-muted-foreground/40" />
                    <h2 className="text-xl font-semibold">
                        No collections yet
                    </h2>
                    <p className="mt-2 text-muted-foreground">
                        Collections will appear here as products are added.
                        Check back soon!
                    </p>
                    <Button asChild className="mt-6 rounded-full">
                        <Link href="/">Browse All Products</Link>
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {slugs.map((slug) => {
                        const display = getCollectionDisplay(slug);
                        const productCount = countBySlug.get(slug);
                        return (
                            <Link
                                key={slug}
                                href={`/collections/${slug}`}
                                className="group relative overflow-hidden rounded-xl border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-md"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h2 className="font-semibold tracking-tight group-hover:text-primary transition-colors">
                                            {display.name}
                                        </h2>
                                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                            {display.description}
                                        </p>
                                    </div>
                                    <ArrowRight className="mt-1 size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                                </div>
                                <Badge
                                    variant="secondary"
                                    className="absolute bottom-6 left-6"
                                >
                                    {productCount !== undefined
                                        ? `${productCount} ${productCount === 1 ? "product" : "products"}`
                                        : "View collection"}
                                </Badge>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
