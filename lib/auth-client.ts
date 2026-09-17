import { createAuthClient } from "better-auth/react";
import { stripeClient } from "@better-auth/stripe/client";
import { adminClient, magicLinkClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
  plugins: [
    stripeClient({
      subscription: false,
    }),
    adminClient(),
    magicLinkClient(),
  ],
});

export const { signIn, signUp, useSession } = authClient;
