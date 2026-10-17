type CategoryChipsProps = {
  categories: string[]
  selected: string | null
  onSelect: (category: string | null) => void
}

export function CategoryChips({
  categories,
  selected,
  onSelect,
}: CategoryChipsProps) {
  if (categories.length === 0) return null

  const chipClass = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-xs font-medium transition ${
      active
        ? "border-foreground bg-foreground text-background"
        : "border-border/70 bg-background text-foreground/70 hover:border-border hover:text-foreground"
    }`

  return (
    <div className="flex flex-wrap gap-2">
      <button className={chipClass(selected === null)} onClick={() => onSelect(null)} type="button">
        All
      </button>
      {categories.map((category) => (
        <button
          className={chipClass(selected === category)}
          key={category}
          onClick={() => onSelect(category)}
          type="button"
        >
          {category}
        </button>
      ))}
    </div>
  )
}
