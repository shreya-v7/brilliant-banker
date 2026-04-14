import { useState, useEffect } from 'react'
import { getUsers, getBankers, login, bankerLogin } from '../api'
import {
  Building2,
  ChevronRight,
  Landmark,
  Briefcase,
  Smartphone,
  Monitor,
  ArrowLeft,
  Bot,
  Zap,
  CreditCard,
  BarChart3,
} from 'lucide-react'

export default function Login({ onLogin, onShowMarketing }) {
  const [mode, setMode] = useState(null) // null | 'smb' | 'banker'
  const [users, setUsers] = useState([])
  const [bankers, setBankers] = useState([])
  const [loading, setLoading] = useState(true)
  const [loggingIn, setLoggingIn] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([
      getUsers().catch(() => []),
      getBankers().catch(() => []),
    ]).then(([smbs, bkrs]) => {
      setUsers(smbs)
      setBankers(bkrs)
    }).catch(() => setError('Could not connect to server. Is the backend running?'))
      .finally(() => setLoading(false))
  }, [])

  const handleSMBLogin = async (smbId) => {
    setLoggingIn(smbId)
    setError(null)
    try {
      const user = await login(smbId)
      onLogin({ ...user, role: 'smb' })
    } catch {
      setError('Login failed')
      setLoggingIn(null)
    }
  }

  const handleBankerLogin = async (bankerId) => {
    setLoggingIn(bankerId)
    setError(null)
    try {
      const banker = await bankerLogin(bankerId)
      onLogin({ ...banker, role: 'banker' })
    } catch {
      setError('Login failed')
      setLoggingIn(null)
    }
  }

  const fmtRevenue = (n) =>
    n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(1)}M`
      : `$${(n / 1_000).toFixed(0)}K`

  // ── ROLE PICKER (landing) ─────────────────────────────────
  if (!mode) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-pnc-navy via-pnc-navy to-pnc-navy-light flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-pnc-orange/20 flex items-center justify-center">
              <Landmark size={20} className="text-pnc-orange" />
            </div>
            <span className="text-white font-bold text-base">Brilliant Banker</span>
          </div>
          {onShowMarketing && (
            <button
              onClick={onShowMarketing}
              className="text-white/60 text-sm font-medium hover:text-white transition-colors flex items-center gap-1"
            >
              Learn more
              <ChevronRight size={14} />
            </button>
          )}
        </div>

        {/* Center content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <p className="text-pnc-orange text-xs font-bold tracking-widest mb-4">AI-POWERED SMB BANKING</p>
          <h1 className="text-white text-3xl sm:text-4xl font-black text-center leading-tight max-w-lg">
            Choose your experience
          </h1>
          <p className="text-white/50 text-sm mt-3 text-center max-w-md">
            Two sides of the same platform. The SMB app runs as a mobile experience.
            The RM portal runs as a full desktop dashboard.
          </p>
          <div className="mt-5 bg-pnc-orange/15 border border-pnc-orange/30 rounded-xl px-4 py-2.5 max-w-md">
            <p className="text-pnc-orange text-xs font-semibold text-center">
              Start with Business Owner, then try PNC Banker to see the full workflow
            </p>
          </div>

          {/* Two cards */}
          <div className="grid sm:grid-cols-2 gap-4 mt-10 w-full max-w-2xl">
            {/* SMB Card */}
            <button
              onClick={() => setMode('smb')}
              className="group bg-white/5 border border-white/10 rounded-2xl p-6 text-left
                         hover:bg-white/10 hover:border-pnc-orange/40 transition-all"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-pnc-orange/20 flex items-center justify-center">
                  <Smartphone size={24} className="text-pnc-orange" />
                </div>
                <div>
                  <h2 className="text-white text-lg font-bold">Business Owner</h2>
                  <p className="text-white/40 text-xs">Mobile App Experience</p>
                </div>
              </div>
              <div className="space-y-2.5 mb-5">
                {[
                  { icon: Bot, text: 'Chat with AI banking assistant' },
                  { icon: CreditCard, text: 'Instant credit pre-qualification' },
                  { icon: BarChart3, text: 'Cash flow forecasting' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <item.icon size={14} className="text-pnc-orange shrink-0" />
                    <span className="text-white/60 text-sm">{item.text}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 text-pnc-orange text-sm font-semibold
                              group-hover:gap-3 transition-all">
                Open mobile app
                <ChevronRight size={16} />
              </div>
            </button>

            {/* Banker Card */}
            <button
              onClick={() => setMode('banker')}
              className="group bg-white/5 border border-white/10 rounded-2xl p-6 text-left
                         hover:bg-white/10 hover:border-white/30 transition-all"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                  <Monitor size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-white text-lg font-bold">PNC Banker (RM)</h2>
                  <p className="text-white/40 text-xs">Desktop Portal</p>
                </div>
              </div>
              <div className="space-y-2.5 mb-5">
                {[
                  { icon: Zap, text: 'Real-time client activity stream' },
                  { icon: CreditCard, text: 'Credit review & decisions' },
                  { icon: Briefcase, text: 'Portfolio management & briefs' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <item.icon size={14} className="text-white/60 shrink-0" />
                    <span className="text-white/60 text-sm">{item.text}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 text-white text-sm font-semibold
                              group-hover:gap-3 transition-all">
                Open RM portal
                <ChevronRight size={16} />
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pb-6">
          <p className="text-white/20 text-xs">CSL Innovation Lab Prototype</p>
        </div>
      </div>
    )
  }

  // ── SMB LOGIN ─────────────────────────────────────────────
  if (mode === 'smb') {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
        <div className="w-full sm:w-[390px] sm:min-h-[700px] sm:rounded-[2.5rem] sm:shadow-2xl
                        sm:border-[6px] sm:border-slate-800 overflow-hidden bg-pnc-navy flex flex-col">
          {/* Phone notch */}
          <div className="hidden sm:flex items-center justify-center pt-2 bg-pnc-navy">
            <div className="w-28 h-5 bg-black rounded-full" />
          </div>

          <div className="flex-1 flex flex-col">
            <div className="flex-1 flex flex-col items-center justify-center px-6 pt-10 pb-6">
              <button
                onClick={() => setMode(null)}
                className="self-start text-white/50 flex items-center gap-1 text-sm mb-8
                           hover:text-white transition-colors"
              >
                <ArrowLeft size={16} />
                Back
              </button>
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-5">
                <Landmark size={32} className="text-pnc-orange" />
              </div>
              <h1 className="text-white text-xl font-bold">Brilliant Banker</h1>
              <p className="text-white/50 text-xs mt-1.5">Mobile Banking App</p>
            </div>

            <div className="bg-white rounded-t-3xl px-5 pt-5 pb-6">
              <h2 className="text-pnc-gray-900 text-base font-semibold mb-1">Sign in as demo business</h2>
              <p className="text-pnc-gray-500 text-xs mb-4">Select a business profile to continue</p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-3">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-pnc-gray-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {users.map((u) => (
                    <button
                      key={u.smb_id}
                      onClick={() => handleSMBLogin(u.smb_id)}
                      disabled={loggingIn !== null}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-pnc-gray-200
                                 hover:border-pnc-orange/40 hover:bg-pnc-orange/[0.03] active:bg-pnc-orange/[0.06]
                                 transition-all text-left disabled:opacity-50"
                    >
                      <div className="w-10 h-10 rounded-full bg-pnc-navy/5 flex items-center justify-center shrink-0">
                        <Building2 size={18} className="text-pnc-navy" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-pnc-gray-900 text-sm font-semibold truncate">{u.name}</p>
                        <p className="text-pnc-gray-500 text-[11px] mt-0.5">
                          {u.business_type} &middot; {fmtRevenue(u.annual_revenue)}
                        </p>
                      </div>
                      {loggingIn === u.smb_id ? (
                        <div className="w-5 h-5 border-2 border-pnc-orange border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <ChevronRight size={16} className="text-pnc-gray-400 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── BANKER LOGIN ──────────────────────────────────────────
  return (
    <div className="min-h-dvh bg-pnc-gray-50 flex flex-col">
      {/* Top bar */}
      <header className="bg-pnc-navy px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMode(null)}
            className="text-white/50 p-1 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-pnc-orange/20 flex items-center justify-center">
              <Landmark size={16} className="text-pnc-orange" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Brilliant Banker</p>
              <p className="text-white/40 text-[10px]">RM Portal</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-pnc-navy/10 flex items-center justify-center mx-auto mb-4">
              <Monitor size={32} className="text-pnc-navy" />
            </div>
            <h1 className="text-pnc-gray-900 text-2xl font-black">RM Portal Login</h1>
            <p className="text-pnc-gray-500 text-sm mt-2">
              Select your profile to access the Relationship Manager dashboard
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-white rounded-xl animate-pulse border border-pnc-gray-200" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {bankers.map((b) => (
                <button
                  key={b.banker_id}
                  onClick={() => handleBankerLogin(b.banker_id)}
                  disabled={loggingIn !== null}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-white border border-pnc-gray-200
                             hover:border-pnc-navy/30 hover:shadow-md active:bg-pnc-gray-50
                             transition-all text-left disabled:opacity-50"
                >
                  <div className="w-12 h-12 rounded-full bg-pnc-navy flex items-center justify-center shrink-0">
                    <span className="text-white text-sm font-bold">
                      {b.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-pnc-gray-900 text-base font-semibold truncate">{b.name}</p>
                    <p className="text-pnc-gray-500 text-sm mt-0.5">
                      {b.title} &middot; {b.region}
                    </p>
                  </div>
                  {loggingIn === b.banker_id ? (
                    <div className="w-5 h-5 border-2 border-pnc-navy border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ChevronRight size={18} className="text-pnc-gray-400 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
