import { ShieldCheck, Truck, RotateCcw } from "lucide-react";

const items = [
  {
    icon: ShieldCheck,
    label: "Secure checkout",
    desc: "Encrypted payment",
  },
  {
    icon: Truck,
    label: "Tracked shipping",
    desc: "Delivered to your door",
  },
  {
    icon: RotateCcw,
    label: "Easy returns",
    desc: "Hassle-free policy",
  },
];

/**
 * Trust reassurance row shown directly under the purchase panel.
 * Adjust copy to match the store's actual shipping/return policies.
 */
export default function PurchaseReassurances() {
  return (
    <div className="grid grid-cols-3 gap-2 rounded-lg border bg-muted/30 p-3">
      {items.map(({ icon: Icon, label, desc }) => (
        <div
          key={label}
          className="flex flex-col items-center gap-1 text-center"
        >
          <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
          <span className="text-xs font-medium leading-tight">{label}</span>
          <span className="text-[11px] leading-tight text-muted-foreground">
            {desc}
          </span>
        </div>
      ))}
    </div>
  );
}
