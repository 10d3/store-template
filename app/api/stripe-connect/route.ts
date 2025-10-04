import { prisma } from "@/lib/prisma";
import { getStripeClient } from "@/lib/stripe";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const stripe = getStripeClient();

  try {
    const searchparams = request.nextUrl.searchParams;

    const code = searchparams.get("code");
    const state = searchparams.get("state");

    if (!code || !state) {
      console.error("Missing code or state", code, state);
    }

    console.log(code, state);

    console.log("processing stripe connect callback");

    try {
      const response = await stripe.oauth.token({
        grant_type: "authorization_code",
        code: code as string,
      });

      console.log("stripe connect callback processed successfully");

      if (!response.stripe_user_id) {
        throw new Error("Missing stripe user id");
      }

      await prisma.affiliate.update({
        where: {
          userId: state as string,
        },
        data: {
          bankAccount: response.stripe_user_id,
          paymentMethod: "STRIPE"
        },
      });

      console.log("stripe account id updated successfully");

      return NextResponse.redirect(
        new URL(
          `/settings?success=true&message=Stripe+account+connect+success`,
          request.url
        )
      );
    } catch (stripeError) {
      console.error(stripeError);

      return NextResponse.redirect(
        new URL(
          `/settings?success=false&message=${encodeURIComponent((stripeError as Error).message)}`,
          request.url
        )
      );
    }
  } catch (error) {
    console.error(error);
    return NextResponse.redirect(
      new URL(
        `/settings?success=false&message=An+unexpected+error+occurred`,
        request.url
      )
    );
  }
}
