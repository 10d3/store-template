import { getProductsByCollection, getCollections } from "@/lib/product/crud";
import ProductCollection from "@/components/shared/product-collection";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";

// Collection display names
const COLLECTION_NAMES: Record<string, { name: string; description: string }> = {
    "new-arrivals": {
        name: "New Arrivals",
        description: "Check out our latest products, fresh off the shelf",
    },
    "best-sellers": {
        name: "Best Sellers",
        description: "Our most popular products loved by customers",
    },
    "summer-essentials": {
        name: "Summer Essentials",
        description: "Everything you need for the perfect summer",
    },
    "gift-ideas": {
        name: "Gift Ideas",
        description: "Perfect presents for any occasion",
    },
    sale: {
        name: "Sale",
        description: "Great products at amazing prices",
    },
};

export async function generateStaticParams() {
    const collections = await getCollections();
    return collections.map((collection) => ({
        slug: collection.slug,
    }));
}

export default async function CollectionPage(props: {
    params: Promise<{ slug: string }>;
}) {
    const params = await props.params;
    const slug = params.slug;

    const products = await getProductsByCollection(slug);
    const collectionInfo = COLLECTION_NAMES[slug];

    if (!collectionInfo && products.length === 0) {
        notFound();
    }

    const collectionName = collectionInfo?.name || slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const collectionDescription = collectionInfo?.description || `Browse our ${collectionName} collection`;

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Back Link */}
            <Link href="/">
                <Button variant="ghost" className="mb-6 gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Button>
            </Link>

            {/* Collection Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <Package className="w-8 h-8 text-primary" />
                    <h1 className="text-4xl font-bold">{collectionName}</h1>
                    <Badge variant="secondary" className="text-sm">
                        {products.length} {products.length === 1 ? "product" : "products"}
                    </Badge>
                </div>
                <p className="text-lg text-muted-foreground max-w-2xl">
                    {collectionDescription}
                </p>
            </div>

            {/* Products Grid */}
            {products.length > 0 ? (
                <ProductCollection
                    title=""
                    products={products}
                    showViewAll={false}
                    columns={4}
                    className="py-0"
                />
            ) : (
                <div className="text-center py-16">
                    <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h2 className="text-xl font-semibold text-gray-600">No products yet</h2>
                    <p className="text-gray-500 mt-2">
                        This collection doesn't have any products yet. Check back soon!
                    </p>
                    <Link href="/">
                        <Button className="mt-6">Browse All Products</Button>
                    </Link>
                </div>
            )}

            {/* Other Collections */}
            <div className="mt-16 pt-8 border-t">
                <h2 className="text-2xl font-bold mb-6">Explore More Collections</h2>
                <div className="flex flex-wrap gap-3">
                    {Object.entries(COLLECTION_NAMES)
                        .filter(([key]) => key !== slug)
                        .map(([key, value]) => (
                            <Link key={key} href={`/collections/${key}`}>
                                <Badge
                                    variant="outline"
                                    className="text-sm px-4 py-2 hover:bg-primary hover:text-white transition-colors cursor-pointer"
                                >
                                    {value.name}
                                </Badge>
                            </Link>
                        ))}
                </div>
            </div>
        </div>
    );
}
