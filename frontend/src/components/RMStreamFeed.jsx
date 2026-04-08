import { useNavigate } from 'react-router-dom'
import {
  X,
  Bell,
  TrendingUp,
  CreditCard,
  MessageCircle,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Zap,
  ChevronRight,
  Ticket,
} from 'lucide-react'

const INTENT_META = {
  cash_flow_query:        { icon: TrendingUp,    color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200'  },
  credit_prequal_request: { icon: CreditCard,    color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-200' },
  faq_question:           { icon: MessageCircle, color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200' },
  escalate_to_banker:     { icon: AlertTriangle, color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200'   },
  general_chat:           { icon: MessageCircle, color: 'text-gray-500',   bg: 'bg-gray-50',   border: 'border-gray-200'  },
}

const DECISION_META = {
  approved: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  declined: { icon: XCircle,      color: 'text-red-600',   bg: 'bg-red-50',   border: 'border-red-200'   },
  referred: { icon: ArrowRight,   color: 'text-blue-600',  bg: 'bg-blue-50',  border: 'border-blue-200'  },
}

function timeAgo(iso) {
  if (!iso) return ''
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (secs < 10) return 'just now'
  if (secs < 60) return `${secs}s ago`
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  return `${Math.floor(secs / 3600)}h ago`
}

function EventItem({ event, onNavigate }) {
  const navigate = useNavigate()

  let meta, label
  if (event.event_type === 'decision') {
    meta = DECISION_META[event.action] || DECISION_META.approved
    label = `Decision: ${event.action}`
  } else {
    meta = INTENT_META[event.intent] || INTENT_META.general_chat
    label = event.escalated ? 'Escalation' : (event.intent || '').replace(/_/g, ' ')
  }

  const Icon = meta.icon

  return (
    <button
      onClick={() => {
        if (event.smb_id) navigate(`/banker/clients/${event.smb_id}`)
        onNavigate?.()
      }}
      className={`w-full flex items-start gap-3 p-3 rounded-xl border ${meta.border} ${meta.bg}
                  text-left active:opacity-80 transition-opacity animate-fade-up`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${meta.bg}`}>
        <Icon size={15} className={meta.color} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-[10px] font-semibold uppercase tracking-wide ${meta.color}`}>
            {label}
          </span>
          {event.urgency === 'high' && (
            <span className="flex items-center gap-0.5 text-[9px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full">
              <Zap size={8} /> URGENT
            </span>
          )}
        </div>
        <p className="text-pnc-gray-900 text-xs font-semibold truncate">{event.smb_name}</p>
        <p className="text-pnc-gray-600 text-xs leading-relaxed mt-0.5">
          {event.highlight || event.notification_text || event.reason || ''}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {event.ticket_number && (
            <span className="flex items-center gap-1 text-[9px] font-bold text-pnc-orange">
              <Ticket size={9} />
              {event.ticket_number}
            </span>
          )}
          <p className="text-pnc-gray-400 text-[10px]">{timeAgo(event.timestamp)}</p>
        </div>
      </div>
      <ChevronRight size={14} className="text-pnc-gray-300 shrink-0 mt-1.5" />
    </button>
  )
}

export default function RMStreamFeed({ isOpen, onClose, events }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end pointer-events-none">
      <div
        className="absolute inset-0 bg-black/20 pointer-events-auto"
        onClick={onClose}
      />

      <div className="relative w-full max-w-sm h-full pointer-events-auto bg-white shadow-2xl flex flex-col z-10">
        {/* Header */}
        <div className="bg-pnc-navy px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-pnc-orange/20 flex items-center justify-center">
              <Zap size={14} className="text-pnc-orange" />
            </div>
            <div>
              <h2 className="text-white text-sm font-bold">Live Feed</h2>
              <p className="text-white/50 text-[10px]">Real-time client activity stream</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/60 active:text-white p-1">
            <X size={20} />
          </button>
        </div>

        {/* Stream indicator */}
        <div className="px-4 py-2 bg-pnc-gray-50 border-b border-pnc-gray-200 flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span className="text-pnc-gray-500 text-[10px] font-medium">
            Streaming via Redis pub/sub &middot; {events.length} events
          </span>
        </div>

        {/* Events list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-14 h-14 rounded-full bg-pnc-gray-100 flex items-center justify-center mb-3">
                <Bell size={24} className="text-pnc-gray-300" />
              </div>
              <p className="text-pnc-gray-500 text-sm font-medium">No events yet</p>
              <p className="text-pnc-gray-400 text-xs mt-1 max-w-[220px]">
                When clients chat with the AI, highlights will stream here in real-time.
              </p>
            </div>
          ) : (
            events.map((event, i) => (
              <EventItem key={`${event.timestamp}-${i}`} event={event} onNavigate={onClose} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
