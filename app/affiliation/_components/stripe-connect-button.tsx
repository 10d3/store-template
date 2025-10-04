"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { getStripeLink } from "@/lib/utils";

interface StripeConnectButtonProps {
  stripeConnectId: string | null;
  userId: string
}

export function StripeConnectButton({
  stripeConnectId,
  userId
}: StripeConnectButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  console.log("stripeConnectId", stripeConnectId)

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      // Get OAuth URL using the utility function
      const oauthUrl = getStripeLink("api/stripe-connect", userId as string)

      console.log("oauthUrl", oauthUrl)

      // Redirect to Stripe Connect OAuth flow
      window.location.href = oauthUrl;
    } catch (error) {
      console.error("Failed to connect Stripe account:", error);
      setIsLoading(false);
    }
  };

  const handleManage = () => {
    window.open("https://dashboard.stripe.com/connect", "_blank");
  };

  if (stripeConnectId) {
    return (
      <Button
        size="lg"
        className="bg-primary text-primary-foreground hover:bg-primary/90"
        onClick={handleManage}
      >
        Manage Account
      </Button>
    );
  }

  return (
    <Button
      size="lg"
      className="bg-primary text-primary-foreground hover:bg-primary/90"
      onClick={handleConnect}
      disabled={isLoading}
    >
      {isLoading ? "Connecting..." : "Connect Stripe"}
    </Button>
  );
}
