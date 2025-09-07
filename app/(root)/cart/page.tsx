// export const generateMetadata = async (): Promise<Metadata> => {
//   const t = await getTranslations("/cart.metadata");
//   return {
//     title: t("title"),
//   };
// };

import CheckoutCard from "@/components/shared/cart/checkout-card";

export default async function page() {
  return (
    <>
      <h1>La vie</h1>
      <CheckoutCard />
    </>
  );
}
