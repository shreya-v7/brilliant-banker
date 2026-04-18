import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  CreditCard,
  ChevronRight,
  Flame,
  Clock,
  CheckCircle2,
  CircleDot,
  Building2,
  DollarSign,
  BarChart3,
  Users,
  ArrowUpRight,
  Minus,
  PhoneCall,
  Sparkles,
  Activity,
} from 'lucide-react'
import { getLeads, getBankerPortfolio } from '../../api'

/* ─── Formatters ─── */
function fmt(n, short = false) {
  if (n == null) return '--'
  if (short) {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
    return `$${n}`
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}
function revBracket(n) {
  if (n == null) return '--'
  if (n >= 1_000_000) return '$1M+'
  if (n >= 500_000) return '$500K–$1M'
  if (n >= 100_000) return '$100K–$500K'
  if (n >= 50_000) return '$50K–$100K'
  return '< $50K'
}
function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
function pct(v) { return `${(v * 100).toFixed(0)}%` }

/* ─── Urgency badge ─── */
function UrgencyBadge({ score }) {
  if (score >= 0.75) return (
    <span className="flex items-center gap-1 text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full shrink-0">
      <Flame size={9} /> High
    </span>
  )
  if (score >= 0.5) return (
    <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full shrink-0">
      <Clock size={9} /> Med
    </span>
  )
  return (
    <span className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full shrink-0">
      <CircleDot size={9} /> Low
    </span>
  )
}

/* ─── Status pill ─── */
function StatusPill({ status }) {
  const map = {
    pending:  'bg-amber-50 text-amber-700',
    approved: 'bg-green-50 text-green-700',
    declined: 'bg-red-50 text-red-700',
    referred: 'bg-blue-50 text-blue-700',
  }
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}

/* ─── Mini donut (SVG) ─── */
function DonutChart({ segments, size = 72 }) {
  const r = (size - 12) / 2
  const cx = size / 2
  const circ = 2 * Math.PI * r
  let offset = 0
  const arcs = segments.map(({ value, color }) => {
    const dash = (value * circ).toFixed(2)
    const gap = (circ - dash).toFixed(2)
    const arc = (
      <circle
        key={color}
        cx={cx} cy={cx} r={r}
        fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={`${dash} ${gap}`}
        strokeDashoffset={-offset}
        transform={`rotate(-90 ${cx} ${cx})`}
        strokeLinecap="butt"
      />
    )
    offset += parseFloat(dash)
    return arc
  })
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#f3f4f6" strokeWidth="10" />
      {arcs}
    </svg>
  )
}

/* ─── Sparkline (SVG) ─── */
function Sparkline({ data, color = '#f97316', height = 32, width = 80 }) {
  if (!data || data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 4) - 2
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ─── Metric card ─── */
function MetricCard({ icon: Icon, label, value, sub, color, trend, sparkData }) {
  return (
    <div className="bg-white border border-pnc-gray-200 rounded-2xl p-4">
      <div className="flex items-start justify-between mb-2">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={15} className="text-white" />
        </div>
        {sparkData && <Sparkline data={sparkData} />}
        {trend != null && !sparkData && (
          <span className={`flex items-center gap-0.5 text-xs font-semibold ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {trend >= 0 ? <ArrowUpRight size={13} /> : <TrendingDown size={13} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-pnc-gray-900 text-xl font-bold leading-tight">{value}</p>
      <p className="text-pnc-gray-500 text-xs mt-0.5">{label}</p>
      {sub && <p className="text-pnc-gray-400 text-[10px] mt-1">{sub}</p>}
    </div>
  )
}

/* ─── Section header ─── */
function SectionHeader({ title, action, onAction }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-pnc-gray-900 text-sm font-bold">{title}</h2>
      {action && (
        <button onClick={onAction} className="text-pnc-orange text-xs font-semibold active:opacity-70">
          {action}
        </button>
      )}
    </div>
  )
}

/* ─── Health bar ─── */
function HealthBar({ value }) {
  const color = value >= 0.7 ? 'bg-green-500' : value >= 0.5 ? 'bg-amber-400' : 'bg-red-500'
  return (
    <div className="flex-1 bg-pnc-gray-100 rounded-full h-1.5">
      <div className={`h-1.5 rounded-full ${color} transition-all`} style={{ width: `${(value * 100).toFixed(0)}%` }} />
    </div>
  )
}

/* ─── Main dashboard ─── */
export default function BankerDashboard({ user }) {
  const navigate = useNavigate()
  const [leads, setLeads] = useState([])
  const [allLeads, setAllLeads] = useState([])
  const [portfolio, setPortfolio] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getLeads('pending').catch(() => []),
      getLeads().catch(() => []),
      getBankerPortfolio().catch(() => null),
    ]).then(([pending, all, port]) => {
      setLeads(pending)
      setAllLeads(all)
      setPortfolio(port)
    }).finally(() => setLoading(false))
  }, [])

  const smbs = portfolio?.smbs ?? []
  const totalRevenue = smbs.reduce((s, c) => s + c.annual_revenue, 0)
  const totalMonthly = smbs.reduce((s, c) => s + c.avg_monthly_revenue, 0)
  const atRisk  = smbs.filter(s => s.cash_stability < 0.5)
  const watch   = smbs.filter(s => s.cash_stability >= 0.5 && s.cash_stability < 0.7)
  const healthy = smbs.filter(s => s.cash_stability >= 0.7)

  const approved = allLeads.filter(l => l.status === 'approved')
  const declined = allLeads.filter(l => l.status === 'declined')
  const referred = allLeads.filter(l => l.status === 'referred')
  const totalRequested = allLeads.reduce((s, l) => s + (l.requested_amount || 0), 0)
  const approvedAmount = approved.reduce((s, l) => s + (l.requested_amount || 0), 0)

  // Donut: portfolio health breakdown
  const donutTotal = smbs.length || 1
  const donutSegments = [
    { value: healthy.length / donutTotal, color: '#22c55e' },
    { value: watch.length / donutTotal,   color: '#f59e0b' },
    { value: atRisk.length / donutTotal,  color: '#ef4444' },
  ].filter(s => s.value > 0)

  // Fake monthly revenue trend for sparklines (derived from smb data)
  const revTrend = [82, 88, 79, 91, 85, 94, 90, totalMonthly / 10000].map(Math.round)

  // Sort pending leads by urgency desc
  const sortedPending = [...leads].sort((a, b) => b.urgency_score - a.urgency_score)

  // Top clients by revenue
  const topClients = [...smbs].sort((a, b) => b.annual_revenue - a.annual_revenue).slice(0, 4)

  return (
    <div className="pb-6">

      {/* ── Key metrics ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-pnc-navy rounded-xl p-4">
          <p className="text-white/50 text-[10px] uppercase tracking-wider mb-1">Clients</p>
          <p className="text-white text-3xl font-bold">{loading ? '--' : smbs.length}</p>
        </div>
        <div className="bg-pnc-navy rounded-xl p-4">
          <p className="text-white/50 text-[10px] uppercase tracking-wider mb-1">Pending Leads</p>
          <p className={`text-3xl font-bold ${leads.length > 0 ? 'text-pnc-orange' : 'text-white'}`}>
            {loading ? '--' : leads.length}
          </p>
        </div>
        <div className="bg-pnc-navy rounded-xl p-4">
          <p className="text-white/50 text-[10px] uppercase tracking-wider mb-1">At Risk</p>
          <p className={`text-3xl font-bold ${atRisk.length > 0 ? 'text-red-400' : 'text-white'}`}>
            {loading ? '--' : atRisk.length}
          </p>
        </div>
        <div className="bg-pnc-navy rounded-xl p-4">
          <p className="text-white/50 text-[10px] uppercase tracking-wider mb-1">Pipeline Value</p>
          <p className="text-white text-3xl font-bold">
            {loading ? '--' : fmt(leads.reduce((s, l) => s + (l.requested_amount || 0), 0), true)}
          </p>
        </div>
      </div>

      <div className="space-y-5">

        {/* ── Key Metrics ── */}
        <div>
          <SectionHeader title="Portfolio Overview" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard
              icon={DollarSign}
              label="Portfolio Revenue Tier"
              value={revBracket(totalRevenue)}
              sub={`${smbs.length} active clients`}
              color="bg-green-500"
              sparkData={revTrend}
            />
            <MetricCard
              icon={BarChart3}
              label="Avg Monthly Tier"
              value={revBracket(totalMonthly)}
              sub="across all clients"
              color="bg-blue-500"
              trend={8}
            />
            <MetricCard
              icon={CreditCard}
              label="Credit Requested"
              value={fmt(totalRequested, true)}
              sub={`${allLeads.length} total requests`}
              color="bg-pnc-orange"
              trend={null}
            />
            <MetricCard
              icon={CheckCircle2}
              label="Approved Credit"
              value={fmt(approvedAmount, true)}
              sub={`${approved.length} of ${allLeads.length} approved`}
              color="bg-purple-500"
              trend={null}
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
        {/* ── Left column ── */}
        <div className="space-y-5">

        {/* ── Credit Pipeline ── */}
        <div>
          <SectionHeader title="Credit Pipeline" action="Review All" onAction={() => navigate('/banker/credit')} />
          <div className="bg-white border border-pnc-gray-200 rounded-2xl overflow-hidden">
            {/* Pipeline bar */}
            <div className="px-4 pt-4 pb-3">
              <div className="flex rounded-full overflow-hidden h-2.5 mb-3">
                {leads.length > 0 && (
                  <div className="bg-amber-400 h-full" style={{ width: `${(leads.length / allLeads.length) * 100}%` }} />
                )}
                {approved.length > 0 && (
                  <div className="bg-green-500 h-full" style={{ width: `${(approved.length / allLeads.length) * 100}%` }} />
                )}
                {referred.length > 0 && (
                  <div className="bg-blue-400 h-full" style={{ width: `${(referred.length / allLeads.length) * 100}%` }} />
                )}
                {declined.length > 0 && (
                  <div className="bg-red-400 h-full" style={{ width: `${(declined.length / allLeads.length) * 100}%` }} />
                )}
              </div>
              <div className="grid grid-cols-4 gap-1 text-center">
                {[
                  { label: 'Pending', count: leads.length, color: 'text-amber-600' },
                  { label: 'Approved', count: approved.length, color: 'text-green-600' },
                  { label: 'Referred', count: referred.length, color: 'text-blue-600' },
                  { label: 'Declined', count: declined.length, color: 'text-red-500' },
                ].map(({ label, count, color }) => (
                  <div key={label}>
                    <p className={`text-base font-bold ${color}`}>{loading ? '-' : count}</p>
                    <p className="text-pnc-gray-400 text-[9px]">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent decisions */}
            {allLeads.length > 0 && (
              <div className="border-t border-pnc-gray-100 divide-y divide-pnc-gray-100">
                {allLeads.slice(0, 3).map(lead => (
                  <button
                    key={lead.id}
                    onClick={() => navigate('/banker/credit')}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-pnc-gray-50"
                  >
                    <div className="w-8 h-8 rounded-full bg-pnc-navy/5 flex items-center justify-center shrink-0">
                      <Building2 size={14} className="text-pnc-navy" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-pnc-gray-900 text-xs font-semibold truncate">{lead.smb_name}</p>
                      <p className="text-pnc-gray-500 text-[10px]">{fmt(lead.requested_amount, true)} · {fmtDate(lead.created_at)}</p>
                    </div>
                    <StatusPill status={lead.status} />
                    <ChevronRight size={12} className="text-pnc-gray-300 shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Priority Queue ── */}
        <div data-walkthrough="banker-queue">
          <SectionHeader title="Priority Queue" action={leads.length > 0 ? 'Act Now →' : undefined} onAction={() => navigate('/banker/credit')} />
          {loading ? (
            <div className="space-y-2">
              {[1, 2].map(i => <div key={i} className="h-16 bg-pnc-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : sortedPending.length === 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle2 size={20} className="text-green-600 shrink-0" />
              <div>
                <p className="text-green-800 text-sm font-semibold">All caught up!</p>
                <p className="text-green-700 text-xs mt-0.5">No pending credit decisions</p>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-pnc-gray-200 rounded-2xl divide-y divide-pnc-gray-100 overflow-hidden">
              {sortedPending.map((lead, idx) => (
                <button
                  key={lead.id}
                  onClick={() => navigate('/banker/credit')}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-pnc-gray-50"
                >
                  {/* Rank */}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold
                    ${idx === 0 ? 'bg-red-100 text-red-600' : idx === 1 ? 'bg-amber-100 text-amber-600' : 'bg-pnc-gray-100 text-pnc-gray-500'}`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-pnc-gray-900 text-sm font-semibold truncate">{lead.smb_name}</p>
                    <p className="text-pnc-gray-500 text-xs truncate">{lead.business_type} · {fmt(lead.requested_amount, true)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <UrgencyBadge score={lead.urgency_score} />
                    <span className="text-pnc-gray-400 text-[9px]">score {(lead.credit_score * 100).toFixed(0)}</span>
                  </div>
                  <ChevronRight size={13} className="text-pnc-gray-300 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        </div>{/* end left column */}

        {/* ── Right column ── */}
        <div className="space-y-5">

        {/* ── Portfolio Health Breakdown ── */}
        <div>
          <SectionHeader title="Portfolio Health" action="All Clients" onAction={() => navigate('/banker/clients')} />
          <div className="bg-white border border-pnc-gray-200 rounded-2xl p-4">
            <div className="flex items-center gap-4 mb-4">
              {/* Donut */}
              <div className="relative shrink-0">
                <DonutChart segments={loading ? [{ value: 1, color: '#e5e7eb' }] : donutSegments} size={80} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-pnc-gray-900 text-xs font-bold">{smbs.length}</span>
                </div>
              </div>
              {/* Legend */}
              <div className="flex-1 space-y-2">
                {[
                  { label: 'Healthy',  count: healthy.length, color: 'bg-green-500',  text: 'text-green-700',  sub: '≥ 70% stability' },
                  { label: 'Watch',    count: watch.length,   color: 'bg-amber-400',  text: 'text-amber-700',  sub: '50–70%' },
                  { label: 'At Risk',  count: atRisk.length,  color: 'bg-red-500',    text: 'text-red-700',    sub: '< 50%' },
                ].map(({ label, count, color, text, sub }) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${color}`} />
                    <span className={`text-xs font-semibold ${text} w-14`}>{label}</span>
                    <span className="text-pnc-gray-900 text-xs font-bold w-4">{loading ? '-' : count}</span>
                    <span className="text-pnc-gray-400 text-[10px]">{sub}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Per-client stability bars */}
            <div className="border-t border-pnc-gray-100 pt-3 space-y-2.5">
              {[...smbs].sort((a, b) => a.cash_stability - b.cash_stability).map(smb => (
                <button
                  key={smb.id}
                  onClick={() => navigate(`/banker/clients/${smb.id}`)}
                  className="w-full flex items-center gap-2 group"
                >
                  <span className="text-pnc-gray-700 text-xs w-24 text-left truncate group-active:text-pnc-orange">
                    {smb.name.split(' ')[0]}
                  </span>
                  <HealthBar value={smb.cash_stability} />
                  <span className={`text-xs font-semibold w-9 text-right tabular-nums ${
                    smb.cash_stability >= 0.7 ? 'text-green-600' : smb.cash_stability >= 0.5 ? 'text-amber-600' : 'text-red-500'
                  }`}>
                    {pct(smb.cash_stability)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Top Clients by Revenue ── */}
        <div>
          <SectionHeader title="Top Clients by Revenue" action="View All" onAction={() => navigate('/banker/clients')} />
          <div className="bg-white border border-pnc-gray-200 rounded-2xl divide-y divide-pnc-gray-100 overflow-hidden">
            {loading ? (
              [1,2,3].map(i => <div key={i} className="h-14 animate-pulse bg-pnc-gray-50" />)
            ) : topClients.map((smb, idx) => (
              <button
                key={smb.id}
                onClick={() => navigate(`/banker/clients/${smb.id}`)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-pnc-gray-50"
              >
                <span className="text-pnc-gray-400 text-xs font-bold w-4">{idx + 1}</span>
                <div className="w-8 h-8 rounded-full bg-pnc-navy/5 flex items-center justify-center shrink-0">
                  <Building2 size={14} className="text-pnc-navy" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-pnc-gray-900 text-xs font-semibold truncate">{smb.name}</p>
                  <p className="text-pnc-gray-500 text-[10px]">{smb.business_type}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-pnc-gray-900 text-xs font-bold">{revBracket(smb.annual_revenue)}</p>
                  <p className="text-pnc-gray-400 text-[10px]">annual</p>
                </div>
                <ChevronRight size={12} className="text-pnc-gray-300 shrink-0" />
              </button>
            ))}
          </div>
        </div>

        </div>{/* end right column */}
        </div>{/* end grid */}

        {/* ── Clients Needing Attention ── */}
        {!loading && atRisk.length > 0 && (
          <div>
            <SectionHeader title="Needs Attention" action="Call List" onAction={() => navigate('/banker/clients')} />
            <div className="space-y-2">
              {[...atRisk].sort((a, b) => a.cash_stability - b.cash_stability).map(smb => (
                <button
                  key={smb.id}
                  onClick={() => navigate(`/banker/clients/${smb.id}`)}
                  className="w-full bg-white border border-red-100 rounded-2xl p-3.5 flex items-center gap-3 text-left active:bg-red-50"
                >
                  <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                    <AlertTriangle size={16} className="text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-pnc-gray-900 text-sm font-semibold truncate">{smb.name}</p>
                    <p className="text-pnc-gray-500 text-xs">{smb.business_type} · {revBracket(smb.annual_revenue)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-red-600 text-sm font-bold">{pct(smb.cash_stability)}</span>
                    <span className="text-red-400 text-[10px]">stability</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-pnc-navy flex items-center justify-center shrink-0">
                    <PhoneCall size={13} className="text-white" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Payment Health ── */}
        <div>
          <SectionHeader title="Payment History" />
          <div className="bg-white border border-pnc-gray-200 rounded-2xl overflow-hidden">
            <div className="px-4 pt-3 pb-2 border-b border-pnc-gray-100">
              <p className="text-pnc-gray-500 text-xs">Average across portfolio</p>
              <div className="flex items-end gap-2 mt-1">
                <p className="text-pnc-gray-900 text-2xl font-bold">
                  {smbs.length > 0 ? pct(smbs.reduce((s,c) => s + c.payment_history, 0) / smbs.length) : '--'}
                </p>
                <span className="flex items-center gap-0.5 text-green-600 text-xs font-semibold mb-1">
                  <TrendingUp size={13} /> on track
                </span>
              </div>
            </div>
            <div className="divide-y divide-pnc-gray-100">
              {[...smbs].sort((a, b) => b.payment_history - a.payment_history).map(smb => (
                <div key={smb.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="text-pnc-gray-700 text-xs w-24 truncate">{smb.name.split(' ')[0]}</span>
                  <div className="flex-1 bg-pnc-gray-100 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${smb.payment_history >= 0.85 ? 'bg-green-500' : smb.payment_history >= 0.7 ? 'bg-amber-400' : 'bg-red-500'}`}
                      style={{ width: pct(smb.payment_history) }}
                    />
                  </div>
                  <span className="text-pnc-gray-900 text-xs font-semibold w-9 text-right tabular-nums">{pct(smb.payment_history)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Quick Actions ── */}
        <div>
          <SectionHeader title="Quick Actions" />
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/banker/credit')}
              className="flex flex-col items-center gap-2 bg-pnc-navy rounded-2xl p-4 active:opacity-80"
            >
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <CreditCard size={18} className="text-pnc-orange" />
              </div>
              <div className="text-center">
                <p className="text-white text-xs font-bold">Credit Review</p>
                <p className="text-white/50 text-[10px]">{leads.length} awaiting</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/banker/clients')}
              className="flex flex-col items-center gap-2 bg-white border border-pnc-gray-200 rounded-2xl p-4 active:bg-pnc-gray-50"
            >
              <div className="w-10 h-10 rounded-full bg-pnc-navy/5 flex items-center justify-center">
                <Users size={18} className="text-pnc-navy" />
              </div>
              <div className="text-center">
                <p className="text-pnc-gray-900 text-xs font-bold">My Clients</p>
                <p className="text-pnc-gray-500 text-[10px]">{smbs.length} in portfolio</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/banker/clients', { state: { filter: 'risk' } })}
              className="flex flex-col items-center gap-2 bg-white border border-red-100 rounded-2xl p-4 active:bg-red-50 col-span-1"
            >
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <PhoneCall size={18} className="text-red-500" />
              </div>
              <div className="text-center">
                <p className="text-pnc-gray-900 text-xs font-bold">Call List</p>
                <p className="text-pnc-gray-500 text-[10px]">{atRisk.length} at risk clients</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/banker/clients')}
              className="flex flex-col items-center gap-2 bg-white border border-pnc-gray-200 rounded-2xl p-4 active:bg-pnc-gray-50"
            >
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                <Sparkles size={18} className="text-purple-600" />
              </div>
              <div className="text-center">
                <p className="text-pnc-gray-900 text-xs font-bold">AI Insights</p>
                <p className="text-pnc-gray-500 text-[10px]">Pre-call briefs</p>
              </div>
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
