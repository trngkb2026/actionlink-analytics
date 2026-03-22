import { fetchGoldenPath, type GoldenPathRow } from '../lib/queries'
import { useQuery } from '../hooks/useQuery'
import { TableSkeleton } from './Skeleton'
import { ErrorMessage } from './ErrorMessage'
import { KpiCard } from './KpiCard'
import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export function GoldenPath() {
  const { data, loading, error } = useQuery(fetchGoldenPath)

  const topPaths = useMemo(() => {
    if (!data) return []
    return data.slice(0, 15)
  }, [data])

  const chartData = useMemo(() => {
    return topPaths.map(r => ({
      name: `${r.initial_bottles}本×${r.channel}×${r.second_order_speed}`,
      high_ltv_pct: r.high_ltv_pct,
      avg_ltv: r.avg_ltv,
      customers: r.customers,
    }))
  }, [topPaths])

  const topKpis = useMemo(() => {
    if (!data || data.length === 0) return []
    return data.slice(0, 3).map(r => ({
      title: `${r.initial_bottles}本 x ${r.channel} x ${r.second_order_speed}`,
      value: `${r.high_ltv_pct}%`,
      subtitle: `${r.customers}人 / 平均LTV ¥${r.avg_ltv.toLocaleString()}`,
      color: (r.high_ltv_pct >= 40 ? 'green' : 'yellow') as 'green' | 'yellow',
    }))
  }, [data])

  const fmtYen = (n: number) => `¥${n.toLocaleString()}`

  function getRowBg(row: GoldenPathRow): string {
    if (row.high_ltv_pct >= 40) return 'bg-green-900/30'
    return ''
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">ゴールデンパス</h2>
      <p className="text-sm text-gray-400">
        初回本数 x チャネル x 2回目注文速度 の組み合わせ別 High LTV比率
      </p>

      {error && <ErrorMessage message={error} />}

      {loading ? (
        <TableSkeleton rows={10} cols={6} />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            {topKpis.map(k => (
              <KpiCard key={k.title} title={k.title} value={k.value} subtitle={k.subtitle} color={k.color} />
            ))}
          </div>

          <div className="h-80 rounded-lg bg-gray-800 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 180 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={v => `${v}%`} domain={[0, 'auto']} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} width={180} />
                <Tooltip
                  formatter={(value) =>
                    `${value}%`
                  }
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Bar dataKey="high_ltv_pct" name="High LTV率" radius={[0, 4, 4, 0]}>
                  {chartData.map((d, i) => (
                    <Cell key={i} fill={d.high_ltv_pct >= 40 ? '#22c55e' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400">
                  <th className="p-2">初回本数</th>
                  <th className="p-2">チャネル</th>
                  <th className="p-2">2回目速度</th>
                  <th className="p-2 text-right">顧客数</th>
                  <th className="p-2 text-right">High LTV率</th>
                  <th className="p-2 text-right">平均LTV</th>
                </tr>
              </thead>
              <tbody>
                {data?.map((row, i) => (
                  <tr key={i} className={`border-t border-gray-700 ${getRowBg(row)}`}>
                    <td className="p-2 font-mono">{row.initial_bottles}本</td>
                    <td className="p-2">{row.channel}</td>
                    <td className="p-2">{row.second_order_speed}</td>
                    <td className="p-2 text-right font-mono">{row.customers.toLocaleString()}</td>
                    <td className="p-2 text-right font-mono">
                      <span className={row.high_ltv_pct >= 40 ? 'text-green-400 font-bold' : ''}>
                        {row.high_ltv_pct}%
                      </span>
                    </td>
                    <td className="p-2 text-right font-mono">{fmtYen(row.avg_ltv)}</td>
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
