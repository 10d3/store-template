/* eslint-disable @typescript-eslint/no-unused-vars */
// hooks/usePaymentManager.ts
"use client";

import { cancelPaymentIntent, managePaymentIntent } from "@/lib/client-secret";
import { useCartStore } from "@/lib/store";
import { useState, useEffect, useCallback } from "react";

interface PaymentState {
  clientSecret: string | null;
  paymentIntentId: string | null;
  isLoading: boolean;
  error: string | null;
  status: string | null;
}

export function usePaymentManager() {
  const { cart, coupon, getSubTotal } = useCartStore();
  const [paymentState, setPaymentState] = useState<PaymentState>({
    clientSecret: null,
    paymentIntentId: null,
    isLoading: false,
    error: null,
    status: null,
  });

  const totalAmount = getSubTotal()

  // Create or update payment intent
  const createOrUpdatePaymentIntent = useCallback(async () => {
    if (cart.length === 0) {
      setPaymentState((prev) => ({
        ...prev,
        clientSecret: null,
        paymentIntentId: null,
        status: null,
      }));
      return;
    }

    setPaymentState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await managePaymentIntent({
        amount: totalAmount,
        cart,
        coupon: coupon || undefined,
        existingPaymentIntentId: paymentState.paymentIntentId || undefined,
      });

      if (result.success) {
        setPaymentState((prev) => ({
          ...prev,
          clientSecret: result.clientSecret || null,
          paymentIntentId: result.paymentIntentId || null,
          status: result.status || null,
          isLoading: false,
          error: null,
        }));
      } else {
        setPaymentState((prev) => ({
          ...prev,
          isLoading: false,
          error: result.error || "Failed to create payment intent",
        }));
      }
    } catch (error) {
      setPaymentState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Network error",
      }));
    }
  }, [cart, coupon, totalAmount, paymentState.paymentIntentId]);

  // Cancel payment intent
  const cancelPayment = useCallback(async () => {
    if (!paymentState.paymentIntentId) return false;

    try {
      const result = await cancelPaymentIntent(paymentState.paymentIntentId);

      if (result.success) {
        setPaymentState((prev) => ({
          ...prev,
          clientSecret: null,
          paymentIntentId: null,
          status: "canceled",
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error canceling payment:", error);
      return false;
    }
  }, [paymentState.paymentIntentId]);

  // Auto-update payment intent when cart changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      createOrUpdatePaymentIntent();
    }, 1000); // Debounce 1 second

    return () => clearTimeout(timeoutId);
  }, [cart, coupon, totalAmount]);

  // Clear payment intent when cart is empty
  useEffect(() => {
    if (cart.length === 0 && paymentState.paymentIntentId) {
      cancelPayment();
    }
  }, [cart.length]);

  return {
    ...paymentState,
    createPaymentIntent: createOrUpdatePaymentIntent,
    cancelPayment,
    isReady: !!paymentState.clientSecret && !paymentState.isLoading,
  };
}