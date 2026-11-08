"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  saveAddress,
  type AddressState,
} from "@/lib/addresses/actions";

export interface AddressFormData {
  id?: string;
  label?: string | null;
  name: string;
  line1: string;
  line2?: string | null;
  city: string;
  state?: string | null;
  postalCode: string;
  country: string;
  phone?: string | null;
  isDefault: boolean;
}

const fieldClass =
  "h-10 w-full rounded-md border border-border bg-background px-3 text-sm";

export function AddressForm({ address }: { address?: AddressFormData }) {
  const [state, action] = useActionState(saveAddress, {} as AddressState);

  return (
    <form action={action} className="space-y-4 rounded-xl border border-border/60 p-5">
      {address?.id && <input type="hidden" name="id" value={address.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span>Full name</span>
          <input name="name" required defaultValue={address?.name} className={fieldClass} />
        </label>
        <label className="space-y-1 text-sm">
          <span>Label (optional)</span>
          <input
            name="label"
            defaultValue={address?.label ?? ""}
            placeholder="Home, office…"
            className={fieldClass}
          />
        </label>
      </div>

      <label className="block space-y-1 text-sm">
        <span>Address line 1</span>
        <input name="line1" required defaultValue={address?.line1} className={fieldClass} />
      </label>
      <label className="block space-y-1 text-sm">
        <span>Address line 2 (optional)</span>
        <input name="line2" defaultValue={address?.line2 ?? ""} className={fieldClass} />
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="space-y-1 text-sm">
          <span>City</span>
          <input name="city" required defaultValue={address?.city} className={fieldClass} />
        </label>
        <label className="space-y-1 text-sm">
          <span>State / region</span>
          <input name="state" defaultValue={address?.state ?? ""} className={fieldClass} />
        </label>
        <label className="space-y-1 text-sm">
          <span>Postal code</span>
          <input
            name="postalCode"
            required
            defaultValue={address?.postalCode}
            className={fieldClass}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span>Country</span>
          <select
            name="country"
            defaultValue={address?.country ?? "US"}
            className={fieldClass}
          >
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="GB">United Kingdom</option>
            <option value="AU">Australia</option>
            <option value="DE">Germany</option>
            <option value="FR">France</option>
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span>Phone (optional)</span>
          <input name="phone" defaultValue={address?.phone ?? ""} className={fieldClass} />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isDefault"
          defaultChecked={address?.isDefault ?? false}
          className="size-4"
        />
        Use as default shipping address
      </label>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.success && (
        <p className="text-sm text-emerald-600">Address saved.</p>
      )}

      <SubmitButton editing={Boolean(address?.id)} />
    </form>
  );
}

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : editing ? "Update address" : "Save address"}
    </Button>
  );
}
