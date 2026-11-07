import { ShieldCheck } from "lucide-react";

export function GuaranteeSection({
  title,
  description,
  finePrint,
}: {
  title: string;
  description: string;
  finePrint?: string;
}) {
  return (
    <section className="py-32 px-6 md:px-12 bg-primary text-primary-foreground relative overflow-hidden text-center">
      {/* Subtle radial gradient background effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-background/5 blur-3xl pointer-events-none" />
      
      <div className="relative z-10 max-w-3xl mx-auto">
        <div className="w-20 h-20 mx-auto border-2 border-primary-foreground/20 rounded-full flex items-center justify-center mb-10">
          <ShieldCheck className="w-10 h-10 text-primary-foreground" />
        </div>
        
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 leading-[1.05] tracking-tight">
          <span dangerouslySetInnerHTML={{ __html: title.replace(/_([^_]+)_/g, '<em class="font-normal italic text-primary-foreground/80">$1</em>') }} />
        </h2>
        
        <p className="text-xl text-primary-foreground/90 leading-relaxed mb-8 max-w-2xl mx-auto">
          {description}
        </p>
        
        {finePrint && (
          <p className="text-sm font-semibold tracking-widest uppercase text-primary-foreground/60">
            {finePrint}
          </p>
        )}
      </div>
    </section>
  );
}
