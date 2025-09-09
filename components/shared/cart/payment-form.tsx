// "use client";
// /* eslint-disable @typescript-eslint/no-unused-vars */
// import { Checkbox } from "@/components/ui/checkbox";
// import { Label } from "@/components/ui/label";
// import {
//   AddressElement,
//   LinkAuthenticationElement,
//   PaymentElement,
//   useElements,
//   useStripe,
// } from "@stripe/react-stripe-js";
// import { useState, useTransition } from "react";

// export default function PaymentForm() {
//   const stripe = useStripe();
//   const elements = useElements();
//   const [isLoading, setIsLoading] = useState(false);
//   const [isTransitioning, transition] = useTransition();
//   const [isLinkAuthenticationReady, setIsLinkAuthenticationReady] =
//     useState(false);
//   const [isAddressReady, setIsAddressReady] = useState(false);
//   const [isPaymentReady, setIsPaymentReady] = useState(false);
//   const [sameAsShipping, setSameAsShipping] = useState(true);
//   const [email, setEmail] = useState("");
//   const [billingAddressValues, setBillingAddressValues] = useState({
//     name: "",
//     city: "",
//     country: "",
//     line1: "",
//     line2: "",
//     postalCode: "",
//     state: "",
//     phone: "",
//     taxId: "",
//     email: "",
//   });

//   const readyToRender =
//     stripe &&
//     elements &&
//     isAddressReady &&
//     isLinkAuthenticationReady &&
//     isPaymentReady;

//   // Add loading state check
//   if (!stripe || !elements) {
//     return <div>Loading payment form...</div>;
//   }

//   return (
//     <form>
//       <LinkAuthenticationElement
//         onReady={() => setIsLinkAuthenticationReady(true)}
//         onChange={(event) => {
//           if (event.complete) {
//             setEmail(event.value.email);
//           }
//         }}
//         onLoadError={() => {
//           setIsLinkAuthenticationReady(false);
//         }}
//       />
//       <AddressElement
//         options={{
//           mode: "shipping",
//           fields: { phone: "always" },
//           validation: { phone: { required: "auto" } },
//         }}
//         onLoadError={() => {
//           setIsAddressReady(false);
//         }}
//         onChange={(e) => {
//           // do not override billing address if it's manually edited
//           if (!sameAsShipping) {
//             return;
//           }

//           if (!isAddressReady) {
//             return;
//           }

//           setBillingAddressValues({
//             name: e.value.name,
//             city: e.value.address.city,
//             country: e.value.address.country,
//             line1: e.value.address.line1,
//             line2: e.value.address.line2 ?? null,
//             postalCode: e.value.address.postal_code,
//             state: e.value.address.state ?? null,
//             phone: e.value.phone ?? null,
//             taxId: "",
//             email: email,
//           });
//         }}
//         onReady={() => setIsAddressReady(true)}
//       />

//       {/* {readyToRender && !allProductsDigital && (
//         <ShippingRatesSection
//           locale={locale}
//           onChange={(value) => {
//             transition(async () => {
//               setShippingRateId(value);
//               await saveShippingRateAction({ shippingRateId: value });
//               await elements?.fetchUpdates();
//               router.refresh();
//             });
//           }}
//           value={shippingRateId}
//           shippingRates={shippingRates}
//         />
//       )} */}

//       {readyToRender && (
//         <Label
//           className="flex flex-row items-center gap-x-2"
//           aria-controls="billingAddressCollapsibleContent"
//           aria-expanded={!sameAsShipping}
//         >
//           <Checkbox
//             onCheckedChange={(checked) => {
//               setSameAsShipping(checked === true);
//             }}
//             checked={sameAsShipping}
//             name="sameAsShipping"
//             value={sameAsShipping ? "true" : "false"}
//           />
//           {/* {allProductsDigital
//             ? t("billingSameAsPayment")
//             : t("billingSameAsShipping")} */}
//         </Label>
//       )}
//     </form>
//   );
// }
