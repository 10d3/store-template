import { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = {
  title: "Fulfillments",
  description: "CJ Dropshipping fulfillment status and tracking.",
};

export const dynamic = "force-dynamic";

function statusVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "DELIVERED":
      return "default";
    case "SHIPPED":
      return "secondary";
    case "CANCELLED":
    case "NEEDS_ADDRESS":
      return "destructive";
    default:
      return "outline";
  }
}

export default async function FulfillmentPage() {
  const fulfillments = await prisma.fulfillment.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      order: {
        select: {
          orderNumber: true,
          customerName: true,
          customerEmail: true,
          total: true,
        },
      },
    },
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Fulfillments</h1>
        <p className="text-sm text-muted-foreground">
          CJ Dropshipping orders, status, and tracking (latest 100).
        </p>
      </div>

      {fulfillments.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No fulfillments yet. They appear here automatically when a CJ product is
          purchased.
        </p>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>CJ Order</TableHead>
                <TableHead>Tracking</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fulfillments.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">
                    #{f.order?.orderNumber ?? f.orderId.slice(-8)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{f.order?.customerName ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">
                      {f.order?.customerEmail ?? ""}
                    </div>
                  </TableCell>
                  <TableCell>{f.provider}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(f.status)}>{f.status}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {f.cjOrderNum || f.cjOrderId || "—"}
                  </TableCell>
                  <TableCell className="text-xs">
                    {f.trackingNumber ? (
                      f.trackingUrl ? (
                        <Link
                          href={f.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline"
                        >
                          {f.trackingNumber}
                        </Link>
                      ) : (
                        f.trackingNumber
                      )
                    ) : (
                      "—"
                    )}
                    {f.carrier ? (
                      <div className="text-muted-foreground">{f.carrier}</div>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {f.createdAt.toISOString().slice(0, 10)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
