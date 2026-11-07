export function BenefitsSection({
  title,
  subtitle,
  benefits,
  stickyBox,
}: {
  title: string;
  subtitle?: string;
  benefits: { number: string; title: string; description: string }[];
  stickyBox: React.ReactNode;
}) {
  if (!benefits || benefits.length === 0) return null;

  return (
    <section className="py-24 px-6 md:px-12 bg-secondary/20">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4">
          <span className="text-xs font-bold tracking-[0.25em] uppercase text-primary">
            What It Supports
          </span>
        </div>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-16 leading-tight max-w-3xl">
          <span dangerouslySetInnerHTML={{ __html: title.replace(/_([^_]+)_/g, '<em class="font-normal italic text-muted-foreground">$1</em>') }} />
        </h2>

        <div className="grid lg:grid-cols-12 gap-12 lg:gap-24 items-start">
          {/* Left: Benefits List */}
          <div className="lg:col-span-7 space-y-10">
            {benefits.map((benefit, i) => (
              <div
                key={i}
                className={`flex gap-6 pb-10 ${
                  i !== benefits.length - 1 ? "border-b border-border/60" : ""
                }`}
              >
                <div className="text-5xl md:text-6xl font-bold text-border/80 leading-[0.8] w-12 flex-shrink-0">
                  {benefit.number}
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3">
                    {benefit.title}
                  </h3>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Sticky Buy Box */}
          <div className="lg:col-span-5 relative hidden lg:block">
            <div className="sticky top-28">
              {stickyBox}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
