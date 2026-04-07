import { useState, useEffect, useCallback } from 'react'
import { getLeads, submitDecision } from '../api'
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

const STATUS_CONFIG = {
  pending: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Pending' },
  approved: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', label: 'Approved' },
  declined: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Declined' },
  referred: { icon: ArrowRight, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Referred' },
}

function fmt(n) {
  if (n == null) return '--'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function LeadCard({ lead, onDecide }) {
  const [expanded, setExpanded] = useState(false)
  const [acting, setActing] = useState(false)
  const [result, setResult] = useState(null)
  const cfg = STATUS_CONFIG[lead.status] || STATUS_CONFIG.pending
  const Icon = cfg.icon

  const handleAction = async (action, amount) => {
    setActing(true)
    try {
      const res = await onDecide(lead.id, action, amount)
      setResult(res)
    } catch {
      setResult({ sms_text: 'Failed to process decision' })
    }
    setActing(false)
  }

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
          <p className="text-pnc-gray-900 text-sm font-semibold truncate">
            {lead.smb_name || 'Unknown SMB'}
          </p>
          <p className="text-pnc-gray-500 text-xs mt-0.5">
            {lead.business_type || 'Business'} &middot; Score: {(lead.urgency_score * 100).toFixed(0)}
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
            {cfg.label}
          </span>
        </div>
        {expanded ? (
          <ChevronUp size={16} className="text-pnc-gray-500 shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-pnc-gray-500 shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-pnc-gray-100 pt-3 animate-fade-up">
          {lead.reason && (
            <div className="flex items-start gap-2 mb-3">
              <AlertCircle size={14} className="text-pnc-gray-500 mt-0.5 shrink-0" />
              <p className="text-pnc-gray-700 text-xs leading-relaxed">{lead.reason}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-3">
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

          {result ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3">
              <p className="text-green-800 text-xs font-semibold mb-1">Decision recorded</p>
              <p className="text-green-700 text-xs">{result.sms_text}</p>
            </div>
          ) : lead.status === 'pending' ? (
            <div className="flex gap-2">
              <button
                onClick={() => handleAction('approved', lead.requested_amount || 25000)}
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
          ) : null}
        </div>
      )}
    </div>
  )
}

export default function Activity({ user }) {
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
      banker_note: `${action} via mobile app`,
    })
    setTimeout(load, 500)
    return res
  }

  const filters = ['', 'pending', 'approved', 'declined', 'referred']

  return (
    <div className="px-4 py-4">
      {/* Filter chips */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              filter === f
                ? 'bg-pnc-navy text-white'
                : 'bg-pnc-gray-100 text-pnc-gray-700 active:bg-pnc-gray-200'
            }`}
          >
            {f || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-pnc-orange border-t-transparent rounded-full animate-spin" />
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-20">
          <Clock size={40} className="text-pnc-gray-200 mx-auto mb-3" />
          <p className="text-pnc-gray-500 text-sm">No leads yet</p>
          <p className="text-pnc-gray-500 text-xs mt-1">
            Leads appear when the AI assistant escalates a request
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onDecide={handleDecide} />
          ))}
        </div>
      )}
    </div>
  )
}
