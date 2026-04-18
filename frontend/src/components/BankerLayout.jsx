import { useState, useEffect, useRef, useMemo } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import RMStreamFeed from './RMStreamFeed'
import { Bell, Zap, Landmark, LayoutDashboard, Users, CreditCard, User, ChevronRight, Menu, X, Star } from 'lucide-react'
import { connectRMStream } from '../api'
import { useEffectiveUserTestingMode } from '../hooks/useUserTestingMode'
import { profileAllowsUserTesting } from '../constants/demo'

const ALL_BANKER_NAV = [
  { path: '/banker', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/banker/clients', icon: Users, label: 'Clients' },
  { path: '/banker/credit', icon: CreditCard, label: 'Credit Review' },
  { path: '/banker/feedback', icon: Star, label: 'Feedback' },
  { path: '/banker/profile', icon: User, label: 'My Profile' },
]

function navigateBankerWithTesting(navigate, path, userTesting) {
  if (!userTesting || path.includes('testing=')) {
    navigate(path)
    return
  }
  const sep = path.includes('?') ? '&' : '?'
  navigate(`${path}${sep}testing=true`)
}

export default function BankerLayout({ user, children }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const userTesting = useEffectiveUserTestingMode(user)

  const navItems = useMemo(
    () =>
      userTesting
        ? ALL_BANKER_NAV
        : ALL_BANKER_NAV.filter((i) => i.path !== '/banker/feedback'),
    [userTesting],
  )
  const [showFeed, setShowFeed] = useState(false)
  const [showMobileNav, setShowMobileNav] = useState(false)
  const [unread, setUnread] = useState(0)
  const [events, setEvents] = useState([])
  const [toast, setToast] = useState(null)
  const sourceRef = useRef(null)

  useEffect(() => {
    sourceRef.current = connectRMStream((event) => {
      setEvents(prev => [event, ...prev].slice(0, 50))
      if (!showFeed) setUnread(prev => prev + 1)

      setToast(event)
      setTimeout(() => setToast(null), 6000)
    })

    return () => {
      if (sourceRef.current) sourceRef.current.close()
    }
  }, [])

  const handleOpenFeed = () => {
    setShowFeed(true)
    setUnread(0)
  }

  const currentTitle =
    navItems.find((n) => n.path === pathname)?.label ||
    (pathname.startsWith('/banker/clients/') ? 'Client Profile' : 'Brilliant Banker')

  const surveyBack =
    profileAllowsUserTesting(user) &&
    typeof sessionStorage !== 'undefined' &&
    sessionStorage.getItem('bb-survey-active') === 'banker' &&
    !pathname.includes('/feedback')

  return (
    <div className="flex h-dvh bg-pnc-gray-50">
      {/* ─── SIDEBAR ──────────────────────────────────────── */}
      <aside className="hidden lg:flex w-64 bg-pnc-navy flex-col shrink-0">
        {/* Logo */}
        <div className="px-5 pt-6 pb-4 flex items-center gap-3 border-b border-white/10">
          <div className="w-9 h-9 rounded-lg bg-pnc-orange/20 flex items-center justify-center">
            <Landmark size={20} className="text-pnc-orange" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Brilliant Banker</p>
            <p className="text-white/40 text-[10px]">RM Portal</p>
          </div>
        </div>

        {/* RM identity */}
        <div className="px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-pnc-orange flex items-center justify-center shrink-0">
              <span className="text-white text-sm font-bold">
                {user.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">{user.name}</p>
              <p className="text-white/50 text-[11px] truncate">{user.title}</p>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ path, icon: Icon, label }) => {
            const active = pathname === path || (path !== '/banker' && pathname.startsWith(path + '/'))
            return (
              <button
                key={path}
                type="button"
                onClick={() => navigateBankerWithTesting(navigate, path, userTesting)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:bg-white/5 hover:text-white/80'
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            )
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="px-3 pb-5 space-y-2">
          <button
            onClick={handleOpenFeed}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                       text-white/50 hover:bg-white/5 hover:text-white/80 transition-all relative"
          >
            <Bell size={18} />
            Live Feed
            {unread > 0 && (
              <span className="ml-auto min-w-[20px] h-5 flex items-center justify-center
                               bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-pnc-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMobileNav(true)}
              className="lg:hidden w-8 h-8 rounded-lg bg-pnc-navy flex items-center justify-center mr-2"
            >
              <Menu size={16} className="text-pnc-orange" />
            </button>
            <div>
              <h1 className="text-pnc-gray-900 text-lg font-bold">{currentTitle}</h1>
              {pathname === '/banker' && (
                <p className="text-pnc-gray-500 text-xs">Welcome back, {user.name.split(' ')[0]}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Live feed bell */}
            <button
              onClick={handleOpenFeed}
              className="relative p-2 rounded-lg hover:bg-pnc-gray-100 transition-colors"
            >
              <Bell size={20} className="text-pnc-gray-700" />
              {unread > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 flex items-center justify-center
                                 bg-red-500 text-white text-[9px] font-bold rounded-full px-1">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>

            {/* RM avatar */}
            <div className="hidden sm:flex items-center gap-2.5 pl-4 border-l border-pnc-gray-200">
              <div className="w-8 h-8 rounded-full bg-pnc-navy flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div className="hidden md:block">
                <p className="text-pnc-gray-900 text-xs font-semibold">{user.name}</p>
                <p className="text-pnc-gray-500 text-[10px]">{user.region}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>

        {/* Mobile bottom nav (only shown on small screens) */}
        <nav className="lg:hidden bg-white border-t border-pnc-gray-200 safe-bottom shrink-0">
          <div className="flex items-center justify-around h-14">
            {navItems.map(({ path, icon: Icon, label }) => {
              const active = pathname === path
              return (
                <button
                  key={path}
                  type="button"
                  onClick={() => navigateBankerWithTesting(navigate, path, userTesting)}
                  className={`flex flex-col items-center gap-0.5 w-16 py-1 transition-colors ${
                    active ? 'text-pnc-navy' : 'text-pnc-gray-500'
                  }`}
                >
                  <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                  <span className={`text-[9px] ${active ? 'font-semibold' : 'font-medium'}`}>
                    {label.split(' ')[0]}
                  </span>
                </button>
              )
            })}
          </div>
        </nav>
      </div>

      {/* Mobile nav drawer */}
      {showMobileNav && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowMobileNav(false)} />
          <aside className="relative w-72 h-full bg-pnc-navy flex flex-col animate-fade-up">
            <div className="px-5 pt-6 pb-4 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-pnc-orange/20 flex items-center justify-center">
                  <Landmark size={20} className="text-pnc-orange" />
                </div>
                <p className="text-white font-bold text-sm">Brilliant Banker</p>
              </div>
              <button onClick={() => setShowMobileNav(false)} className="text-white/50">
                <X size={20} />
              </button>
            </div>
            <div className="px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-pnc-orange flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{user.name}</p>
                  <p className="text-white/50 text-[11px] truncate">{user.title}</p>
                </div>
              </div>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {navItems.map(({ path, icon: Icon, label }) => {
                const active = pathname === path || (path !== '/banker' && pathname.startsWith(path + '/'))
                return (
                  <button
                    key={path}
                    type="button"
                    onClick={() => {
                      navigateBankerWithTesting(navigate, path, userTesting)
                      setShowMobileNav(false)
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      active ? 'bg-white/10 text-white' : 'text-white/50'
                    }`}
                  >
                    <Icon size={18} />
                    {label}
                  </button>
                )
              })}
            </nav>
            <div className="px-3 pb-5 space-y-2">
              <button
                onClick={() => { handleOpenFeed(); setShowMobileNav(false) }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/50"
              >
                <Bell size={18} />
                Live Feed
                {unread > 0 && (
                  <span className="ml-auto min-w-[20px] h-5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Toast notification */}
      {toast && !showFeed && (
        <div
          className="fixed top-4 right-4 z-50 w-96 animate-fade-up cursor-pointer"
          onClick={handleOpenFeed}
        >
          <div className={`rounded-xl p-4 shadow-xl border flex items-start gap-3 ${
            toast.urgency === 'high'
              ? 'bg-red-50 border-red-200'
              : toast.event_type === 'decision'
              ? 'bg-green-50 border-green-200'
              : 'bg-blue-50 border-blue-200'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              toast.urgency === 'high' ? 'bg-red-100' : 'bg-blue-100'
            }`}>
              <Zap size={14} className={toast.urgency === 'high' ? 'text-red-600' : 'text-blue-600'} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-[10px] font-semibold uppercase tracking-wide ${
                toast.urgency === 'high' ? 'text-red-600' : 'text-blue-600'
              }`}>
                {toast.event_type === 'decision' ? 'Decision Recorded' : 'Client Activity'}
              </p>
              <p className="text-pnc-gray-900 text-sm font-semibold mt-0.5">{toast.smb_name}</p>
              <p className="text-pnc-gray-600 text-xs leading-relaxed mt-0.5 line-clamp-2">
                {toast.highlight || toast.notification_text || toast.reason}
              </p>
            </div>
            <ChevronRight size={16} className="text-pnc-gray-400 shrink-0 mt-1" />
          </div>
        </div>
      )}

      {surveyBack && (
        <Link
          to="/banker/feedback?testing=true"
          className="fixed z-[55] left-1/2 -translate-x-1/2 bottom-20 min-h-[44px] px-5 py-2.5 rounded-full text-white text-sm font-bold shadow-lg lg:left-auto lg:translate-x-0 lg:right-8 lg:bottom-8"
          style={{ backgroundColor: '#002D5F' }}
        >
          Back to Survey
        </Link>
      )}

      <RMStreamFeed isOpen={showFeed} onClose={() => setShowFeed(false)} events={events} />
    </div>
  )
}
