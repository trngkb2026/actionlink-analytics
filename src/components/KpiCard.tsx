interface KpiCardProps {
  title: string
  value: string
  subtitle?: string
  color?: 'green' | 'yellow' | 'red' | 'blue'
}

const colorMap = {
  green: 'border-green-500 text-green-400',
  yellow: 'border-yellow-500 text-yellow-400',
  red: 'border-red-500 text-red-400',
  blue: 'border-blue-500 text-blue-400',
}

export function KpiCard({ title, value, subtitle, color = 'blue' }: KpiCardProps) {
  return (
    <div className={`rounded-lg border-l-4 bg-gray-800 p-4 ${colorMap[color]}`}>
      <p className="text-sm text-gray-400">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  )
}
