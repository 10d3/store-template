// /* eslint-disable @typescript-eslint/no-unused-vars */
// import { cookies } from "next/headers";
// import { CartItem, CartCoupon } from "../store";

// interface CartState {
//   cart: CartItem[];
//   coupon: CartCoupon | null;
// }

// export async function getCartFromCookies(): Promise<CartState> {
//   try {
//     const cookieStore = await cookies();
//     const cartCookie = cookieStore.get("shop-cart");

//     if (!cartCookie) {
//       return { cart: [], coupon: null };
//     }

//     const cartData = JSON.parse(cartCookie.value);
//     return cartData;
//   } catch (error) {
//     console.error("Error parsing cart cookie:", error);
//     return { cart: [], coupon: null };
//   }
// }
