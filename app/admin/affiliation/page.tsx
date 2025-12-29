import { prisma } from "@/lib/prisma";
import { AffiliateTable } from "../_components/affiliate-table";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Affiliate Management",
    description: "Manage your affiliates.",
};

export default async function AdminAffiliationPage() {
    const affiliates = await prisma.affiliate.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            user: {
                select: {
                    name: true,
                    email: true,
                },
            },
        },
    });

    return (
        <div className="space-y-6 pt-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Affiliates</h2>
                <p className="text-muted-foreground">
                    Manage affiliate applications and partners.
                </p>
            </div>

            <div className="border rounded-lg bg-background p-4">
                <AffiliateTable data={affiliates} />
            </div>
        </div>
    );
}
