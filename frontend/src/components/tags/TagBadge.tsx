interface TagBadgeProps {
  tag: string
  onRemove?: () => void
  small?: boolean
}

export default function TagBadge({ tag, onRemove, small }: TagBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded bg-accent/10 text-accent font-medium ${
        small ? 'px-1 py-0 text-2xs' : 'px-1.5 py-0.5 text-xs'
      }`}
    >
      {tag}
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          className="ml-0.5 text-gray-400 hover:text-red-500 leading-none"
          title="Remove tag"
        >
          &times;
        </button>
      )}
    </span>
  )
}
