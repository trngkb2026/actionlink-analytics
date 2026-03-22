import { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts'
import { fetchLtvMonthly } from '../lib/queries'
import { useQuery } from '../hooks/useQuery'
import { ChartSkeleton } from './Skeleton'
import { ErrorMessage } from './ErrorMessage'

const COLORS = ['#3b82f6', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6']
const TARGET_LTV = 28000

export function LtvTrend() {
  const [showRecent, setShowRecent] = useState(true)
  const { data, loading, error } = useQuery(fetchLtvMonthly)

  const { chartData, cohortKeys } = useMemo(() => {
    if (!data || data.length === 0) return { chartData: [], cohortKeys: [] }

    const cohorts = [...new Set(data.map(r => r.cohort_month))].sort()
    const selected = showRecent ? cohorts.slice(-6) : cohorts
    const offsets = [...new Set(data.map(r => r.month_offset))].sort((a, b) => a - b)

    const rows = offsets.map(offset => {
      const row: Record<string, number | string> = { month_offset: offset }
      for (const cohort of selected) {
        const match = data.find(r => r.cohort_month === cohort && r.month_offset === offset)
        if (match) {
          row[cohort] = match.cumulative_ltv
        }
      }
      return row
    })

    return { chartData: rows, cohortKeys: selected }
  }, [data, showRecent])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold">LTV推移</h2>
        <button
          onClick={() => setShowRecent(!showRecent)}
          className={`rounded px-3 py-1 text-sm font-medium transition ${
            showRecent
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          {showRecent ? '直近6コホート' : '全コホート'}
        </button>
      </div>

      {error && <ErrorMessage message={error} />}

      {loading ? (
        <ChartSkeleton />
      ) : (
        <div className="h-96 rounded-lg bg-gray-800 p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="month_offset"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                label={{ value: '経過月数', position: 'insideBottom', offset: -5, fill: '#9ca3af' }}
              />
              <YAxis
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                tickFormatter={v => `¥${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value) => `¥${Number(value).toLocaleString()}`}
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
                labelStyle={{ color: '#9ca3af' }}
                labelFormatter={v => `${v}ヶ月目`}
              />
              <Legend />
              <ReferenceLine
                y={TARGET_LTV}
                stroke="#ef4444"
                strokeDasharray="8 4"
                strokeWidth={2}
                label={{ value: `目標 ¥${TARGET_LTV.toLocaleString()}`, fill: '#ef4444', position: 'right', fontSize: 12 }}
              />
              {cohortKeys.map((cohort, i) => (
                <Line
                  key={cohort}
                  type="monotone"
                  dataKey={cohort}
                  name={cohort}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
