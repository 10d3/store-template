import Link from "next/link";
import { AddressForm } from "@/components/account/address-form";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { Container } from "@/components/store/container";
import { Button } from "@/components/ui/button";
import {
  deleteAddress,
  setDefaultAddress,
} from "@/lib/addresses/actions";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Addresses" };

export default async function AddressesPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const session = await requireUser();
  const { edit } = await searchParams;
  const addresses = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
  const editing = edit ? addresses.find((address) => address.id === edit) : undefined;

  return (
    <Container className="py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-4xl">Addresses</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Saved addresses are used to prefill checkout.
          </p>
        </div>
        <Link href="/account" className="text-sm underline underline-offset-4">
          Back to account
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
        <div className="space-y-4">
          {addresses.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center">
              <p className="font-medium">No saved addresses</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add one to speed up checkout.
              </p>
            </div>
          ) : (
            addresses.map((address) => (
              <div
                key={address.id}
                className="rounded-xl border border-border/60 p-5 text-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {address.name}
                      {address.label ? ` · ${address.label}` : ""}
                      {address.isDefault && (
                        <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                          Default
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {address.line1}
                      {address.line2 ? `, ${address.line2}` : ""}
                      <br />
                      {address.city}
                      {address.state ? `, ${address.state}` : ""} {address.postalCode}
                      <br />
                      {address.country}
                      {address.phone ? ` · ${address.phone}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/account/addresses?edit=${address.id}`}
                      className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted"
                    >
                      Edit
                    </Link>
                    {!address.isDefault && (
                      <form action={setDefaultAddress}>
                        <input type="hidden" name="id" value={address.id} />
                        <Button type="submit" variant="outline" size="sm">
                          Set default
                        </Button>
                      </form>
                    )}
                    <form action={deleteAddress}>
                      <input type="hidden" name="id" value={address.id} />
                      <ConfirmSubmit
                        message="Delete this address?"
                        className="rounded-md border border-border px-3 py-1.5 text-xs text-destructive hover:bg-muted"
                      >
                        Delete
                      </ConfirmSubmit>
                    </form>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div>
          <h2 className="mb-3 font-serif text-2xl">
            {editing ? "Edit address" : "Add address"}
          </h2>
          <AddressForm address={editing} />
        </div>
      </div>
    </Container>
  );
}
