import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import BottomNav from './BottomNav'
import DemoGuide from './DemoGuide'
import { Sparkles } from 'lucide-react'

const TITLES = {
  '/': 'Home',
  '/chat': 'Brilliant Banker',
  '/activity': 'Activity',
  '/profile': 'Profile',
}

export default function Layout({ user, children }) {
  const { pathname } = useLocation()
  const title = TITLES[pathname] || 'Brilliant Banker'
  const hideHeader = pathname === '/chat'
  const [showDemo, setShowDemo] = useState(false)

  return (
    <div className="h-dvh flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
      {/* Phone frame — centered on desktop, full-screen on mobile */}
      <div className="relative w-full sm:w-[390px] h-full sm:h-[844px] sm:rounded-[2.5rem] sm:shadow-2xl
                      sm:border-[6px] sm:border-slate-800 overflow-hidden bg-white flex flex-col">
        {/* Notch bar (only visible in phone frame on desktop) */}
        <div className="hidden sm:flex items-center justify-center pt-2 pb-0 bg-pnc-navy">
          <div className="w-28 h-5 bg-black rounded-full" />
        </div>

        {!hideHeader && (
          <header className="bg-pnc-navy px-4 pt-3 pb-3 flex items-center justify-between shrink-0">
            <div>
              <h1 className="text-white text-lg font-semibold">{title}</h1>
              {pathname === '/' && (
                <p className="text-pnc-gray-200 text-xs mt-0.5">
                  Welcome, {user.name.split(' ')[0]}
                </p>
              )}
            </div>
            <div className="w-9 h-9 rounded-full bg-pnc-orange flex items-center justify-center">
              <span className="text-white text-sm font-bold">
                {user.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
          </header>
        )}

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

        <BottomNav />

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
          <DemoGuide userRole="smb" onClose={() => setShowDemo(false)} />
        )}
      </div>
    </div>
  )
}
