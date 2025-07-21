import { createAuthClient } from "better-auth/react";
import { stripeClient } from "@better-auth/stripe/client";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL: "http://localhost:3000",
  plugins: [
    stripeClient({
      subscription: false,
    }),
    adminClient(),
  ],
});

export const { signIn, signUp, useSession } = createAuthClient();
