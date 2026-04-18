import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Phone,
  Sparkles,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  Send,
  ChevronRight,
  ArrowDownLeft,
  Receipt,
  Wrench,
} from 'lucide-react'
import {
  getBankerSMBBrief,
  getLeads,
  getTransactions,
  getBankerNotes,
  addBankerNote,
} from '../../api'

function fmt(n) {
  if (n == null) return '--'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}
function revBracket(n) {
  if (n == null) return '--'
  if (n >= 1_000_000) return '$1M+'
  if (n >= 500_000) return '$500K to $1M'
  if (n >= 100_000) return '$100K to $500K'
  if (n >= 50_000) return '$50K to $100K'
  return '< $50K'
}
function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white border border-pnc-gray-200 rounded-xl p-3.5">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon size={14} className={color} />
        <span className="text-pnc-gray-500 text-[11px] font-medium">{label}</span>
      </div>
      <p className="text-pnc-gray-900 text-base font-bold">{value}</p>
    </div>
  )
}

function StabilityRing({ value }) {
  const pct = (value * 100).toFixed(0)
  const color = value >= 0.7 ? '#22c55e' : value >= 0.5 ? '#f59e0b' : '#ef4444'
  const radius = 30
  const circumference = 2 * Math.PI * radius
  const dash = (value * circumference).toFixed(1)
  return (
    <div className="flex flex-col items-center">
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="8" />
        <circle cx="40" cy="40" r={radius} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circumference}`} strokeLinecap="round"
          transform="rotate(-90 40 40)" />
        <text x="40" y="44" textAnchor="middle" fontSize="16" fontWeight="700" fill="#111827">{pct}%</text>
      </svg>
      <span className="text-pnc-gray-500 text-[10px] mt-1">Cash Stability</span>
    </div>
  )
}

const TXNCATEGORY = {
  revenue:     { icon: ArrowDownLeft, color: 'text-green-600 bg-green-50' },
  payroll:     { icon: Send,          color: 'text-blue-600 bg-blue-50'   },
  supplies:    { icon: Receipt,       color: 'text-purple-600 bg-purple-50' },
  maintenance: { icon: Wrench,        color: 'text-amber-600 bg-amber-50' },
  other:       { icon: CreditCard,    color: 'text-gray-500 bg-gray-50'   },
}

const TABS = ['Overview', 'Transactions', 'Credit History', 'Notes']

export default function BankerSMBProfile({ user }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [leads, setLeads] = useState([])
  const [transactions, setTransactions] = useState([])
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [brief, setBrief] = useState(null)
  const [loadingBrief, setLoadingBrief] = useState(false)
  const [tab, setTab] = useState('Overview')
  const [noteInput, setNoteInput] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  useEffect(() => {
    Promise.all([
      getBankerSMBBrief(id),
      getLeads().catch(() => []),
      getTransactions(id).catch(() => []),
      getBankerNotes(id).catch(() => []),
    ]).then(([profileData, allLeads, txns, noteData]) => {
      setProfile(profileData)
      if (profileData?.ai_brief) setBrief(profileData.ai_brief)
      setLeads(allLeads.filter(l => String(l.smb_id) === String(id)))
      setTransactions(txns)
      setNotes(noteData)
    }).catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const fetchBrief = async () => {
    setLoadingBrief(true)
    try {
      const data = await getBankerSMBBrief(id)
      setBrief(data.ai_brief)
    } catch {
      setBrief('Unable to generate brief.')
    }
    setLoadingBrief(false)
  }

  const handleAddNote = async () => {
    if (!noteInput.trim()) return
    setSavingNote(true)
    try {
      const note = await addBankerNote(id, noteInput.trim(), user?.banker_id)
      setNotes(prev => [note, ...prev])
      setNoteInput('')
    } catch {}
    setSavingNote(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-pnc-navy border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="px-4 py-4 text-center">
        <p className="text-pnc-gray-500 text-sm">Client not found</p>
        <button onClick={() => navigate(-1)} className="text-pnc-orange text-xs mt-2">Go back</button>
      </div>
    )
  }

  const net30 = transactions.reduce((s, t) => s + t.amount, 0)
  const income30 = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const expense30 = Math.abs(transactions.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0))

  return (
    <div className="pb-8">
      {/* Custom nav header */}
      <div className="bg-pnc-navy px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-white/80 active:text-white">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <p className="text-white text-sm font-semibold">{profile.name}</p>
          <p className="text-white/60 text-xs">{profile.business_type}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
          <Building2 size={18} className="text-white" />
        </div>
      </div>

      {/* Health overview hero */}
      <div className="bg-white border-b border-pnc-gray-200 px-4 py-4 flex items-center gap-4">
        <StabilityRing value={profile.cash_stability} />
        <div className="flex-1">
          <p className="text-pnc-gray-900 text-xl font-bold">{revBracket(profile.annual_revenue)}</p>
          <p className="text-pnc-gray-500 text-xs">Revenue bracket</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {profile.cash_stability >= 0.5 ? (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                <CheckCircle2 size={10} /> Stable
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
                <AlertTriangle size={10} /> At Risk
              </span>
            )}
            {leads.filter(l => l.status === 'pending').length > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                <CreditCard size={10} /> Pending decision
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-pnc-gray-200 bg-white sticky top-0 z-10">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-xs font-semibold transition-colors ${
              tab === t
                ? 'text-pnc-navy border-b-2 border-pnc-navy'
                : 'text-pnc-gray-500'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="px-4 py-4">

        {/* ── Overview ── */}
        {tab === 'Overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={DollarSign} label="Revenue Bracket" value={revBracket(profile.annual_revenue)} color="text-green-600" />
              <StatCard icon={DollarSign} label="Monthly Tier" value={revBracket(profile.avg_monthly_revenue)} color="text-blue-600" />
              <StatCard icon={TrendingUp} label="Cash Stability" value={`${(profile.cash_stability * 100).toFixed(0)}%`} color="text-amber-600" />
              <StatCard icon={ShieldCheck} label="Payment History" value={`${(profile.payment_history * 100).toFixed(0)}%`} color="text-purple-600" />
            </div>

            {profile.phone && (
              <div className="bg-white border border-pnc-gray-200 rounded-xl p-4 flex items-center gap-3">
                <Phone size={18} className="text-pnc-gray-500" />
                <div>
                  <p className="text-pnc-gray-500 text-xs">Phone on file</p>
                  <p className="text-pnc-gray-900 text-sm font-medium">{profile.phone}</p>
                </div>
              </div>
            )}

            {/* AI Brief */}
            <div className="bg-white border border-pnc-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-pnc-orange" />
                  <h3 className="text-pnc-gray-900 text-sm font-semibold">AI Pre-call Brief</h3>
                </div>
                {!brief && !loadingBrief && (
                  <button onClick={fetchBrief} className="text-pnc-orange text-xs font-semibold active:opacity-70">
                    Generate
                  </button>
                )}
              </div>
              {loadingBrief ? (
                <div className="flex items-center gap-2 py-4 justify-center">
                  <div className="w-4 h-4 border-2 border-pnc-orange border-t-transparent rounded-full animate-spin" />
                  <span className="text-pnc-gray-500 text-xs">Analyzing...</span>
                </div>
              ) : brief ? (
                <p className="text-pnc-gray-700 text-sm leading-relaxed whitespace-pre-line">{brief}</p>
              ) : (
                <p className="text-pnc-gray-500 text-xs">Generate a 30-second pre-call summary.</p>
              )}
            </div>

            {/* Quick action */}
            <button
              onClick={() => navigate('/banker/credit')}
              className="w-full flex items-center justify-center gap-2 bg-pnc-navy text-white text-xs font-semibold
                         py-3 rounded-xl active:opacity-90 transition-opacity"
            >
              <CreditCard size={15} /> Go to Credit Review
            </button>
          </div>
        )}

        {/* ── Transactions ── */}
        {tab === 'Transactions' && (
          <div className="space-y-3">
            {/* 30-day summary */}
            <div className="bg-white border border-pnc-gray-200 rounded-xl p-4">
              <p className="text-pnc-gray-900 text-xs font-semibold mb-3">30-Day Summary</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-green-600 text-sm font-bold">{fmt(income30)}</p>
                  <p className="text-pnc-gray-400 text-[10px]">In</p>
                </div>
                <div>
                  <p className="text-red-500 text-sm font-bold">{fmt(expense30)}</p>
                  <p className="text-pnc-gray-400 text-[10px]">Out</p>
                </div>
                <div>
                  <p className={`text-sm font-bold ${net30 >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {net30 >= 0 ? '+' : ''}{fmt(net30)}
                  </p>
                  <p className="text-pnc-gray-400 text-[10px]">Net</p>
                </div>
              </div>
            </div>

            {transactions.length === 0 ? (
              <p className="text-center text-pnc-gray-400 text-sm py-8">No transactions</p>
            ) : (
              <div className="bg-white border border-pnc-gray-200 rounded-2xl overflow-hidden divide-y divide-pnc-gray-100">
                {transactions.map(txn => {
                  const cat = TXNCATEGORY[txn.category] || TXNCATEGORY.other
                  const Icon = cat.icon
                  return (
                    <div key={txn.id} className="flex items-center gap-3 px-4 py-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${cat.color}`}>
                        <Icon size={15} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-pnc-gray-900 text-sm truncate">{txn.description}</p>
                        <p className="text-pnc-gray-500 text-xs">{fmtDate(txn.txn_date)}</p>
                      </div>
                      <span className={`text-sm font-semibold tabular-nums shrink-0 ${txn.amount > 0 ? 'text-green-600' : 'text-pnc-gray-900'}`}>
                        {txn.amount > 0 ? '+' : ''}{fmt(txn.amount)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Credit History ── */}
        {tab === 'Credit History' && (
          <div className="space-y-2">
            {leads.length === 0 ? (
              <p className="text-center text-pnc-gray-400 text-sm py-8">No credit history</p>
            ) : (
              leads.map(lead => (
                <div key={lead.id} className="bg-white border border-pnc-gray-200 rounded-xl p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-pnc-gray-900 text-sm font-semibold">
                      {fmt(lead.requested_amount)} LOC
                    </p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                      lead.status === 'approved' ? 'bg-green-50 text-green-700' :
                      lead.status === 'declined' ? 'bg-red-50 text-red-700' :
                      lead.status === 'referred' ? 'bg-blue-50 text-blue-700' :
                      'bg-amber-50 text-amber-700'
                    }`}>{lead.status}</span>
                  </div>
                  {lead.reason && (
                    <p className="text-pnc-gray-500 text-xs leading-relaxed">{lead.reason}</p>
                  )}
                  {lead.created_at && (
                    <p className="text-pnc-gray-400 text-[10px] mt-1.5">{fmtDate(lead.created_at)}</p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Notes ── */}
        {tab === 'Notes' && (
          <div className="space-y-3">
            {/* Add note */}
            <div className="bg-white border border-pnc-gray-200 rounded-xl p-3">
              <textarea
                value={noteInput}
                onChange={e => setNoteInput(e.target.value)}
                placeholder="Add a note about this client..."
                rows={3}
                className="w-full text-sm text-pnc-gray-900 placeholder-pnc-gray-400 resize-none outline-none"
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleAddNote}
                  disabled={!noteInput.trim() || savingNote}
                  className="flex items-center gap-1.5 bg-pnc-navy text-white text-xs font-semibold
                             px-4 py-2 rounded-lg disabled:opacity-40 active:opacity-80 transition-opacity"
                >
                  <Send size={12} />
                  {savingNote ? 'Saving...' : 'Save note'}
                </button>
              </div>
            </div>

            {notes.length === 0 ? (
              <p className="text-center text-pnc-gray-400 text-sm py-6">No notes yet</p>
            ) : (
              notes.map(note => (
                <div key={note.id} className="bg-white border border-pnc-gray-200 rounded-xl p-3.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <MessageSquare size={13} className="text-pnc-gray-400" />
                      <span className="text-pnc-gray-700 text-xs font-semibold">{note.banker_name}</span>
                    </div>
                    <span className="text-pnc-gray-400 text-[10px]">{fmtDate(note.created_at)}</span>
                  </div>
                  <p className="text-pnc-gray-700 text-xs leading-relaxed">{note.note}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
