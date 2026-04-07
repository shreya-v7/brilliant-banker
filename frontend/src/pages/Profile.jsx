import { useState, useEffect } from 'react'
import { getSMBProfile, getTransactions } from '../api'
import {
  Building2,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Phone,
  Sparkles,
  LogOut,
  Link,
  BookOpen,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react'

function fmt(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
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

const TPA_INTEGRATIONS = [
  { name: 'QuickBooks', status: 'connected', color: 'text-green-600 bg-green-50', icon: '📊' },
  { name: 'Square', status: 'connected', color: 'text-green-600 bg-green-50', icon: '⬛' },
  { name: 'Shopify', status: 'not connected', color: 'text-pnc-gray-400 bg-pnc-gray-50', icon: '🛍' },
  { name: 'Stripe', status: 'not connected', color: 'text-pnc-gray-400 bg-pnc-gray-50', icon: '💳' },
]

const DOCS = [
  { title: 'Getting Started Guide', subtitle: 'Set up your business account', icon: BookOpen },
  { title: 'Cash Flow Basics', subtitle: 'Understanding your forecast', icon: TrendingUp },
  { title: 'Credit Line Eligibility', subtitle: 'What bankers look for', icon: ShieldCheck },
]

export default function Profile({ user, onLogout }) {
  const [brief, setBrief] = useState(null)
  const [loadingBrief, setLoadingBrief] = useState(false)
  const [activeSection, setActiveSection] = useState('overview') // overview | integrations | docs

  const fetchBrief = () => {
    setLoadingBrief(true)
    getSMBProfile(user.smb_id)
      .then(p => setBrief(p.ai_brief))
      .catch(() => setBrief('Unable to generate brief.'))
      .finally(() => setLoadingBrief(false))
  }

  return (
    <div className="px-4 py-4 pb-8">
      {/* Profile header */}
      <div className="flex items-center gap-4 mb-5">
        <div className="w-16 h-16 rounded-full bg-pnc-navy/5 flex items-center justify-center">
          <Building2 size={28} className="text-pnc-navy" />
        </div>
        <div>
          <h2 className="text-pnc-gray-900 text-lg font-bold">{user.name}</h2>
          <p className="text-pnc-gray-500 text-sm">{user.business_type}</p>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex bg-pnc-gray-100 rounded-xl p-1 mb-5">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'integrations', label: 'Integrations' },
          { key: 'docs', label: 'Guides' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveSection(key)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeSection === key ? 'bg-white text-pnc-navy shadow-sm' : 'text-pnc-gray-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeSection === 'overview' && (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <StatCard icon={DollarSign} label="Annual Revenue" value={fmt(user.annual_revenue)} color="text-green-600" />
            <StatCard icon={DollarSign} label="Monthly Avg" value={fmt(user.avg_monthly_revenue)} color="text-blue-600" />
            <StatCard icon={TrendingUp} label="Cash Stability" value={`${(user.cash_stability * 100).toFixed(0)}%`} color="text-amber-600" />
            <StatCard icon={ShieldCheck} label="Payment History" value={`${(user.payment_history * 100).toFixed(0)}%`} color="text-purple-600" />
          </div>

          {/* Phone */}
          <div className="bg-white border border-pnc-gray-200 rounded-xl p-4 flex items-center gap-3 mb-5">
            <Phone size={18} className="text-pnc-gray-500" />
            <div>
              <p className="text-pnc-gray-500 text-xs">Phone on file</p>
              <p className="text-pnc-gray-900 text-sm font-medium">{user.phone}</p>
            </div>
          </div>

          {/* AI Brief */}
          <div className="bg-white border border-pnc-gray-200 rounded-xl p-4 mb-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-pnc-orange" />
                <h3 className="text-pnc-gray-900 text-sm font-semibold">AI Business Brief</h3>
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
                <span className="text-pnc-gray-500 text-xs">Analyzing profile with AI...</span>
              </div>
            ) : brief ? (
              <div className="text-pnc-gray-700 text-sm leading-relaxed whitespace-pre-line">{brief}</div>
            ) : (
              <p className="text-pnc-gray-500 text-xs">
                Generate an AI-powered summary of your business profile.
              </p>
            )}
          </div>

          {/* Account ID */}
          <div className="bg-pnc-gray-50 rounded-xl px-4 py-3 mb-5">
            <p className="text-pnc-gray-500 text-[10px] uppercase tracking-wide mb-0.5">Account ID</p>
            <p className="text-pnc-gray-700 text-xs font-mono">{user.smb_id}</p>
          </div>
        </>
      )}

      {activeSection === 'integrations' && (
        <div className="space-y-3 mb-5">
          <p className="text-pnc-gray-500 text-xs mb-4">
            Connect your business tools to give your banker a fuller picture of your finances.
          </p>
          {TPA_INTEGRATIONS.map(({ name, status, color, icon }) => (
            <div key={name} className="bg-white border border-pnc-gray-200 rounded-xl p-4 flex items-center gap-3">
              <span className="text-2xl">{icon}</span>
              <div className="flex-1">
                <p className="text-pnc-gray-900 text-sm font-semibold">{name}</p>
                <p className={`text-xs font-medium mt-0.5 ${
                  status === 'connected' ? 'text-green-600' : 'text-pnc-gray-400'
                }`}>
                  {status === 'connected' ? '● Connected' : '○ Not connected'}
                </p>
              </div>
              {status === 'connected' ? (
                <CheckCircle2 size={18} className="text-green-500 shrink-0" />
              ) : (
                <button className="text-pnc-orange text-xs font-semibold shrink-0 flex items-center gap-1">
                  <Link size={13} /> Connect
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {activeSection === 'docs' && (
        <div className="space-y-3 mb-5">
          <p className="text-pnc-gray-500 text-xs mb-4">
            Learn how to get the most from your PNC business account.
          </p>
          {DOCS.map(({ title, subtitle, icon: Icon }) => (
            <button
              key={title}
              className="w-full bg-white border border-pnc-gray-200 rounded-xl p-4 flex items-center gap-3 text-left active:bg-pnc-gray-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-pnc-navy/5 flex items-center justify-center shrink-0">
                <Icon size={18} className="text-pnc-navy" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-pnc-gray-900 text-sm font-semibold">{title}</p>
                <p className="text-pnc-gray-500 text-xs mt-0.5">{subtitle}</p>
              </div>
              <ChevronRight size={16} className="text-pnc-gray-400 shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* Logout */}
      <button
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 bg-white border border-red-200
                   text-red-600 text-sm font-semibold py-3 rounded-xl
                   active:bg-red-50 transition-colors"
      >
        <LogOut size={16} />
        Sign out
      </button>
    </div>
  )
}
