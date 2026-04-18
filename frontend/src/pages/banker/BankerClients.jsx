import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Search,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Building2,
} from 'lucide-react'
import { getBankerPortfolio } from '../../api'

function fmt(n) {
  if (n == null) return '--'
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  return `$${(n / 1_000).toFixed(0)}K`
}
function revBracket(n) {
  if (n == null) return '--'
  if (n >= 1_000_000) return '$1M+'
  if (n >= 500_000) return '$500K to $1M'
  if (n >= 100_000) return '$100K to $500K'
  if (n >= 50_000) return '$50K to $100K'
  return '< $50K'
}

function StabilityBar({ value }) {
  const pct = (value * 100).toFixed(0)
  const color =
    value >= 0.7 ? 'bg-green-500' : value >= 0.5 ? 'bg-amber-500' : 'bg-red-500'
  const textColor =
    value >= 0.7 ? 'text-green-600' : value >= 0.5 ? 'text-amber-600' : 'text-red-600'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-pnc-gray-100 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-semibold tabular-nums w-8 text-right ${textColor}`}>
        {pct}%
      </span>
    </div>
  )
}

function HealthIcon({ value }) {
  if (value >= 0.7) return <TrendingUp size={16} className="text-green-500 shrink-0" />
  if (value >= 0.5) return <Minus size={16} className="text-amber-500 shrink-0" />
  return <TrendingDown size={16} className="text-red-500 shrink-0" />
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'healthy', label: 'Healthy' },
  { key: 'watch', label: 'Watch' },
  { key: 'risk', label: 'At Risk' },
]

export default function BankerClients() {
  const navigate = useNavigate()
  const location = useLocation()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState(location.state?.filter || 'all')

  useEffect(() => {
    getBankerPortfolio()
      .then(data => setClients(data?.smbs ?? []))
      .catch(() => setClients([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = clients
    .filter(c => {
      if (search) {
        const q = search.toLowerCase()
        return c.name.toLowerCase().includes(q) || c.business_type.toLowerCase().includes(q)
      }
      return true
    })
    .filter(c => {
      if (filter === 'healthy') return c.cash_stability >= 0.7
      if (filter === 'watch') return c.cash_stability >= 0.5 && c.cash_stability < 0.7
      if (filter === 'risk') return c.cash_stability < 0.5
      return true
    })
    .sort((a, b) => a.cash_stability - b.cash_stability)

  return (
    <div className="px-4 py-4" data-walkthrough="banker-clients">
      {/* Search */}
      <div className="flex items-center gap-2 bg-pnc-gray-100 rounded-xl px-3 py-2.5 mb-4">
        <Search size={16} className="text-pnc-gray-400 shrink-0" />
        <input
          type="text"
          placeholder="Search clients..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm text-pnc-gray-900 placeholder-pnc-gray-400 outline-none"
        />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              filter === key
                ? 'bg-pnc-navy text-white'
                : 'bg-pnc-gray-100 text-pnc-gray-700 active:bg-pnc-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-pnc-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Building2 size={36} className="text-pnc-gray-200 mx-auto mb-3" />
          <p className="text-pnc-gray-500 text-sm">No clients found</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-3">
          {filtered.map((client) => (
            <button
              key={client.id}
              onClick={() => navigate(`/banker/clients/${client.id}`)}
              className="w-full bg-white border border-pnc-gray-200 rounded-2xl p-4 text-left active:bg-pnc-gray-50 transition-colors"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-pnc-navy/5 flex items-center justify-center shrink-0">
                  <Building2 size={18} className="text-pnc-navy" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-pnc-gray-900 text-sm font-semibold truncate">{client.name}</p>
                  <p className="text-pnc-gray-500 text-xs mt-0.5">{client.business_type}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <HealthIcon value={client.cash_stability} />
                  <span className="text-pnc-gray-500 text-xs">{revBracket(client.annual_revenue)}</span>
                </div>
                <ChevronRight size={14} className="text-pnc-gray-400 shrink-0 mt-1" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-pnc-gray-500 text-[10px] uppercase tracking-wide">
                    Cash Stability
                  </span>
                </div>
                <StabilityBar value={client.cash_stability} />
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-pnc-gray-100">
                <div>
                  <p className="text-pnc-gray-400 text-[10px] uppercase tracking-wide">Monthly Tier</p>
                  <p className="text-pnc-gray-900 text-sm font-semibold">{revBracket(client.avg_monthly_revenue)}</p>
                </div>
                <div>
                  <p className="text-pnc-gray-400 text-[10px] uppercase tracking-wide">Payment History</p>
                  <p className="text-pnc-gray-900 text-sm font-semibold">
                    {(client.payment_history * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
