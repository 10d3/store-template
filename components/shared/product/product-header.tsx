interface ProductHeaderProps {
  name: string
  description: string
}

export function ProductHeader({ name, description }: ProductHeaderProps) {
  return (
    <div className="space-y-2 mb-4">
      <h1 className="text-2xl font-semibold text-foreground text-balance line-clamp-1">{name}</h1>
      <p className="text-sm text-muted-foreground line-clamp-1">{description}</p>
    </div>
  )
}
