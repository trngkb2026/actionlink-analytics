import { useMemo } from 'react'
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts'
import { fetchRfmSegments } from '../lib/queries'
import { useQuery } from '../hooks/useQuery'
import { ChartSkeleton, TableSkeleton } from './Skeleton'
import { ErrorMessage } from './ErrorMessage'

const SEGMENT_COLORS: Record<string, string> = {
  Champions: '#22c55e',
  'Loyal Customers': '#16a34a',
  'Potential Loyalist': '#84cc16',
  'New Customers': '#06b6d4',
  Promising: '#3b82f6',
  'Need Attention': '#f59e0b',
  'About To Sleep': '#f97316',
  'At Risk': '#ef4444',
  "Can't Lose Them": '#dc2626',
  Hibernating: '#6b7280',
  Lost: '#374151',
}

interface TreemapContentProps {
  x: number
  y: number
  width: number
  height: number
  name: string
  value: number
  color: string
}

function CustomContent({ x, y, width, height, name, value, color }: TreemapContentProps) {
  if (width < 40 || height < 30) return null
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={color} rx={4} opacity={0.85} />
      {width > 60 && height > 40 && (
        <>
          <text x={x + width / 2} y={y + height / 2 - 6} textAnchor="middle" fill="#fff" fontSize={11} fontWeight="bold">
            {name}
          </text>
          <text x={x + width / 2} y={y + height / 2 + 10} textAnchor="middle" fill="#fff" fontSize={10}>
            {value.toLocaleString()}人
          </text>
        </>
      )}
    </g>
  )
}

export function RfmSegments() {
  const { data, loading, error } = useQuery(fetchRfmSegments)

  const treemapData = useMemo(() => {
    if (!data) return []
    return data.map(row => ({
      name: row.segment,
      value: row.customers,
      color: SEGMENT_COLORS[row.segment] ?? '#6b7280',
    }))
  }, [data])

  const fmt = (n: number) => n.toLocaleString()
  const fmtYen = (n: number) => `¥${n.toLocaleString()}`

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">RFMセグメント</h2>

      {error && <ErrorMessage message={error} />}

      {loading ? (
        <>
          <ChartSkeleton />
          <TableSkeleton rows={6} cols={5} />
        </>
      ) : (
        <>
          <div className="h-80 rounded-lg bg-gray-800 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <Treemap
                data={treemapData}
                dataKey="value"
                stroke="#1f2937"
                content={<CustomContent x={0} y={0} width={0} height={0} name="" value={0} color="" />}
              >
                <Tooltip
                  formatter={(value) => `${Number(value).toLocaleString()}人`}
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
                  labelStyle={{ color: '#9ca3af' }}
                />
              </Treemap>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400">
                  <th className="p-2">セグメント</th>
                  <th className="p-2 text-right">顧客数</th>
                  <th className="p-2 text-right">平均Recency(日)</th>
                  <th className="p-2 text-right">平均Frequency</th>
                  <th className="p-2 text-right">平均Monetary</th>
                </tr>
              </thead>
              <tbody>
                {data?.map(row => (
                  <tr key={row.segment} className="border-t border-gray-700">
                    <td className="p-2">
                      <span
                        className="inline-block w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: SEGMENT_COLORS[row.segment] ?? '#6b7280' }}
                      />
                      {row.segment}
                    </td>
                    <td className="p-2 text-right font-mono">{fmt(row.customers)}</td>
                    <td className="p-2 text-right font-mono">{fmt(row.avg_recency)}</td>
                    <td className="p-2 text-right font-mono">{row.avg_freq}</td>
                    <td className="p-2 text-right font-mono">{fmtYen(row.avg_monetary)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
