import { useState, useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getUsers, getBankers, login, bankerLogin } from '../api'
import {
  SARAH_BANKER_ID,
  isWalkthroughSmb,
  isWalkthroughBanker,
} from '../constants/demo'
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

export default function Login({ view = 'home', onLogin, onShowMarketing, onShowScene, signedInUser }) {
  const [searchParams] = useSearchParams()
  const walkthroughEntry =
    searchParams.get('walkthrough') === '1' || searchParams.get('walkthrough') === 'true'
  const walkthroughBankerEntry = walkthroughEntry
  const [users, setUsers] = useState([])
  const [bankers, setBankers] = useState([])
  const [loading, setLoading] = useState(true)
  const [loggingIn, setLoggingIn] = useState(null)
  const [error, setError] = useState(null)
  const [signInHint, setSignInHint] = useState(false)

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

  const smbPickList = useMemo(() => {
    if (!users.length) return []
    if (walkthroughEntry) return users.filter((u) => isWalkthroughSmb(u.smb_id))
    return users.filter((u) => !isWalkthroughSmb(u.smb_id))
  }, [users, walkthroughEntry])

  const bankerPickList = useMemo(() => {
    if (!bankers.length) return []
    if (walkthroughBankerEntry) return bankers.filter((b) => b.banker_id === SARAH_BANKER_ID)
    return bankers.filter((b) => !isWalkthroughBanker(b.banker_id))
  }, [bankers, walkthroughBankerEntry])

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

  if (view === 'home') {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-pnc-navy via-pnc-navy to-pnc-navy-light flex flex-col">
        <div className="flex items-center justify-between px-6 pt-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-pnc-orange/20 flex items-center justify-center">
              <Landmark size={20} className="text-pnc-orange" />
            </div>
            <span className="text-white font-bold text-base">Brilliant Banker</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/scene"
              className="text-amber-400/80 text-sm font-medium hover:text-amber-400 transition-colors flex items-center gap-1"
            >
              Watch scene
              <ChevronRight size={14} />
            </Link>
            <Link
              to="/marketing"
              className="text-white/60 text-sm font-medium hover:text-white transition-colors flex items-center gap-1"
            >
              Learn more
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>

        {signedInUser && (
          <div className="mx-6 mt-4 bg-white/10 border border-white/15 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-white/70 text-sm">
              Signed in as <span className="text-white font-semibold">{signedInUser.name}</span>
            </p>
            <Link
              to={signedInUser.role === 'banker' ? '/banker' : '/business'}
              className="text-pnc-orange text-sm font-semibold hover:underline"
            >
              Continue to app →
            </Link>
          </div>
        )}

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <p className="text-pnc-orange text-xs font-bold tracking-widest mb-4">AI-POWERED SMB BANKING</p>
          <h1 className="text-white text-3xl sm:text-4xl font-black text-center leading-tight max-w-lg">
            Choose your experience
          </h1>
          <p className="text-white/50 text-sm mt-3 text-center max-w-md">
            Each option has its own URL so browser back and bookmarks work correctly.
          </p>

          <div className="mt-8 w-full max-w-md flex flex-col gap-3">
            <Link
              to="/signin/smb?walkthrough=1"
              className="w-full min-h-[48px] flex items-center justify-center rounded-2xl border-2 border-white/35 text-white font-semibold text-sm hover:bg-white/10 transition-colors"
            >
              Walkthrough / Demo (Maya & Priya)
            </Link>
            <Link
              to="/signin/banker?walkthrough=1"
              className="w-full min-h-[48px] flex items-center justify-center rounded-2xl border-2 border-white/25 text-white/90 font-semibold text-sm hover:bg-white/10 transition-colors"
            >
              Walkthrough RM (Sarah Chen)
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mt-10 w-full max-w-2xl">
            <Link
              to="/signin/smb"
              className="group bg-white/5 border border-white/10 rounded-2xl p-6 text-left
                         hover:bg-white/10 hover:border-pnc-orange/40 transition-all block"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-pnc-orange/20 flex items-center justify-center">
                  <Smartphone size={24} className="text-pnc-orange" />
                </div>
                <div>
                  <h2 className="text-white text-lg font-bold">Business Owner</h2>
                  <p className="text-white/40 text-xs">/signin/smb</p>
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
              <div className="flex items-center gap-2 text-pnc-orange text-sm font-semibold group-hover:gap-3 transition-all">
                Open mobile sign-in
                <ChevronRight size={16} />
              </div>
            </Link>

            <Link
              to="/signin/banker"
              className="group bg-white/5 border border-white/10 rounded-2xl p-6 text-left
                         hover:bg-white/10 hover:border-white/30 transition-all block"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                  <Monitor size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-white text-lg font-bold">PNC Banker (RM)</h2>
                  <p className="text-white/40 text-xs">/signin/banker</p>
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
              <div className="flex items-center gap-2 text-white text-sm font-semibold group-hover:gap-3 transition-all">
                Open RM sign-in
                <ChevronRight size={16} />
              </div>
            </Link>
          </div>
        </div>

        <div className="text-center pb-6 space-y-2">
          <Link
            to="/links"
            className="block text-pnc-orange/80 hover:text-pnc-orange text-xs font-medium transition-colors"
          >
            All screen URLs
          </Link>
          <p className="text-white/20 text-xs">CSL Innovation Lab Prototype</p>
        </div>
      </div>
    )
  }

  if (view === 'smb') {
    return (
      <div className="h-dvh flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
        <div className="relative w-full sm:w-[390px] h-full sm:h-[844px] sm:rounded-[2.5rem] sm:shadow-2xl
                        sm:border-[6px] sm:border-slate-800 overflow-hidden bg-pnc-navy flex flex-col">
          <div className="hidden sm:flex items-center justify-center pt-2 bg-pnc-navy shrink-0">
            <div className="w-28 h-5 bg-black rounded-full" />
          </div>

          <div className="flex flex-col items-center px-6 pt-6 pb-3 shrink-0">
            <Link
              to="/"
              className="self-start text-white/50 flex items-center gap-1 text-sm mb-4 hover:text-white transition-colors"
            >
              <ArrowLeft size={16} />
              Home
            </Link>
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-3">
              <Landmark size={24} className="text-pnc-orange" />
            </div>
            <h1 className="text-white text-lg font-bold">Brilliant Banker</h1>
            <p className="text-white/50 text-[11px] mt-0.5">Mobile Banking App · /signin/smb</p>
          </div>

          <div className="bg-white rounded-t-3xl flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-5 pt-5 pb-6">
              <h2 className="text-pnc-gray-900 text-base font-semibold mb-1">Sign In</h2>
              <p className="text-pnc-gray-500 text-xs mb-3">Choose a demo profile to enter the app</p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-3">
                  {error}
                </div>
              )}

              <div className="space-y-2.5 mb-4">
                <div>
                  <label className="text-pnc-gray-700 text-[11px] font-medium mb-1 block">Username</label>
                  <input
                    type="text"
                    placeholder="Enter username"
                    className="w-full bg-pnc-gray-50 border border-pnc-gray-200 rounded-xl px-3.5 py-2.5 text-sm
                               text-pnc-gray-900 placeholder-pnc-gray-400 outline-none
                               focus:border-pnc-orange/50 focus:ring-2 focus:ring-pnc-orange/10 transition-all"
                  />
                </div>
                <div>
                  <label className="text-pnc-gray-700 text-[11px] font-medium mb-1 block">Password</label>
                  <input
                    type="password"
                    placeholder="Enter password"
                    className="w-full bg-pnc-gray-50 border border-pnc-gray-200 rounded-xl px-3.5 py-2.5 text-sm
                               text-pnc-gray-900 placeholder-pnc-gray-400 outline-none
                               focus:border-pnc-orange/50 focus:ring-2 focus:ring-pnc-orange/10 transition-all"
                  />
                </div>
                <button
                  onClick={() => setSignInHint(true)}
                  className="w-full bg-pnc-navy text-white text-sm font-semibold py-2.5 rounded-xl active:opacity-80 transition-opacity"
                >
                  Sign In
                </button>
                {signInHint && (
                  <p className="text-pnc-orange text-[10px] text-center mt-1 animate-fade-up">
                    This is a demo — select a profile below to get started
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-pnc-gray-200" />
                <span className="text-pnc-gray-400 text-[10px] font-medium uppercase tracking-wider">Demo Profiles</span>
                <div className="flex-1 h-px bg-pnc-gray-200" />
              </div>

              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-14 bg-pnc-gray-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {smbPickList.map((u) => {
                    const isSkitActorRow = walkthroughEntry && isWalkthroughSmb(u.smb_id)
                    return (
                      <button
                        key={u.smb_id}
                        onClick={() => handleSMBLogin(u.smb_id)}
                        disabled={loggingIn !== null}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border
                                   hover:border-pnc-orange/40 hover:bg-pnc-orange/[0.03] active:bg-pnc-orange/[0.06]
                                   transition-all text-left disabled:opacity-50
                                   ${isSkitActorRow ? 'border-amber-300 bg-amber-50/30' : 'border-pnc-gray-200'}`}
                      >
                        <div className="w-10 h-10 rounded-full bg-pnc-navy/5 flex items-center justify-center shrink-0">
                          <Building2 size={18} className="text-pnc-navy" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-pnc-gray-900 text-sm font-semibold truncate">{u.name}</p>
                            {isSkitActorRow && (
                              <span className="text-[9px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full shrink-0">
                                SKIT
                              </span>
                            )}
                          </div>
                          <p className="text-pnc-gray-500 text-[11px] mt-0.5">{u.business_type}</p>
                        </div>
                        {loggingIn === u.smb_id ? (
                          <div className="w-5 h-5 border-2 border-pnc-orange border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <ChevronRight size={16} className="text-pnc-gray-400 shrink-0" />
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-pnc-gray-50 flex flex-col">
      <header className="bg-pnc-navy px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-white/50 p-1 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-pnc-orange/20 flex items-center justify-center">
              <Landmark size={16} className="text-pnc-orange" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Brilliant Banker</p>
              <p className="text-white/40 text-[10px]">/signin/banker</p>
            </div>
          </div>
        </div>
        <Link to="/" className="text-white/50 text-sm hover:text-white transition-colors">
          Home
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-pnc-navy/10 flex items-center justify-center mx-auto mb-4">
              <Monitor size={32} className="text-pnc-navy" />
            </div>
            <h1 className="text-pnc-gray-900 text-2xl font-black">RM Portal Login</h1>
            <p className="text-pnc-gray-500 text-sm mt-2">Choose a demo profile to enter the portal</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <div className="bg-white border border-pnc-gray-200 rounded-2xl p-5 mb-5">
            <div className="space-y-3">
              <div>
                <label className="text-pnc-gray-700 text-xs font-medium mb-1 block">Username</label>
                <input
                  type="text"
                  placeholder="Enter employee ID"
                  className="w-full bg-pnc-gray-50 border border-pnc-gray-200 rounded-xl px-3.5 py-2.5 text-sm
                             text-pnc-gray-900 placeholder-pnc-gray-400 outline-none
                             focus:border-pnc-navy/50 focus:ring-2 focus:ring-pnc-navy/10 transition-all"
                />
              </div>
              <div>
                <label className="text-pnc-gray-700 text-xs font-medium mb-1 block">Password</label>
                <input
                  type="password"
                  placeholder="Enter password"
                  className="w-full bg-pnc-gray-50 border border-pnc-gray-200 rounded-xl px-3.5 py-2.5 text-sm
                             text-pnc-gray-900 placeholder-pnc-gray-400 outline-none
                             focus:border-pnc-navy/50 focus:ring-2 focus:ring-pnc-navy/10 transition-all"
                />
              </div>
              <button
                onClick={() => setSignInHint(true)}
                className="w-full bg-pnc-navy text-white text-sm font-semibold py-2.5 rounded-xl active:opacity-80 transition-opacity"
              >
                Sign In
              </button>
              {signInHint && (
                <p className="text-pnc-orange text-[10px] text-center mt-1 animate-fade-up">
                  This is a demo — select a profile below to get started
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-pnc-gray-200" />
            <span className="text-pnc-gray-400 text-[10px] font-medium uppercase tracking-wider">Demo Profiles</span>
            <div className="flex-1 h-px bg-pnc-gray-200" />
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-white rounded-xl animate-pulse border border-pnc-gray-200" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {bankerPickList.map((b) => (
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
