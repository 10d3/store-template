"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  createDiscount,
  type DiscountState,
} from "@/lib/discounts/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Creating…" : "Create discount"}
    </Button>
  );
}

export function DiscountForm() {
  const [state, action] = useActionState(createDiscount, {} as DiscountState);
  const [type, setType] = useState("percent");
  const [duration, setDuration] = useState("once");

  return (
    <form action={action} className="space-y-4 rounded-xl border border-border/60 p-5">
      <div>
        <h2 className="font-medium">Create a promotion code</h2>
        <p className="text-sm text-muted-foreground">
          Customers enter this code on the Stripe checkout page.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium">Code</span>
          <input
            name="code"
            required
            placeholder="WELCOME10"
            className="h-9 w-full rounded-md border border-border bg-background px-3 uppercase"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Type</span>
          <select
            name="type"
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="h-9 w-full rounded-md border border-border bg-background px-3"
          >
            <option value="percent">Percentage</option>
            <option value="amount">Fixed amount</option>
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">
            {type === "percent" ? "Percent off" : "Amount off (USD)"}
          </span>
          <input
            name="value"
            type="number"
            min="0.01"
            max={type === "percent" ? "100" : undefined}
            step="0.01"
            required
            className="h-9 w-full rounded-md border border-border bg-background px-3"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Duration</span>
          <select
            name="duration"
            value={duration}
            onChange={(event) => setDuration(event.target.value)}
            className="h-9 w-full rounded-md border border-border bg-background px-3"
          >
            <option value="once">Once</option>
            <option value="forever">Forever</option>
            <option value="repeating">Repeating</option>
          </select>
        </label>

        {duration === "repeating" && (
          <label className="space-y-1 text-sm">
            <span className="font-medium">Months</span>
            <input
              name="durationInMonths"
              type="number"
              min="1"
              max="12"
              required
              className="h-9 w-full rounded-md border border-border bg-background px-3"
            />
          </label>
        )}

        <label className="space-y-1 text-sm">
          <span className="font-medium">Minimum order (USD)</span>
          <input
            name="minimumAmount"
            type="number"
            min="0"
            step="0.01"
            defaultValue="0"
            className="h-9 w-full rounded-md border border-border bg-background px-3"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Max redemptions</span>
          <input
            name="maxRedemptions"
            type="number"
            min="1"
            placeholder="Unlimited"
            className="h-9 w-full rounded-md border border-border bg-background px-3"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Expires</span>
          <input
            name="expiresAt"
            type="date"
            className="h-9 w-full rounded-md border border-border bg-background px-3"
          />
        </label>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.success && (
        <p className="text-sm text-emerald-600">{state.success}</p>
      )}

      <SubmitButton />
    </form>
  );
}
