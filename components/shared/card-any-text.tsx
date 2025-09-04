"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface CardAnyTextProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export default function CardAnyText({ title, children, className }: CardAnyTextProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Card className={className}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
          <div className="flex items-center justify-between">
            <CardTitle>{title}</CardTitle>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="w-9 p-0">
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                />
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent>{children}</CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
