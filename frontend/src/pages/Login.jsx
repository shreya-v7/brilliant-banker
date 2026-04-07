import { useState, useEffect } from 'react'
import { getUsers, getBankers, login, bankerLogin } from '../api'
import { Building2, ChevronRight, Landmark, Briefcase } from 'lucide-react'

export default function Login({ onLogin }) {
  const [tab, setTab] = useState('smb') // 'smb' | 'banker'
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

  return (
    <div className="min-h-dvh bg-pnc-navy flex flex-col max-w-md mx-auto">
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8">
        <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
          <Landmark size={40} className="text-pnc-orange" />
        </div>
        <h1 className="text-white text-2xl font-bold tracking-tight">Brilliant Banker</h1>
        <p className="text-pnc-gray-200 text-sm mt-2 text-center">
          AI-powered banking for small business
        </p>
      </div>

      <div className="bg-white rounded-t-3xl px-5 pt-6 pb-8 safe-bottom">
        {/* Tab switcher */}
        <div className="flex bg-pnc-gray-100 rounded-xl p-1 mb-5">
          <button
            onClick={() => { setTab('smb'); setError(null) }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              tab === 'smb'
                ? 'bg-white text-pnc-navy shadow-sm'
                : 'text-pnc-gray-500'
            }`}
          >
            <Building2 size={14} />
            Business Owner
          </button>
          <button
            onClick={() => { setTab('banker'); setError(null) }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              tab === 'banker'
                ? 'bg-white text-pnc-navy shadow-sm'
                : 'text-pnc-gray-500'
            }`}
          >
            <Briefcase size={14} />
            PNC Banker
          </button>
        </div>

        <h2 className="text-pnc-gray-900 text-base font-semibold mb-1">
          {tab === 'smb' ? 'Sign in as demo business' : 'Sign in as demo banker'}
        </h2>
        <p className="text-pnc-gray-500 text-xs mb-5">
          {tab === 'smb'
            ? 'Select a business profile to continue'
            : 'Select a banker profile to continue'}
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-18 bg-pnc-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : tab === 'smb' ? (
          <div className="space-y-2.5">
            {users.map((u) => (
              <button
                key={u.smb_id}
                onClick={() => handleSMBLogin(u.smb_id)}
                disabled={loggingIn !== null}
                className="w-full flex items-center gap-3.5 p-3.5 rounded-xl border border-pnc-gray-200
                           hover:border-pnc-orange/40 hover:bg-pnc-orange/[0.03] active:bg-pnc-orange/[0.06]
                           transition-all text-left disabled:opacity-50"
              >
                <div className="w-11 h-11 rounded-full bg-pnc-navy/5 flex items-center justify-center shrink-0">
                  <Building2 size={20} className="text-pnc-navy" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-pnc-gray-900 text-sm font-semibold truncate">{u.name}</p>
                  <p className="text-pnc-gray-500 text-xs mt-0.5">
                    {u.business_type} &middot; {fmtRevenue(u.annual_revenue)} revenue
                  </p>
                </div>
                {loggingIn === u.smb_id ? (
                  <div className="w-5 h-5 border-2 border-pnc-orange border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ChevronRight size={18} className="text-pnc-gray-500 shrink-0" />
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-2.5">
            {bankers.map((b) => (
              <button
                key={b.banker_id}
                onClick={() => handleBankerLogin(b.banker_id)}
                disabled={loggingIn !== null}
                className="w-full flex items-center gap-3.5 p-3.5 rounded-xl border border-pnc-gray-200
                           hover:border-pnc-navy/30 hover:bg-pnc-navy/[0.02] active:bg-pnc-navy/[0.05]
                           transition-all text-left disabled:opacity-50"
              >
                <div className="w-11 h-11 rounded-full bg-pnc-navy flex items-center justify-center shrink-0">
                  <span className="text-white text-sm font-bold">
                    {b.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-pnc-gray-900 text-sm font-semibold truncate">{b.name}</p>
                  <p className="text-pnc-gray-500 text-xs mt-0.5">
                    {b.title} &middot; {b.region}
                  </p>
                </div>
                {loggingIn === b.banker_id ? (
                  <div className="w-5 h-5 border-2 border-pnc-navy border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ChevronRight size={18} className="text-pnc-gray-500 shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
