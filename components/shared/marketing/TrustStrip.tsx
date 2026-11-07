import { ShieldCheck, Truck, ArrowLeftRight, CheckCircle2 } from "lucide-react";

export function TrustStrip() {
  const trusts = [
    { icon: ShieldCheck, text: "GMP Certified Facility" },
    { icon: CheckCircle2, text: "Third-Party Tested" },
    { icon: ArrowLeftRight, text: "60-Day Guarantee" },
    { icon: Truck, text: "Free Shipping Over $60" },
  ];

  return (
    <div className="bg-card border-y border-border py-6 px-6 md:px-12 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-0">
      {trusts.map((item, i) => {
        const Icon = item.icon;
        return (
          <div
            key={i}
            className={`flex items-center justify-start md:justify-center gap-3 px-4 ${
              i !== trusts.length - 1 && i % 2 === 0 ? "border-r border-border md:border-r" : ""
            } ${
              i !== trusts.length - 1 && i % 2 !== 0 ? "md:border-r border-border" : ""
            }`}
          >
            <Icon className="w-5 h-5 text-primary flex-shrink-0" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left md:text-center leading-tight">
              {item.text}
            </span>
          </div>
        );
      })}
    </div>
  );
}
