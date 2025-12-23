import {
  Calendar,
  DollarSign,
  TrendingUp,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import { getAffiliatePaymentData } from "@/lib/affiliation/payment-data";
import { StripeConnectButton } from "@/app/affiliation/_components/stripe-connect-button";
import { formatPrice } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function PaymentsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const paymentData = await getAffiliatePaymentData();

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-background p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You need to be registered as an affiliate to view payment
            information.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const {
    totalEarnings,
    pendingPayment,
    nextPaymentDate,
    stripeConnectId,
    recentPayouts,
  } = paymentData;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-foreground">
            Payments & Earnings
          </h1>
          <p className="mt-2 text-muted-foreground">
            Track your affiliate earnings and manage your payment settings
          </p>
        </div>

        {/* Stripe Connect Status */}
        <div className="mb-6 rounded-2xl bg-card p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center rounded-xl bg-primary/10">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground">
                  Stripe Account
                </h3>
                <p className="text-sm text-muted-foreground">
                  {stripeConnectId
                    ? "Your Stripe account is connected"
                    : "Connect your Stripe account to receive payments"}
                </p>
              </div>
            </div>
            <StripeConnectButton
              userId={session?.user.id as string}
              stripeConnectId={stripeConnectId}
            />
          </div>
        </div>

        {/* Earnings Overview */}
        <div className="mb-6 grid gap-6 md:grid-cols-3">
          {/* Total Earnings */}
          <div className="rounded-2xl bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-semibold text-foreground">
                  {formatPrice(totalEarnings * 100)}
                </p>
              </div>
            </div>
          </div>

          {/* Pending Payment */}
          <div className="rounded-2xl bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Payment</p>
                <p className="text-2xl font-semibold text-foreground">
                  {formatPrice(pendingPayment * 100)}
                </p>
              </div>
            </div>
          </div>

          {/* Next Payment */}
          <div className="rounded-2xl bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Next Payment</p>
                <p className="text-base font-semibold text-foreground">
                  {nextPaymentDate.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Schedule Info */}
        <div className="mb-6 rounded-2xl bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-medium text-foreground">
            Payment Schedule
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
              <p className="text-sm text-muted-foreground">
                Payments are processed automatically{" "}
                <span className="font-medium text-foreground">
                  every 15 days
                </span>
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
              <p className="text-sm text-muted-foreground">
                Your next payment of{" "}
                <span className="font-medium text-foreground">
                  {formatPrice(pendingPayment * 100)}
                </span>{" "}
                will be sent on{" "}
                <span className="font-medium text-foreground">
                  {nextPaymentDate.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
              <p className="text-sm text-muted-foreground">
                Minimum payout threshold is{" "}
                <span className="font-medium text-foreground">$50.00</span>
              </p>
            </div>
          </div>
        </div>

        {/* Payment History */}
        <div className="rounded-2xl bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-medium text-foreground">
            Recent Payments
          </h3>
          <div className="space-y-4">
            {recentPayouts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No payment history available yet.
              </p>
            ) : (
              recentPayouts.map((payout) => (
                <div
                  key={payout.id}
                  className="flex items-center justify-between border-b border-border pb-4 last:border-0"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {payout.date.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Payment {payout.status.toLowerCase()}
                    </p>
                  </div>
                  <p className="text-lg font-semibold text-foreground">
                    {formatPrice(payout.amount * 100)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
