import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Flame,
  Sparkles,
  ExternalLink,
  DollarSign,
} from 'lucide-react'
import { getLeads, submitDecision, getBankerSMBBrief } from '../../api'

const STATUS_CONFIG = {
  pending:  { icon: Clock,        color: 'text-amber-600', bg: 'bg-amber-50',  label: 'Pending'  },
  approved: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50',  label: 'Approved' },
  declined: { icon: XCircle,      color: 'text-red-600',   bg: 'bg-red-50',    label: 'Declined' },
  referred: { icon: ArrowRight,   color: 'text-blue-600',  bg: 'bg-blue-50',   label: 'Referred' },
}

function fmt(n) {
  if (n == null) return '--'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function UrgencyDot({ score }) {
  if (score >= 0.75) return (
    <span className="flex items-center gap-1 text-[10px] font-semibold text-red-600">
      <Flame size={10} /> High urgency
    </span>
  )
  if (score >= 0.5) return (
    <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600">
      <Clock size={10} /> Medium urgency
    </span>
  )
  return (
    <span className="flex items-center gap-1 text-[10px] font-semibold text-blue-600">
      <Clock size={10} /> Low urgency
    </span>
  )
}

// Conversation playbook talking points based on lead data
function ConversationPlaybook({ lead, profile }) {
  const points = []

  if (lead.credit_score != null) {
    const score = (lead.credit_score * 100).toFixed(0)
    if (lead.credit_score >= 0.7) {
      points.push(`Credit score of ${score} is strong — lead with the positive.`)
    } else {
      points.push(`Credit score of ${score} is borderline — address proactively.`)
    }
  }

  if (profile?.cash_stability != null) {
    const s = (profile.cash_stability * 100).toFixed(0)
    if (profile.cash_stability < 0.5) {
      points.push(`Cash stability at ${s}% — ask about the root cause and timeline.`)
    } else {
      points.push(`Cash stability at ${s}% — acknowledge their solid cash management.`)
    }
  }

  if (lead.requested_amount) {
    const maxEst = profile ? Math.round(profile.avg_monthly_revenue * 3 * (lead.credit_score || 0.65)) : null
    if (maxEst && lead.requested_amount > maxEst) {
      points.push(`Requested ${fmt(lead.requested_amount)} may exceed pre-qual max of ~${fmt(maxEst)}. Discuss a lower starting amount.`)
    } else {
      points.push(`${fmt(lead.requested_amount)} request appears within pre-qual range.`)
    }
  }

  points.push('Ask about their 90-day business outlook and any upcoming large expenses.')

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
      <p className="text-blue-800 text-xs font-semibold mb-2">Conversation Playbook</p>
      <ul className="space-y-1.5">
        {points.map((p, i) => (
          <li key={i} className="flex items-start gap-1.5 text-blue-700 text-xs">
            <span className="text-blue-400 mt-0.5 shrink-0">→</span>
            {p}
          </li>
        ))}
      </ul>
    </div>
  )
}

function LeadCard({ lead, onDecide, user }) {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)
  const [acting, setActing] = useState(false)
  const [result, setResult] = useState(null)
  const [brief, setBrief] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loadingBrief, setLoadingBrief] = useState(false)
  const [approveAmount, setApproveAmount] = useState('')
  const [showPlaybook, setShowPlaybook] = useState(false)

  const cfg = STATUS_CONFIG[lead.status] || STATUS_CONFIG.pending
  const Icon = cfg.icon

  const handleAction = async (action) => {
    const amount = action === 'approved'
      ? (parseInt(approveAmount.replace(/[^0-9]/g, '')) || lead.requested_amount || 25000)
      : null
    setActing(true)
    try {
      const res = await onDecide(lead.id, action, amount)
      setResult(res)
    } catch {
      setResult({ notification_text: 'Failed to process decision.' })
    }
    setActing(false)
  }

  const fetchBrief = async () => {
    setLoadingBrief(true)
    try {
      const data = await getBankerSMBBrief(lead.smb_id)
      setBrief(data.ai_brief)
      setProfile(data)
    } catch {
      setBrief('Unable to generate brief.')
    }
    setLoadingBrief(false)
  }

  // Auto-init amount from lead
  useEffect(() => {
    if (lead.requested_amount) setApproveAmount(String(lead.requested_amount))
  }, [lead.requested_amount])

  return (
    <div className="bg-white border border-pnc-gray-200 rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left active:bg-pnc-gray-50 transition-colors"
      >
        <div className={`w-10 h-10 rounded-full ${cfg.bg} flex items-center justify-center shrink-0`}>
          <Icon size={20} className={cfg.color} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-pnc-gray-900 text-sm font-semibold truncate">{lead.smb_name || 'Unknown'}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {lead.ticket_number && (
              <span className="text-pnc-orange text-[9px] font-bold">{lead.ticket_number}</span>
            )}
            <p className="text-pnc-gray-500 text-xs">
              {lead.business_type} · {fmt(lead.requested_amount)}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
            {cfg.label}
          </span>
          {lead.status === 'pending' && <UrgencyDot score={lead.urgency_score} />}
        </div>
        {expanded ? <ChevronUp size={16} className="text-pnc-gray-400 shrink-0" /> : <ChevronDown size={16} className="text-pnc-gray-400 shrink-0" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-pnc-gray-100 pt-3 space-y-3">
          {/* Reason */}
          {lead.reason && (
            <div className="flex items-start gap-2">
              <AlertCircle size={14} className="text-pnc-gray-400 mt-0.5 shrink-0" />
              <p className="text-pnc-gray-700 text-xs leading-relaxed">{lead.reason}</p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-pnc-gray-50 rounded-xl px-3 py-2">
              <p className="text-pnc-gray-500 text-[10px] uppercase tracking-wide">Requested</p>
              <p className="text-pnc-gray-900 text-sm font-semibold">{fmt(lead.requested_amount)}</p>
            </div>
            <div className="bg-pnc-gray-50 rounded-xl px-3 py-2">
              <p className="text-pnc-gray-500 text-[10px] uppercase tracking-wide">Credit Score</p>
              <p className="text-pnc-gray-900 text-sm font-semibold">
                {lead.credit_score != null ? (lead.credit_score * 100).toFixed(0) : '--'}
              </p>
            </div>
          </div>

          {/* AI Brief */}
          <div className="bg-pnc-gray-50 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Sparkles size={13} className="text-pnc-orange" />
                <span className="text-pnc-gray-700 text-xs font-semibold">AI Pre-call Brief</span>
              </div>
              {!brief && !loadingBrief && (
                <button onClick={fetchBrief} className="text-pnc-orange text-[10px] font-semibold">
                  Generate
                </button>
              )}
            </div>
            {loadingBrief ? (
              <div className="flex items-center gap-2 py-2">
                <div className="w-3 h-3 border-2 border-pnc-orange border-t-transparent rounded-full animate-spin" />
                <span className="text-pnc-gray-500 text-xs">Analyzing...</span>
              </div>
            ) : brief ? (
              <p className="text-pnc-gray-700 text-xs leading-relaxed whitespace-pre-line">{brief}</p>
            ) : (
              <p className="text-pnc-gray-400 text-xs">Generate a 30-sec pre-call brief.</p>
            )}
          </div>

          {/* Conversation playbook */}
          {brief && (
            <div>
              <button
                onClick={() => setShowPlaybook(!showPlaybook)}
                className="w-full flex items-center justify-between text-blue-700 text-xs font-semibold py-1"
              >
                <span>Conversation Playbook</span>
                {showPlaybook ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {showPlaybook && <ConversationPlaybook lead={lead} profile={profile} />}
            </div>
          )}

          {/* View full profile */}
          <button
            onClick={() => navigate(`/banker/clients/${lead.smb_id}`)}
            className="w-full flex items-center justify-center gap-1.5 text-pnc-navy text-xs font-semibold
                       py-2 border border-pnc-navy/20 rounded-xl active:bg-pnc-navy/5 transition-colors"
          >
            <ExternalLink size={13} /> View full client profile
          </button>

          {/* Decision area */}
          {result ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3">
              <p className="text-green-800 text-xs font-semibold mb-1">Decision recorded</p>
              <p className="text-green-700 text-xs">{result.notification_text}</p>
            </div>
          ) : lead.status === 'pending' ? (
            <div className="space-y-2">
              {/* Approve amount input */}
              <div className="flex items-center gap-2 bg-pnc-gray-50 rounded-xl px-3 py-2">
                <DollarSign size={14} className="text-pnc-gray-400 shrink-0" />
                <input
                  type="text"
                  value={approveAmount}
                  onChange={e => setApproveAmount(e.target.value)}
                  placeholder="Approve amount"
                  className="flex-1 bg-transparent text-sm text-pnc-gray-900 placeholder-pnc-gray-400 outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAction('approved')}
                  disabled={acting}
                  className="flex-1 bg-green-600 text-white text-xs font-semibold py-2.5 rounded-xl
                             active:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleAction('declined')}
                  disabled={acting}
                  className="flex-1 bg-pnc-gray-100 text-pnc-gray-700 text-xs font-semibold py-2.5 rounded-xl
                             active:bg-pnc-gray-200 disabled:opacity-50 transition-colors"
                >
                  Decline
                </button>
                <button
                  onClick={() => handleAction('referred')}
                  disabled={acting}
                  className="flex-1 bg-blue-50 text-blue-700 text-xs font-semibold py-2.5 rounded-xl
                             active:bg-blue-100 disabled:opacity-50 transition-colors"
                >
                  Refer
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

const FILTER_TABS = ['', 'pending', 'approved', 'declined', 'referred']

export default function BankerCreditReview({ user }) {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    getLeads(filter || undefined)
      .then(setLeads)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [filter])

  useEffect(() => { load() }, [load])

  const handleDecide = async (leadId, action, amount) => {
    const res = await submitDecision(leadId, {
      action,
      amount: amount || null,
      banker_note: `${action} via banker app`,
    }, user?.banker_id)
    setTimeout(load, 500)
    return res
  }

  const pendingCount = leads.filter(l => l.status === 'pending').length

  return (
    <div className="px-4 py-4">
      {pendingCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2.5 mb-4">
          <AlertCircle size={16} className="text-amber-600 shrink-0" />
          <p className="text-amber-800 text-xs">
            <span className="font-semibold">{pendingCount} decision{pendingCount > 1 ? 's' : ''}</span> waiting for your review
          </p>
        </div>
      )}

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {FILTER_TABS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              filter === f
                ? 'bg-pnc-navy text-white'
                : 'bg-pnc-gray-100 text-pnc-gray-700 active:bg-pnc-gray-200'
            }`}
          >
            {f ? f.charAt(0).toUpperCase() + f.slice(1) : 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-pnc-navy border-t-transparent rounded-full animate-spin" />
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-20">
          <CheckCircle2 size={40} className="text-pnc-gray-200 mx-auto mb-3" />
          <p className="text-pnc-gray-500 text-sm">No leads yet</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-3">
          {leads.map(lead => (
            <LeadCard key={lead.id} lead={lead} onDecide={handleDecide} user={user} />
          ))}
        </div>
      )}
    </div>
  )
}
