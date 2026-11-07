export function IngredientDeepDive({
  title,
  subtitle,
  ingredients,
  proprietaryBlend,
}: {
  title: string;
  subtitle?: string;
  ingredients: { 
    dose: string; 
    name: string; 
    scientific?: string; 
    description: string; 
    badge?: string;
    isHero?: boolean;
    isWide?: boolean;
  }[];
  proprietaryBlend?: {
    name: string;
    dose: string;
    description: string;
    items: string[];
  };
}) {
  if (!ingredients || ingredients.length === 0) return null;

  return (
    <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
      <div className="mb-4">
        <span className="text-xs font-bold tracking-[0.25em] uppercase text-primary">
          Full Transparency
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-min">
        {ingredients.map((ing, i) => (
          <div
            key={i}
            className={`
              bg-card border rounded-2xl p-8 relative transition-colors duration-300
              ${ing.isHero ? "border-primary lg:row-span-2 flex flex-col" : "border-border hover:border-primary/50"}
              ${ing.isWide ? "lg:col-span-3 grid lg:grid-cols-[auto_auto_1fr] items-baseline gap-x-6 gap-y-2" : ""}
            `}
          >
            {ing.isHero && (
              <div className="absolute top-0 left-8 right-8 h-1 rounded-b-md bg-gradient-to-r from-primary to-primary/60" />
            )}
            
            {ing.badge && (
              <div className="absolute top-5 right-5 bg-primary text-primary-foreground text-[0.65rem] font-bold tracking-widest uppercase px-3 py-1 rounded-full">
                {ing.badge}
              </div>
            )}

            <div className={`font-bold text-primary leading-none ${ing.isHero ? "text-4xl lg:text-5xl mt-4 mb-3" : ing.isWide ? "text-3xl m-0" : "text-3xl mb-2"}`}>
              {ing.dose}
            </div>
            
            <div className={`font-bold text-foreground tracking-wide ${ing.isHero ? "text-lg mb-1" : ing.isWide ? "text-lg m-0" : "text-base mb-1"}`}>
              {ing.name}
            </div>
            
            {ing.scientific && (
              <div className={`text-xs italic text-muted-foreground ${ing.isWide ? "m-0" : "mb-4"}`}>
                {ing.scientific}
              </div>
            )}
            
            <p className={`text-sm text-muted-foreground leading-relaxed ${ing.isHero ? "mt-auto pt-6 border-t border-border/50 text-base" : ""}`}>
              {ing.description}
            </p>
          </div>
        ))}
      </div>

      {proprietaryBlend && proprietaryBlend.items.length > 0 && (
        <div className="mt-8 bg-secondary/40 border border-border/60 rounded-3xl p-8 md:p-12">
          <h3 className="text-2xl font-bold text-foreground mb-2">
            {proprietaryBlend.name} — {proprietaryBlend.dose}
          </h3>
          <p className="text-sm font-medium text-primary tracking-wide mb-8">
            {proprietaryBlend.description}
          </p>
          
          <div className="flex flex-wrap gap-3">
            {proprietaryBlend.items.map((item, i) => (
              <div key={i} className="bg-background border border-border/60 rounded-full px-4 py-2 text-sm text-muted-foreground flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></span>
                {item}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
