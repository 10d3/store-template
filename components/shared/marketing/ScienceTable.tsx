export function ScienceTable({
  title,
  subtitle,
  ingredients,
}: {
  title: string;
  subtitle?: string;
  ingredients: { 
    name: string; 
    amount: string; 
    function: string; 
  }[];
}) {
  if (!ingredients || ingredients.length === 0) return null;

  return (
    <section className="py-8 w-full">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-serif text-foreground mb-4">
          {title}
        </h2>
        {subtitle && (
          <p className="text-muted-foreground w-full text-lg">
            {subtitle}
          </p>
        )}
      </div>

      <div className="border border-border rounded-2xl overflow-hidden bg-background shadow-sm">
        <div className="grid grid-cols-12 gap-4 p-6 border-b border-border/60 bg-background/50 font-medium text-foreground">
          <div className="col-span-5 md:col-span-4">Ingredient</div>
          <div className="col-span-3 md:col-span-3">Amount</div>
          <div className="col-span-4 md:col-span-5">Function</div>
        </div>
        <div className="flex flex-col">
          {ingredients.map((ing, i) => (
            <div 
              key={i} 
              className={`grid grid-cols-12 gap-4 p-6 text-sm md:text-base text-muted-foreground ${
                i !== ingredients.length - 1 ? "border-b border-border/40" : ""
              }`}
            >
              <div className="col-span-5 md:col-span-4 text-foreground">{ing.name}</div>
              <div className="col-span-3 md:col-span-3">{ing.amount}</div>
              <div className="col-span-4 md:col-span-5">{ing.function}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
