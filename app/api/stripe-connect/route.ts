import { prisma } from "@/lib/prisma";
import { getStripeClient } from "@/lib/stripe";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const stripe = getStripeClient();

  try {
    // SECURITY: `state` is only trusted when it matches the authenticated
    // user's id below — this is the OAuth CSRF protection.
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user?.id) {
      return NextResponse.redirect(
        new URL(
          `/affiliation/payment?success=false&message=${encodeURIComponent("You must be signed in to connect a payout account")}`,
          request.url
        )
      );
    }

    const searchparams = request.nextUrl.searchParams;

    const code = searchparams.get("code");
    const state = searchparams.get("state");

    if (!code || !state) {
      return NextResponse.redirect(
        new URL(
          `/affiliation/payment?success=false&message=Missing+authorization+parameters`,
          request.url
        )
      );
    }

    if (state !== session.user.id) {
      return NextResponse.redirect(
        new URL(
          `/affiliation/payment?success=false&message=${encodeURIComponent("Invalid state parameter")}`,
          request.url
        )
      );
    }

    try {
      const response = await stripe.oauth.token({
        grant_type: "authorization_code",
        code,
      });

      if (!response.stripe_user_id) {
        throw new Error("Missing stripe user id");
      }

      await prisma.affiliate.update({
        where: {
          userId: session.user.id,
        },
        data: {
          bankAccount: response.stripe_user_id,
          paymentMethod: "STRIPE"
        },
      });

      return NextResponse.redirect(
        new URL(
          `/affiliation/payment?success=true&message=Stripe+account+connect+success`,
          request.url
        )
      );
    } catch (stripeError) {
      console.error(stripeError);

      return NextResponse.redirect(
        new URL(
          `/affiliation/payment?success=false&message=${encodeURIComponent((stripeError as Error).message)}`,
          request.url
        )
      );
    }
  } catch (error) {
    console.error(error);
    return NextResponse.redirect(
      new URL(
        `/affiliation/payment?success=false&message=An+unexpected+error+occurred`,
        request.url
      )
    );
  }
}
