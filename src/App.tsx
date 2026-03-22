import { useState } from 'react'
import { RetentionHeatmap } from './components/RetentionHeatmap'
import { RfmSegments } from './components/RfmSegments'
import { SourceProductRepeat } from './components/SourceProductRepeat'
import { LtvTrend } from './components/LtvTrend'
import { GoldenPath } from './components/GoldenPath'
import { isConfigured } from './lib/supabase'

const tabs = [
  { id: 'retention', label: '継続率', component: RetentionHeatmap },
  { id: 'rfm', label: 'RFMセグメント', component: RfmSegments },
  { id: 'source', label: '流入元×商品', component: SourceProductRepeat },
  { id: 'ltv', label: 'LTV推移', component: LtvTrend },
  { id: 'golden', label: 'ゴールデンパス', component: GoldenPath },
] as const

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('retention')
  const ActiveComponent = tabs.find(t => t.id === activeTab)?.component ?? RetentionHeatmap

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-800/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight">ActionLink Analytics</h1>
            <p className="text-xs text-gray-400">ecforce Data Dashboard</p>
          </div>
          <div className="text-right text-xs text-gray-500">
            {isConfigured ? (
              <span className="text-green-400">Connected</span>
            ) : (
              <span className="text-yellow-400">Not configured - showing skeleton UI</span>
            )}
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="border-b border-gray-700 bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition border-b-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <ActiveComponent />
      </main>
    </div>
  )
}
