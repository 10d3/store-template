import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export const metadata = {
  title: "Order Successful",
  description: "Thank you for your purchase",
};

export default function SuccessPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 md:p-8">
      <Card className="w-full max-w-lg mx-auto text-center">
        <CardContent className="pt-12 pb-10 px-6 space-y-8">
          <div className="space-y-4">
            <div className="flex justify-center">
              <CheckCircle2 className="h-20 w-20 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              Thank you for your order!
            </h1>
            <p className="text-muted-foreground">
              Your payment was successful and your order is being processed.
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              We&apos;ll send you a confirmation email with your order details
              shortly.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/orders">
                <Button variant="outline">View Orders</Button>
              </Link>
              <Link href="/">
                <Button>Continue Shopping</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
