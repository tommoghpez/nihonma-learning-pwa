interface SummaryViewProps {
  content: string
}

export function SummaryView({ content }: SummaryViewProps) {
  return (
    <div className="card">
      <h3 className="text-sm font-bold text-text-primary mb-2">要約メモ</h3>
      <div className="prose prose-sm max-w-none whitespace-pre-wrap text-text-primary">
        {content}
      </div>
    </div>
  )
}
