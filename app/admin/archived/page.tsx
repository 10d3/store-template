
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { getArchivedProducts } from "@/lib/product/crud"
import Image from "next/image"
import { ButtonUnarchived } from "./_components/button-urnachived"

export default async function page() {
    const products = await getArchivedProducts()
    console.log(products)
    return (
        <div>
            <h1>Archived</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                    <Card key={product.id}>
                        <CardHeader>
                            <CardTitle>{product.name}</CardTitle>
                            <CardDescription className="line-clamp-1">{product.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Image className="aspect-video rounded-lg" src={product?.images?.[0] || ""} alt={product.name} width={1000} height={1000} />
                        </CardContent>
                        <CardFooter>
                            <ButtonUnarchived productId={product.id} />
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    )
}