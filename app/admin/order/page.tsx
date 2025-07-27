// "use client";

import { OrderTable } from "@/app/admin/_components/order-table";

export default function OrderPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Order Management</h1>
        <p className="text-muted-foreground">
          Manage and track all orders from your Stripe account
        </p>
      </div>

      <OrderTable />
    </div>
  );
}
