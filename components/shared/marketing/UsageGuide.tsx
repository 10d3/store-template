export function UsageGuide({
  title,
  subtitle,
  steps,
}: {
  title: string;
  subtitle?: string;
  steps: { title: string; description: string }[];
}) {
  if (!steps || steps.length === 0) return null;

  return (
    <section className="py-24 px-6 md:px-12 bg-secondary/20">
      <div className="max-w-5xl mx-auto">
        <div className="mb-4 text-center">
          <span className="text-xs font-bold tracking-[0.25em] uppercase text-primary">
            Simple Daily Ritual
          </span>
        </div>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 text-center leading-tight">
          <span dangerouslySetInnerHTML={{ __html: title.replace(/_([^_]+)_/g, '<em class="font-normal italic text-muted-foreground">$1</em>') }} />
        </h2>
        {subtitle && (
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-center mb-16 leading-relaxed">
            {subtitle}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((step, i) => (
            <div key={i} className="text-center p-8 bg-card border border-border/50 rounded-3xl shadow-sm">
              <div className="w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                {i + 1}
              </div>
              <h3 className="text-xl font-bold text-foreground mb-4">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
