import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MessageCircle,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Send,
  Receipt,
  Wallet,
  ArrowDownLeft,
  ShoppingCart,
  Wrench,
  Building,
  Zap,
  ChevronRight,
  AlertTriangle,
  FileText,
  Sparkles,
} from 'lucide-react'
import { getTransactions, getSMBEscalations } from '../api'

const CATEGORY_ICONS = {
  revenue:     { icon: ArrowDownLeft, color: 'bg-green-50 text-green-600' },
  payroll:     { icon: Send,          color: 'bg-blue-50  text-blue-600'  },
  supplies:    { icon: ShoppingCart,  color: 'bg-purple-50 text-purple-600' },
  software:    { icon: Zap,           color: 'bg-cyan-50  text-cyan-600'  },
  maintenance: { icon: Wrench,        color: 'bg-amber-50 text-amber-600' },
  rent:        { icon: Building,      color: 'bg-orange-50 text-orange-600' },
  utilities:   { icon: Zap,           color: 'bg-yellow-50 text-yellow-600' },
  insurance:   { icon: Receipt,       color: 'bg-slate-50 text-slate-600' },
  equipment:   { icon: Wrench,        color: 'bg-red-50   text-red-600'   },
  fees:        { icon: AlertTriangle, color: 'bg-red-50   text-red-500'   },
  refund:      { icon: TrendingDown,  color: 'bg-orange-50 text-orange-600' },
  other:       { icon: CreditCard,    color: 'bg-gray-50  text-gray-500'  },
}

const QUICK_ACTIONS = [
  { label: 'Transfer', icon: Send,     color: 'bg-blue-50 text-blue-600', path: '/business/chat', prompt: 'I need to transfer funds' },
  { label: 'Pay Bills', icon: Receipt, color: 'bg-green-50 text-green-600', path: '/business/chat', prompt: 'Help me pay a bill' },
  { label: 'Deposit',  icon: Wallet,   color: 'bg-purple-50 text-purple-600', path: '/business/chat', prompt: 'How do I make a deposit?' },
  { label: 'Credit',   icon: CreditCard, color: 'bg-amber-50 text-amber-600', path: '/business/forms' },
]

function fmt(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function fmtDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function Dashboard({ user }) {
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState([])
  const [escalations, setEscalations] = useState([])
  const [loadingTxns, setLoadingTxns] = useState(true)

  useEffect(() => {
    const id = user.smb_id
    Promise.all([
      getTransactions(id).catch(() => []),
      getSMBEscalations(id).catch(() => []),
    ]).then(([txns, escs]) => {
      setTransactions(txns)
      setEscalations(escs)
    }).finally(() => setLoadingTxns(false))
  }, [user.smb_id])

  const checkingBalance = Math.round(user.avg_monthly_revenue * 1.4)
  const savingsBalance  = Math.round(user.avg_monthly_revenue * 0.6)

  // 30-day net from real transactions
  const net30 = transactions.reduce((s, t) => s + t.amount, 0)
  const income30 = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const expenses30 = Math.abs(transactions.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0))

  const pendingEscalation = escalations.find(e => e.status === 'pending')
  const latestDecision = escalations.find(e => e.status === 'approved' || e.status === 'declined' || e.status === 'referred')

  return (
    <div className="pb-4" data-walkthrough="smb-dashboard">
      {/* Balance cards */}
      <div className="bg-pnc-navy px-4 pb-6 pt-2 -mt-[1px]">
        <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
          <p className="text-white/70 text-xs font-medium uppercase tracking-wide">
            Business Checking
          </p>
          <p className="text-white text-3xl font-bold mt-1">{fmt(checkingBalance)}</p>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/10">
            <div>
              <p className="text-white/60 text-[10px] uppercase tracking-wide">Savings</p>
              <p className="text-white text-sm font-semibold">{fmt(savingsBalance)}</p>
            </div>
            <div className="w-px h-8 bg-white/15" />
            <div>
              <p className="text-white/60 text-[10px] uppercase tracking-wide">Monthly Avg</p>
              <p className="text-white text-sm font-semibold">{fmt(user.avg_monthly_revenue)}</p>
            </div>
            <div className="w-px h-8 bg-white/15" />
            <div>
              <p className={`text-[10px] uppercase tracking-wide ${net30 >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                30-day net
              </p>
              <p className={`text-sm font-semibold ${net30 >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                {net30 >= 0 ? '+' : ''}{fmt(net30)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Proactive AI alert */}
      {net30 < 0 && (
        <div className="px-4 mt-4">
          <div className="bg-gradient-to-r from-red-50 to-amber-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles size={16} className="text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-red-800 text-xs font-bold uppercase tracking-wide">AI Alert</p>
              <p className="text-red-900 text-sm font-semibold mt-0.5">
                Cash flow dip detected
              </p>
              <p className="text-red-700 text-xs mt-1 leading-relaxed">
                Based on your recent transactions, your balance may drop by {fmt(Math.abs(net30))} this month.
                Tap below for a full forecast and options.
              </p>
              <button
                onClick={() => navigate('/business/chat', { state: { demoPrompt: "What's my cash flow forecast?", demoAutoSend: true } })}
                className="mt-2.5 flex items-center gap-1.5 text-red-700 text-xs font-semibold
                           active:opacity-70 transition-opacity"
              >
                <MessageCircle size={13} />
                Ask Brilliant Banker
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="px-4 pt-5">
        <div className="flex items-center justify-between gap-3">
          {QUICK_ACTIONS.map(({ label, icon: Icon, color, path, prompt }) => (
            <button
              key={label}
              onClick={() => navigate(path, prompt ? { state: { demoPrompt: prompt } } : undefined)}
              className="flex-1 flex flex-col items-center gap-1.5 py-3 active:opacity-70 transition-opacity"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
                <Icon size={20} />
              </div>
              <span className="text-pnc-gray-700 text-[11px] font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Pending banker decision notification */}
      {latestDecision?.notification_text && (
        <div className="px-4 mt-4">
          <div className={`rounded-2xl p-4 border ${
            latestDecision.status === 'approved'
              ? 'bg-green-50 border-green-200'
              : latestDecision.status === 'declined'
              ? 'bg-red-50 border-red-200'
              : 'bg-blue-50 border-blue-200'
          }`}>
            <p className={`text-xs font-semibold mb-1 ${
              latestDecision.status === 'approved' ? 'text-green-800' :
              latestDecision.status === 'declined' ? 'text-red-800' : 'text-blue-800'
            }`}>
              {latestDecision.status === 'approved' ? '🎉 Credit Line Approved' :
               latestDecision.status === 'declined' ? 'Credit Decision' : 'Update from Your RM'}
            </p>
            <p className={`text-sm ${
              latestDecision.status === 'approved' ? 'text-green-700' :
              latestDecision.status === 'declined' ? 'text-red-700' : 'text-blue-700'
            }`}>{latestDecision.notification_text}</p>
          </div>
        </div>
      )}

      {/* Pending escalation nudge */}
      {pendingEscalation && !latestDecision?.notification_text && (
        <div className="px-4 mt-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-amber-800 text-sm font-semibold">Credit request in review</p>
              <p className="text-amber-700 text-xs mt-0.5">
                Your {fmt(pendingEscalation.requested_amount)} request is pending RM review.
              </p>
            </div>
            <button onClick={() => navigate('/business/activity')} className="text-amber-700 shrink-0">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* AI assistant card */}
      <div className="px-4 mt-4">
        <button
          onClick={() => navigate('/business/chat')}
          className="w-full bg-gradient-to-r from-pnc-orange to-pnc-orange-dark rounded-2xl p-4 text-left
                     active:opacity-90 transition-opacity"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
              <MessageCircle size={20} className="text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Ask Brilliant Banker</p>
              <p className="text-white/80 text-xs mt-1 leading-relaxed">
                Check cash flow, explore credit options, or get answers about your account.
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Forms card */}
      <div className="px-4 mt-3">
        <button
          onClick={() => navigate('/business/forms')}
          className="w-full bg-white border border-pnc-gray-200 rounded-2xl p-4 text-left
                     active:bg-pnc-gray-50 hover:border-pnc-gray-300 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center shrink-0">
              <FileText size={20} className="text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-pnc-gray-900 font-semibold text-sm">Apply for Credit & Loans</p>
              <p className="text-pnc-gray-500 text-xs mt-0.5">
                Auto-fill PNC business forms from your profile
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Sparkles size={12} className="text-pnc-orange" />
              <ChevronRight size={16} className="text-pnc-gray-400" />
            </div>
          </div>
        </button>
      </div>

      {/* Cash flow 30-day summary */}
      <div className="px-4 mt-4">
        <div className="bg-white border border-pnc-gray-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-pnc-gray-900 text-sm font-semibold">30-Day Cash Flow</h3>
            {net30 >= 0
              ? <TrendingUp size={18} className="text-green-500" />
              : <TrendingDown size={18} className="text-red-500" />
            }
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-green-600 text-base font-bold">{fmt(income30)}</p>
              <p className="text-pnc-gray-500 text-[10px] uppercase tracking-wide mt-0.5">In</p>
            </div>
            <div className="text-center">
              <p className="text-red-500 text-base font-bold">{fmt(expenses30)}</p>
              <p className="text-pnc-gray-500 text-[10px] uppercase tracking-wide mt-0.5">Out</p>
            </div>
            <div className="text-center">
              <p className={`text-base font-bold ${net30 >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {net30 >= 0 ? '+' : ''}{fmt(net30)}
              </p>
              <p className="text-pnc-gray-500 text-[10px] uppercase tracking-wide mt-0.5">Net</p>
            </div>
          </div>
          {/* Stability bar */}
          <div className="mt-3 pt-3 border-t border-pnc-gray-100">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-pnc-gray-500 text-xs">Cash Stability</span>
              <span className={`text-xs font-semibold ${
                user.cash_stability > 0.7 ? 'text-green-600' :
                user.cash_stability > 0.5 ? 'text-amber-600' : 'text-red-500'
              }`}>{(user.cash_stability * 100).toFixed(0)}%</span>
            </div>
            <div className="w-full bg-pnc-gray-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  user.cash_stability > 0.7 ? 'bg-green-500' :
                  user.cash_stability > 0.5 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${user.cash_stability * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="px-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-pnc-gray-900 text-sm font-semibold">Recent Activity</h3>
        </div>

        {loadingTxns ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-14 bg-pnc-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-pnc-gray-400 text-sm">No transactions yet</div>
        ) : (
          <div className="bg-white border border-pnc-gray-200 rounded-2xl overflow-hidden divide-y divide-pnc-gray-100">
            {transactions.slice(0, 8).map((txn) => {
              const cat = CATEGORY_ICONS[txn.category] || CATEGORY_ICONS.other
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
                  <span className={`text-sm font-semibold tabular-nums shrink-0 ${
                    txn.amount > 0 ? 'text-green-600' : 'text-pnc-gray-900'
                  }`}>
                    {txn.amount > 0 ? '+' : ''}{fmt(txn.amount)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
