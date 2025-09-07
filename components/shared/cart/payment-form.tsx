"use client"
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  AddressElement,
  LinkAuthenticationElement,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { useState, useTransition } from "react";

export default function PaymentForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [isTransitioning, transition] = useTransition();
  const [isLinkAuthenticationReady, setIsLinkAuthenticationReady] =
    useState(false);
  const [isAddressReady, setIsAddressReady] = useState(false);
  const [isPaymentReady, setIsPaymentReady] = useState(false);
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [email, setEmail] = useState("");

  const readyToRender =
    stripe &&
    elements &&
    isAddressReady &&
    isLinkAuthenticationReady &&
    isPaymentReady;
  return (
    <form>
      <LinkAuthenticationElement
        onReady={() => setIsLinkAuthenticationReady(true)}
        onChange={(event) => {
          if (event.complete) {
            setEmail(event.value.email);
          }
        }}
      />
      <AddressElement
        options={{
          mode: "shipping",
          fields: { phone: "always" },
          validation: { phone: { required: "auto" } },
        }}
      />

      {/* {readyToRender && !allProductsDigital && (
        <ShippingRatesSection
          locale={locale}
          onChange={(value) => {
            transition(async () => {
              setShippingRateId(value);
              await saveShippingRateAction({ shippingRateId: value });
              await elements?.fetchUpdates();
              router.refresh();
            });
          }}
          value={shippingRateId}
          shippingRates={shippingRates}
        />
      )} */}

      {readyToRender && (
        <Label
          className="flex flex-row items-center gap-x-2"
          aria-controls="billingAddressCollapsibleContent"
            aria-expanded={!sameAsShipping}
        >
          <Checkbox
            onCheckedChange={(checked) => {
              setSameAsShipping(checked === true);
            }}
            checked={sameAsShipping}
            name="sameAsShipping"
            value={sameAsShipping ? "true" : "false"}
          />
          {/* {allProductsDigital
            ? t("billingSameAsPayment")
            : t("billingSameAsShipping")} */}
        </Label>
      )}
    </form>
  );
}
