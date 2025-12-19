import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { admin, haveIBeenPwned, magicLink } from "better-auth/plugins";
import { stripe } from "@better-auth/stripe";
import { stripeClient } from "./stripe";
import handleSubscription from "./subcription";
import { sendEmail } from "./action/send-email";
import { MagicLinkEmail } from "@/components/mails/magic-link-email";
import { ReactElement } from "react";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql", // or "mysql", "postgresql", ...etc
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      prompt: "select_account",
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [
    haveIBeenPwned(),
    stripe({
      stripeClient,
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
      createCustomerOnSignUp: true,
      onEvent: handleSubscription
    }),
    admin(),
    magicLink({
      sendMagicLink: ({ email, url }) => {
        sendEmail({
          to: email,
          subject: "Magic Link",
          react: MagicLinkEmail({ email, url }) as ReactElement,
        });
      },
    }),
  ],
});
