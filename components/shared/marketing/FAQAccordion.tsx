"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

export function FAQAccordion({
  title,
  faqs,
}: {
  title: string;
  faqs: { question: string; answer: string }[];
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!faqs || faqs.length === 0) return null;

  return (
    <section className="py-8 w-full">
      <h2 className="text-3xl md:text-4xl font-serif text-foreground mb-12 text-center">
        {title}
      </h2>

      <div className="space-y-4">
        {faqs.map((faq, i) => {
          const isOpen = openIndex === i;
          return (
            <div 
              key={i} 
              className={`border border-border/60 rounded-xl overflow-hidden transition-colors ${isOpen ? "bg-muted/50" : "bg-background"}`}
            >
              <button 
                className="w-full px-6 py-5 flex items-center justify-between text-left"
                onClick={() => setOpenIndex(isOpen ? null : i)}
              >
                <span className="font-medium text-foreground pr-4 text-base md:text-lg">{faq.question}</span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${isOpen ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </div>
              </button>
              
              {isOpen && (
                <div className="px-6 pb-6 text-muted-foreground leading-relaxed text-sm md:text-base">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
