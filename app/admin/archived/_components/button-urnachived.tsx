"use client"

import { Button } from "@/components/ui/button"
import { unarchiveProduct } from "@/lib/admin/catalog-admin"

interface ButtonUnarchivedProps {
    productId: string
}
export const ButtonUnarchived = ({ productId }: ButtonUnarchivedProps) => {
    const unarchiveProductButton = async (productId: string) => {
        await unarchiveProduct(productId)
    }
    return (
        <Button onClick={() => unarchiveProductButton(productId)}>Unarchive</Button>
    )
}