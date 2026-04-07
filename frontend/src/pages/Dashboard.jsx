import { useNavigate } from 'react-router-dom'
import {
  ArrowUpRight,
  ArrowDownLeft,
  MessageCircle,
  TrendingUp,
  CreditCard,
  Send,
  Receipt,
  Wallet,
} from 'lucide-react'

const MOCK_TRANSACTIONS = [
  { id: 1, name: 'Payroll - ADP', amount: -12450, date: 'Apr 4', icon: Send },
  { id: 2, name: 'Client Payment - Invoice #1042', amount: 8200, date: 'Apr 3', icon: ArrowDownLeft },
  { id: 3, name: 'Supplies - Home Depot', amount: -534, date: 'Apr 2', icon: Receipt },
  { id: 4, name: 'Client Payment - Invoice #1038', amount: 3750, date: 'Apr 1', icon: ArrowDownLeft },
  { id: 5, name: 'Software - QuickBooks', amount: -85, date: 'Mar 31', icon: CreditCard },
]

const QUICK_ACTIONS = [
  { label: 'Transfer', icon: Send, color: 'bg-blue-50 text-blue-600' },
  { label: 'Pay Bills', icon: Receipt, color: 'bg-green-50 text-green-600' },
  { label: 'Deposit', icon: Wallet, color: 'bg-purple-50 text-purple-600' },
  { label: 'Credit', icon: CreditCard, color: 'bg-amber-50 text-amber-600' },
]

function fmt(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

export default function Dashboard({ user }) {
  const navigate = useNavigate()
  const checkingBalance = Math.round(user.avg_monthly_revenue * 1.4)
  const savingsBalance = Math.round(user.avg_monthly_revenue * 0.6)

  return (
    <div className="pb-4">
      {/* Balance cards */}
      <div className="bg-pnc-navy px-4 pb-6 pt-2 -mt-[1px]">
        <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
          <p className="text-white/70 text-xs font-medium uppercase tracking-wide">
            Business Checking
          </p>
          <p className="text-white text-3xl font-bold mt-1">
            {fmt(checkingBalance)}
          </p>
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
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="px-4 -mt-0 pt-5">
        <div className="flex items-center justify-between gap-3">
          {QUICK_ACTIONS.map(({ label, icon: Icon, color }) => (
            <button
              key={label}
              className="flex-1 flex flex-col items-center gap-1.5 py-3"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
                <Icon size={20} />
              </div>
              <span className="text-pnc-gray-700 text-[11px] font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* AI assistant card */}
      <div className="px-4 mt-4">
        <button
          onClick={() => navigate('/chat')}
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

      {/* Cash flow indicator */}
      <div className="px-4 mt-4">
        <div className="bg-white border border-pnc-gray-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-pnc-gray-900 text-sm font-semibold">Cash Flow Health</h3>
            <TrendingUp size={18} className={user.cash_stability > 0.6 ? 'text-green-500' : 'text-amber-500'} />
          </div>
          <div className="w-full bg-pnc-gray-100 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all ${
                user.cash_stability > 0.7
                  ? 'bg-green-500'
                  : user.cash_stability > 0.5
                  ? 'bg-amber-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${user.cash_stability * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-pnc-gray-500 text-xs">Stability Score</span>
            <span className="text-pnc-gray-900 text-xs font-semibold">
              {(user.cash_stability * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="px-4 mt-4">
        <h3 className="text-pnc-gray-900 text-sm font-semibold mb-3">Recent Activity</h3>
        <div className="bg-white border border-pnc-gray-200 rounded-2xl overflow-hidden divide-y divide-pnc-gray-100">
          {MOCK_TRANSACTIONS.map(({ id, name, amount, date, icon: Icon }) => (
            <div key={id} className="flex items-center gap-3 px-4 py-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                amount > 0 ? 'bg-green-50' : 'bg-pnc-gray-50'
              }`}>
                <Icon size={16} className={amount > 0 ? 'text-green-600' : 'text-pnc-gray-500'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-pnc-gray-900 text-sm truncate">{name}</p>
                <p className="text-pnc-gray-500 text-xs">{date}</p>
              </div>
              <span className={`text-sm font-semibold tabular-nums ${
                amount > 0 ? 'text-green-600' : 'text-pnc-gray-900'
              }`}>
                {amount > 0 ? '+' : ''}{fmt(amount)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
