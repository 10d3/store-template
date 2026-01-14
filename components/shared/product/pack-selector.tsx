"use client"

import type { PackOption } from "@/types/product"

interface PackSelectorProps {
  options: PackOption[]
  selected: string
  onSelect: (value: string) => void
  label?: string
}

export function PackSelector({ options, selected, onSelect, label = "Select quantity" }: PackSelectorProps) {
  return (
    <div className="mb-4">
      <label className="text-sm font-medium text-foreground mb-3 block">{label}</label>
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onSelect(option.value)}
            className={`py-2 px-2 rounded-lg cursor-pointer border-2 transition-all font-medium ${selected === option.value
              ? "border-transparent bg-[#73BF44] [a&]:hover:bg-[#73BF44]/90 text-background"
              : "border-border hover:border-foreground/40 text-foreground"
              }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
