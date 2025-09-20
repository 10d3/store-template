export function BlogHeader() {
  return (
    <header className="relative overflow-hidden bg-background">
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent" />
      <div className="relative mx-auto max-w-6xl px-6 py-10 md:py-24 lg:py-32">
        <div className="text-center">
          <h1 className="font-serif text-5xl font-light tracking-tight text-foreground lg:text-7xl text-balance">
            {"Insights & Stories"}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground text-pretty">
            {
              "Discover thoughtful perspectives on design, technology, and the craft of building meaningful digital experiences."
            }
          </p>
        </div>
      </div>
    </header>
  );
}
