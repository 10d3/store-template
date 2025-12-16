import type { ProductData } from "@/types/product"

export const sleepGummiesProduct: ProductData = {
  id: "dreamy-sleep-gummies",
  name: "Dreamy Sleep Gummies",
  description: "Natural sleep support for better rest",
  image: "/images/image.png",
  images: {
    "1": "/images/image.png",
    "3": "/images/image.png",
    "5": "/images/image.png",
  },
  imageAlt: "Goli Sleep Gummies",
  packOptions: [
    { value: "1", label: "1 Pack" },
    { value: "3", label: "3 Pack" },
    { value: "5", label: "5 Pack" },
  ],
  pricing: {
    subscribe: {
      // 1 Pack: Full price
      "1": { price: 17.50, total: 17.50, original: 17.50 },
      // 3 Pack: 15% off per unit
      "3": { price: 14.88, total: 44.63, original: 52.50 },
      // 5 Pack: 25% off per unit
      "5": { price: 13.13, total: 65.63, original: 87.50 },
    },
    onetime: {
      // 1 Pack: Full price
      "1": { price: 17.50, total: 17.50, original: 17.50 },
      // 3 Pack: 10% off per unit
      "3": { price: 15.75, total: 47.25, original: 52.50 },
      // 5 Pack: 20% off per unit
      "5": { price: 14.00, total: 70.00, original: 87.50 },
    },
  },
  trustIndicators: [
    { value: "100%", label: "Natural" },
    { value: "30-Day", label: "Guarantee" },
    { value: "Free", label: "Shipping" },
  ],
  subscriptionBenefits: ["Cancel anytime", "10% off every order"],
}

