import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { fetchSourceProductRepeat } from '../lib/queries'
import { useQuery } from '../hooks/useQuery'
import { ChartSkeleton, TableSkeleton } from './Skeleton'
import { ErrorMessage } from './ErrorMessage'

type SortKey = 'avg_ltv' | 'repeat_rate' | 'customers'

const COLORS = ['#3b82f6', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export function SourceProductRepeat() {
  const [sortKey, setSortKey] = useState<SortKey>('avg_ltv')
  const { data, loading, error } = useQuery(fetchSourceProductRepeat)

  const sorted = useMemo(() => {
    if (!data) return []
    return [...data].sort((a, b) => b[sortKey] - a[sortKey])
  }, [data, sortKey])

  const chartData = useMemo(() => {
    return sorted.map(r => ({
      name: `${r.source_detail} ${r.initial_bottles}本`,
      avg_ltv: r.avg_ltv,
      repeat_rate: r.repeat_rate,
      customers: r.customers,
    }))
  }, [sorted])

  const fmtYen = (n: number) => `¥${n.toLocaleString()}`

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold">流入元 x 商品リピート</h2>
        <div className="flex gap-2">
          {([
            ['avg_ltv', 'LTV順'],
            ['repeat_rate', 'リピ率順'],
            ['customers', '顧客数順'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSortKey(key)}
              className={`rounded px-3 py-1 text-sm font-medium transition ${
                sortKey === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

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
              <BarChart data={chartData} layout="vertical" margin={{ left: 120 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={v => `¥${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} width={120} />
                <Tooltip
                  formatter={(value) => fmtYen(Number(value))}
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Bar dataKey="avg_ltv" name="平均LTV" radius={[0, 4, 4, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400">
                  <th className="p-2">流入元</th>
                  <th className="p-2">商品</th>
                  <th className="p-2 text-right">本数</th>
                  <th className="p-2 text-right">顧客数</th>
                  <th className="p-2 text-right">リピート率</th>
                  <th className="p-2 text-right">平均LTV</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((row, i) => (
                  <tr key={i} className="border-t border-gray-700">
                    <td className="p-2">{row.source_detail}</td>
                    <td className="p-2">{row.product_name}</td>
                    <td className="p-2 text-right font-mono">{row.initial_bottles}</td>
                    <td className="p-2 text-right font-mono">{row.customers}</td>
                    <td className="p-2 text-right font-mono">{row.repeat_rate?.toFixed(1)}%</td>
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
