import type { Title } from '@/lib/titles'

interface Props {
  title: Title
  size?: 'sm' | 'md'
}

export function TitleBadge({ title, size = 'sm' }: Props) {
  const sizeClass = size === 'sm'
    ? 'text-[10px] px-1.5 py-0.5'
    : 'text-xs px-2 py-0.5'

  return (
    <span className={`inline-flex items-center font-bold rounded-full whitespace-nowrap ${title.bgClass} ${title.textClass} ${sizeClass}`}>
      {title.name}
    </span>
  )
}
