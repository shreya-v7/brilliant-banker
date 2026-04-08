import { useState, useEffect, useCallback } from 'react'
import { getSMBEscalations } from '../api'
import {
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  CreditCard,
  AlertCircle,
  Ticket,
  Mail,
  User,
} from 'lucide-react'

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    label: 'Pending Review',
    description: 'Your RM is reviewing this request.',
  },
  approved: {
    icon: CheckCircle2,
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    label: 'Approved',
    description: 'Your request was approved.',
  },
  declined: {
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    label: 'Not Approved',
    description: 'Your request was not approved at this time.',
  },
  referred: {
    icon: ArrowRight,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    label: 'Under Review',
    description: 'Your RM will call within 24 hours.',
  },
}

function fmt(n) {
  if (n == null) return '--'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function EscalationCard({ esc }) {
  const [expanded, setExpanded] = useState(false)
  const cfg = STATUS_CONFIG[esc.status] || STATUS_CONFIG.pending
  const Icon = cfg.icon

  return (
    <div className={`bg-white border rounded-2xl overflow-hidden ${cfg.border}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left active:bg-pnc-gray-50 transition-colors"
      >
        <div className={`w-10 h-10 rounded-full ${cfg.bg} flex items-center justify-center shrink-0`}>
          <Icon size={20} className={cfg.color} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-pnc-gray-900 text-sm font-semibold">
            {esc.requested_amount ? `${fmt(esc.requested_amount)} Credit Request` : 'RM Escalation'}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {esc.ticket_number && (
              <span className="text-pnc-orange text-[10px] font-bold">{esc.ticket_number}</span>
            )}
            <p className="text-pnc-gray-500 text-xs">{fmtDate(esc.created_at)}</p>
          </div>
        </div>
        <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${cfg.bg} ${cfg.color}`}>
          {cfg.label}
        </span>
        {expanded
          ? <ChevronUp size={16} className="text-pnc-gray-400 shrink-0" />
          : <ChevronDown size={16} className="text-pnc-gray-400 shrink-0" />
        }
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-pnc-gray-100 pt-3 space-y-3">
          {/* Reason */}
          {esc.reason && (
            <div className="flex items-start gap-2">
              <AlertCircle size={14} className="text-pnc-gray-400 mt-0.5 shrink-0" />
              <p className="text-pnc-gray-600 text-xs leading-relaxed">{esc.reason}</p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-pnc-gray-50 rounded-xl px-3 py-2">
              <p className="text-pnc-gray-500 text-[10px] uppercase tracking-wide">Amount</p>
              <p className="text-pnc-gray-900 text-sm font-semibold">{fmt(esc.requested_amount)}</p>
            </div>
            <div className="bg-pnc-gray-50 rounded-xl px-3 py-2">
              <p className="text-pnc-gray-500 text-[10px] uppercase tracking-wide">Status</p>
              <p className={`text-sm font-semibold capitalize ${cfg.color}`}>{esc.status}</p>
            </div>
          </div>

          {/* Assigned RM */}
          {esc.assigned_rm && (
            <div className="bg-pnc-navy/5 border border-pnc-navy/10 rounded-xl p-3 space-y-2">
              <p className="text-pnc-gray-500 text-[10px] uppercase tracking-wide font-medium">Your Relationship Manager</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-pnc-navy flex items-center justify-center shrink-0">
                  <span className="text-white text-[10px] font-bold">
                    {esc.assigned_rm.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <p className="text-pnc-gray-900 text-xs font-semibold">{esc.assigned_rm.name}</p>
                  <p className="text-pnc-gray-500 text-[10px]">{esc.assigned_rm.title}</p>
                </div>
              </div>
              <a
                href={`mailto:${esc.assigned_rm.email}`}
                className="flex items-center gap-1.5 text-pnc-navy text-xs font-medium"
              >
                <Mail size={12} />
                {esc.assigned_rm.email}
              </a>
            </div>
          )}

          {/* RM notification */}
          {esc.notification_text && (
            <div className={`${cfg.bg} border ${cfg.border} rounded-xl p-3`}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <MessageCircle size={13} className={cfg.color} />
                <span className={`text-xs font-semibold ${cfg.color}`}>Message from your RM</span>
              </div>
              <p className="text-pnc-gray-700 text-xs leading-relaxed">{esc.notification_text}</p>
            </div>
          )}

          {/* Pending state nudge */}
          {esc.status === 'pending' && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
              <p className="text-amber-700 text-xs leading-relaxed">
                Your request is in the priority queue. Your RM typically responds within 4 business hours.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Activity({ user }) {
  const [escalations, setEscalations] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    getSMBEscalations(user.smb_id)
      .then(setEscalations)
      .catch(() => setEscalations([]))
      .finally(() => setLoading(false))
  }, [user.smb_id])

  useEffect(() => { load() }, [load])

  const filtered = filter
    ? escalations.filter(e => e.status === filter)
    : escalations

  const FILTERS = ['', 'pending', 'approved', 'declined', 'referred']

  return (
    <div className="px-4 py-4">
      {/* Summary banner */}
      {escalations.length > 0 && (
        <div className="bg-white border border-pnc-gray-200 rounded-2xl p-4 mb-4">
          <p className="text-pnc-gray-900 text-sm font-semibold mb-3">Your Requests</p>
          <div className="grid grid-cols-4 gap-2">
            {['pending','approved','declined','referred'].map(s => {
              const count = escalations.filter(e => e.status === s).length
              const cfg = STATUS_CONFIG[s]
              return (
                <div key={s} className={`text-center rounded-xl py-2 ${cfg.bg}`}>
                  <p className={`text-lg font-bold ${cfg.color}`}>{count}</p>
                  <p className={`text-[9px] font-medium ${cfg.color}`} style={{fontSize:'9px'}}>{cfg.label.split(' ')[0]}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Filter chips */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {FILTERS.map(f => (
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
          <div className="w-6 h-6 border-2 border-pnc-orange border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <CreditCard size={40} className="text-pnc-gray-200 mx-auto mb-3" />
          <p className="text-pnc-gray-500 text-sm">
            {filter ? `No ${filter} requests` : 'No requests yet'}
          </p>
          <p className="text-pnc-gray-400 text-xs mt-1">
            Ask the AI assistant about credit options to get started
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(esc => (
            <EscalationCard key={esc.id} esc={esc} />
          ))}
        </div>
      )}
    </div>
  )
}
