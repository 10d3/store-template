"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function ForgotPasswordForm() {
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    const { error } = await authClient.requestPasswordReset({
      email: String(form.get("email") ?? ""),
      redirectTo: "/reset-password",
    });
    setPending(false);
    if (error) {
      toast.error(error.message ?? "Could not send reset email");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="mx-auto w-full max-w-sm space-y-4 text-center">
        <h1 className="font-serif text-3xl">Check your email</h1>
        <p className="text-sm text-muted-foreground">
          If an account exists for that address, we sent a link to reset your
          password.
        </p>
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/login">Back to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-sm space-y-6">
      <div className="text-center">
        <h1 className="font-serif text-3xl">Forgot password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your email and we will send you a reset link.
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
          />
        </div>
        <Button type="submit" className="w-full rounded-full" disabled={pending}>
          {pending ? "Sending…" : "Send reset link"}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="text-foreground underline underline-offset-4">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
