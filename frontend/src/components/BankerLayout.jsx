import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import BankerBottomNav from './BankerBottomNav'
import DemoGuide from './DemoGuide'
import { Sparkles } from 'lucide-react'

const TITLES = {
  '/banker': 'Dashboard',
  '/banker/clients': 'My Clients',
  '/banker/credit': 'Credit Review',
  '/banker/profile': 'My Profile',
}

export default function BankerLayout({ user, children }) {
  const { pathname } = useLocation()
  const title = TITLES[pathname] || 'Brilliant Banker'
  const hideHeader = pathname.startsWith('/banker/clients/')
  const [showDemo, setShowDemo] = useState(false)

  return (
    <div className="flex flex-col h-dvh max-w-md mx-auto bg-white shadow-xl relative">
      {!hideHeader && (
        <header className="bg-pnc-navy px-4 pt-3 pb-3 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-white text-lg font-semibold">{title}</h1>
            {pathname === '/banker' && (
              <p className="text-pnc-gray-200 text-xs mt-0.5">
                Welcome back, {user.name.split(' ')[0]}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-white/60 text-[10px]">PNC Banker</p>
              <p className="text-white text-xs font-semibold">{user.title}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-pnc-orange flex items-center justify-center">
              <span className="text-white text-sm font-bold">
                {user.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
          </div>
        </header>
      )}

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      <BankerBottomNav />

      {/* Floating demo button */}
      <button
        onClick={() => setShowDemo(true)}
        className="absolute bottom-20 right-4 flex items-center gap-1.5 bg-pnc-navy/90 backdrop-blur
                   text-white text-xs font-semibold px-3 py-2 rounded-full shadow-lg
                   active:opacity-80 transition-opacity z-40 border border-white/10"
      >
        <Sparkles size={13} className="text-pnc-orange" />
        Demo
      </button>

      {showDemo && (
        <DemoGuide userRole="banker" onClose={() => setShowDemo(false)} />
      )}
    </div>
  )
}
