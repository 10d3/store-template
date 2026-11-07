"use client";

import { useActionState } from "react";
import type { ActionState } from "@/lib/admin/actions";

type Term = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  position: number;
};

export function TermForm({
  action,
  term,
  label,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  term?: Term;
  label: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-border/60 bg-background p-5">
      <h2 className="font-medium">{term ? `Edit ${label}` : `New ${label}`}</h2>
      {term && <input type="hidden" name="id" value={term.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span>Name</span>
          <input
            name="name"
            defaultValue={term?.name ?? ""}
            required
            className="w-full rounded-md border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span>Slug</span>
          <input
            name="slug"
            defaultValue={term?.slug ?? ""}
            placeholder="auto from name"
            className="w-full rounded-md border border-border bg-background px-3 py-2"
          />
        </label>
      </div>

      <label className="space-y-1 text-sm">
        <span>Description</span>
        <textarea
          name="description"
          defaultValue={term?.description ?? ""}
          rows={3}
          className="w-full rounded-md border border-border bg-background px-3 py-2"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span>Image URL</span>
          <input
            name="image"
            defaultValue={term?.image ?? ""}
            className="w-full rounded-md border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span>Position</span>
          <input
            name="position"
            type="number"
            defaultValue={term?.position ?? 0}
            className="w-full rounded-md border border-border bg-background px-3 py-2"
          />
        </label>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        {pending ? "Saving…" : term ? "Save changes" : `Create ${label}`}
      </button>
    </form>
  );
}
