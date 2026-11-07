export function PersonaGrid({
  title,
  subtitle,
  personas,
}: {
  title: string;
  subtitle?: string;
  personas: { icon: string; title: string; description: string }[];
}) {
  if (!personas || personas.length === 0) return null;

  return (
    <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
      <div className="mb-4">
        <span className="text-xs font-bold tracking-[0.25em] uppercase text-primary">
          Who It's For
        </span>
      </div>
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
        <span dangerouslySetInnerHTML={{ __html: title.replace(/_([^_]+)_/g, '<em class="font-normal italic text-muted-foreground">$1</em>') }} />
      </h2>
      {subtitle && (
        <p className="text-lg text-muted-foreground max-w-2xl mb-16 leading-relaxed">
          {subtitle}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {personas.map((persona, i) => (
          <div
            key={i}
            className="bg-secondary/30 border border-border/50 rounded-2xl p-8 hover:border-primary/40 hover:-translate-y-1 transition-all duration-300"
          >
            <span className="text-4xl mb-6 block" aria-hidden="true">
              {persona.icon}
            </span>
            <h3 className="text-xl font-bold text-foreground mb-3">
              {persona.title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {persona.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
