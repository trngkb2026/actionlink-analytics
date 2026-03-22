import { supabase, isConfigured } from './supabase'

// ============================================================
// Types
// ============================================================

export interface RetentionRow {
  cohort_month: string
  initial_bottles: number
  times: number
  retention_pct: number
  customers: number
}

export interface RfmSegmentRow {
  segment: string
  customers: number
  avg_recency: number
  avg_freq: number
  avg_monetary: number
}

export interface SourceProductRepeatRow {
  source_detail: string
  product_name: string
  initial_bottles: number
  customers: number
  repeat_rate: number
  avg_ltv: number
}

export interface LtvMonthlyRow {
  cohort_month: string
  month_offset: number
  cumulative_ltv: number
  customers: number
}

export interface GoldenPathRow {
  initial_bottles: number
  channel: string
  second_order_speed: string
  customers: number
  high_ltv_pct: number
  avg_ltv: number
}

// ============================================================
// Fetch functions
// ============================================================

export async function fetchRetentionCohort(initialBottles?: number): Promise<RetentionRow[]> {
  if (!isConfigured) return []
  let query = supabase
    .from('v_retention_cohort')
    .select('cohort_month, initial_bottles, times, retention_pct, customers')
  if (initialBottles !== undefined) {
    query = query.eq('initial_bottles', initialBottles)
  }
  const { data, error } = await query.order('cohort_month').order('times')
  if (error) throw error
  return (data ?? []) as RetentionRow[]
}

export async function fetchRfmSegments(): Promise<RfmSegmentRow[]> {
  if (!isConfigured) return []
  // Supabase JS doesn't support GROUP BY, so we fetch raw and aggregate client-side
  const { data, error } = await supabase
    .from('v_rfm_segments')
    .select('segment, recency_days, frequency, monetary')
  if (error) throw error

  // Client-side aggregation
  const groups = new Map<string, { count: number; recency: number; freq: number; monetary: number }>()
  for (const row of (data ?? []) as Array<{ segment: string; recency_days: number; frequency: number; monetary: number }>) {
    const g = groups.get(row.segment) ?? { count: 0, recency: 0, freq: 0, monetary: 0 }
    g.count++
    g.recency += row.recency_days
    g.freq += row.frequency
    g.monetary += row.monetary
    groups.set(row.segment, g)
  }

  const result: RfmSegmentRow[] = []
  for (const [segment, g] of groups) {
    result.push({
      segment,
      customers: g.count,
      avg_recency: Math.round(g.recency / g.count),
      avg_freq: Math.round((g.freq / g.count) * 10) / 10,
      avg_monetary: Math.round(g.monetary / g.count),
    })
  }
  return result.sort((a, b) => b.avg_monetary - a.avg_monetary)
}

export async function fetchSourceProductRepeat(minCustomers = 20): Promise<SourceProductRepeatRow[]> {
  if (!isConfigured) return []
  const { data, error } = await supabase
    .from('v_source_product_repeat')
    .select('*')
    .gte('customers', minCustomers)
    .order('avg_ltv', { ascending: false })
  if (error) throw error
  return (data ?? []) as SourceProductRepeatRow[]
}

export async function fetchLtvMonthly(): Promise<LtvMonthlyRow[]> {
  if (!isConfigured) return []
  const { data, error } = await supabase
    .from('v_ltv_monthly')
    .select('cohort_month, month_offset, cumulative_ltv, customers')
    .order('cohort_month')
    .order('month_offset')
  if (error) throw error
  return (data ?? []) as LtvMonthlyRow[]
}

export async function fetchGoldenPath(): Promise<GoldenPathRow[]> {
  if (!isConfigured) return []
  // Fetch raw data and aggregate client-side (Supabase JS doesn't support GROUP BY + HAVING)
  const { data, error } = await supabase
    .from('v_golden_path')
    .select('initial_bottles, channel, second_order_speed, ltv_tier, total_ltv')
    .not('source_detail', 'is', null)
  if (error) throw error

  type RawRow = { initial_bottles: number; channel: string; second_order_speed: string; ltv_tier: string; total_ltv: number }
  const rows = (data ?? []) as RawRow[]

  const groups = new Map<string, { ib: number; ch: string; speed: string; count: number; highCount: number; ltvSum: number }>()
  for (const r of rows) {
    const key = `${r.initial_bottles}|${r.channel}|${r.second_order_speed}`
    const g = groups.get(key) ?? { ib: r.initial_bottles, ch: r.channel, speed: r.second_order_speed, count: 0, highCount: 0, ltvSum: 0 }
    g.count++
    if (r.ltv_tier === 'High') g.highCount++
    g.ltvSum += r.total_ltv
    groups.set(key, g)
  }

  const result: GoldenPathRow[] = []
  for (const g of groups.values()) {
    if (g.count < 10) continue
    result.push({
      initial_bottles: g.ib,
      channel: g.ch,
      second_order_speed: g.speed,
      customers: g.count,
      high_ltv_pct: Math.round((g.highCount / g.count) * 1000) / 10,
      avg_ltv: Math.round(g.ltvSum / g.count),
    })
  }
  return result.sort((a, b) => b.high_ltv_pct - a.high_ltv_pct)
}
