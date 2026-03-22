import { useState, useMemo } from 'react'
import { fetchRetentionCohort, type RetentionRow } from '../lib/queries'
import { useQuery } from '../hooks/useQuery'
import { KpiCard } from './KpiCard'
import { TableSkeleton } from './Skeleton'
import { ErrorMessage } from './ErrorMessage'

function getCellColor(pct: number): string {
  if (pct >= 75) return 'bg-green-600 text-white'
  if (pct >= 50) return 'bg-yellow-500 text-black'
  return 'bg-red-600 text-white'
}

export function RetentionHeatmap() {
  const [initialBottles, setInitialBottles] = useState<number>(3)
  const { data, loading, error } = useQuery<RetentionRow[]>(
    () => fetchRetentionCohort(initialBottles),
    [initialBottles]
  )

  const { cohortMonths, timesList, heatmapData, kpis } = useMemo(() => {
    if (!data || data.length === 0) {
      return { cohortMonths: [], timesList: [], heatmapData: new Map(), kpis: [] }
    }

    const cohorts = [...new Set(data.map(r => r.cohort_month))].sort()
    const times = [...new Set(data.map(r => r.times))].sort((a, b) => a - b)
    const map = new Map<string, number>()
    for (const r of data) {
      map.set(`${r.cohort_month}-${r.times}`, r.retention_pct)
    }

    // KPIs: last 3 cohort months, 2nd time retention
    const recentCohorts = cohorts.slice(-3)
    const kpiCards = recentCohorts.map(c => {
      const pct = map.get(`${c}-2`) ?? 0
      return {
        title: `${c} 2回目継続率`,
        value: `${pct.toFixed(1)}%`,
        color: (pct >= 75 ? 'green' : pct >= 50 ? 'yellow' : 'red') as 'green' | 'yellow' | 'red',
      }
    })

    return { cohortMonths: cohorts, timesList: times, heatmapData: map, kpis: kpiCards }
  }, [data])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold">継続率ヒートマップ</h2>
        <div className="flex gap-2">
          {[1, 3].map(n => (
            <button
              key={n}
              onClick={() => setInitialBottles(n)}
              className={`rounded px-3 py-1 text-sm font-medium transition ${
                initialBottles === n
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {n}本
            </button>
          ))}
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {loading ? (
        <TableSkeleton rows={8} cols={10} />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            {kpis.map(k => (
              <KpiCard key={k.title} title={k.title} value={k.value} color={k.color} />
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left p-2 text-gray-400">Cohort</th>
                  {timesList.map(t => (
                    <th key={t} className="p-2 text-gray-400 text-center">{t}回目</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cohortMonths.map(month => (
                  <tr key={month} className="border-t border-gray-700">
                    <td className="p-2 text-gray-300 whitespace-nowrap">{month}</td>
                    {timesList.map(t => {
                      const pct = heatmapData.get(`${month}-${t}`)
                      return (
                        <td key={t} className="p-1 text-center">
                          {pct !== undefined ? (
                            <span className={`inline-block rounded px-2 py-1 text-xs font-mono ${getCellColor(pct)}`}>
                              {pct.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-gray-600">-</span>
                          )}
                        </td>
                      )
                    })}
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
