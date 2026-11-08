import { DiscountForm } from "@/components/admin/discount-form";
import { formatMoney } from "@/lib/money";
import { listPromotionCodes, type DiscountRow } from "@/lib/discounts";
import { requireAdmin } from "@/lib/session";
import { toggleDiscount } from "@/lib/discounts/actions";

export const metadata = { title: "Discounts" };
export const dynamic = "force-dynamic";

function valueLabel(discount: DiscountRow) {
  if (discount.percentOff !== null) return `${discount.percentOff}% off`;
  if (discount.amountOff !== null) {
    return `${formatMoney(discount.amountOff, discount.currency ?? "usd")} off`;
  }
  return "—";
}

function durationLabel(discount: DiscountRow) {
  if (discount.duration === "repeating") {
    return `Repeating · ${discount.durationInMonths ?? 1} month${
      discount.durationInMonths === 1 ? "" : "s"
    }`;
  }
  return discount.duration === "forever" ? "Forever" : "Once";
}

export default async function AdminDiscountsPage() {
  await requireAdmin();

  let discounts: DiscountRow[] = [];
  let error: string | null = null;
  try {
    discounts = await listPromotionCodes();
  } catch (loadError) {
    console.error("[discounts] list failed:", loadError);
    error = "Could not load promotion codes from Stripe.";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl">Discounts</h1>
        <p className="text-sm text-muted-foreground">
          Create and pause Stripe promotion codes. Codes are redeemed during
          checkout.
        </p>
      </div>

      <DiscountForm />

      {error && (
        <p className="rounded-md border border-destructive/40 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-border/60 bg-background">
        {discounts.length === 0 ? (
          <p className="px-5 py-10 text-sm text-muted-foreground">
            No promotion codes yet.
          </p>
        ) : (
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b border-border/60 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Discount</th>
                <th className="px-4 py-3 font-medium">Duration</th>
                <th className="px-4 py-3 font-medium">Min order</th>
                <th className="px-4 py-3 font-medium">Uses</th>
                <th className="px-4 py-3 font-medium">Expires</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {discounts.map((discount) => (
                <tr key={discount.id}>
                  <td className="px-4 py-3 font-mono font-medium">
                    {discount.code}
                  </td>
                  <td className="px-4 py-3">{valueLabel(discount)}</td>
                  <td className="px-4 py-3">{durationLabel(discount)}</td>
                  <td className="px-4 py-3">
                    {discount.minimumAmount
                      ? formatMoney(
                          discount.minimumAmount,
                          discount.minimumAmountCurrency ?? "usd"
                        )
                      : "None"}
                  </td>
                  <td className="px-4 py-3">
                    {discount.timesRedeemed}
                    {discount.maxRedemptions
                      ? ` / ${discount.maxRedemptions}`
                      : ""}
                  </td>
                  <td className="px-4 py-3">
                    {discount.expiresAt
                      ? new Date(discount.expiresAt * 1000).toLocaleDateString()
                      : "Never"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        discount.active
                          ? "rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-800"
                          : "rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground"
                      }
                    >
                      {discount.active ? "Active" : "Paused"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form action={toggleDiscount}>
                      <input type="hidden" name="id" value={discount.id} />
                      <input
                        type="hidden"
                        name="active"
                        value={String(!discount.active)}
                      />
                      <button
                        type="submit"
                        className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted"
                      >
                        {discount.active ? "Pause" : "Activate"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
