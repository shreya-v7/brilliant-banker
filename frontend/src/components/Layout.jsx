import { useLocation } from 'react-router-dom'
import BottomNav from './BottomNav'

const TITLES = {
  '/business': 'Home',
  '/business/chat': 'Brilliant Banker',
  '/business/forms': 'Forms',
  '/business/activity': 'Activity',
  '/business/profile': 'Profile',
}

export default function Layout({ user, children }) {
  const { pathname } = useLocation()
  const title = TITLES[pathname] || 'Brilliant Banker'
  const hideHeader = pathname === '/business/chat'

  return (
    <div className="h-dvh flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
      <div className="relative w-full sm:w-[390px] h-full sm:h-[844px] sm:rounded-[2.5rem] sm:shadow-2xl
                      sm:border-[6px] sm:border-slate-800 overflow-hidden bg-white flex flex-col">
        <div className="hidden sm:flex items-center justify-center pt-2 pb-0 bg-pnc-navy">
          <div className="w-28 h-5 bg-black rounded-full" />
        </div>

        {!hideHeader && (
          <header className="bg-pnc-navy px-4 pt-3 pb-3 flex items-center justify-between shrink-0">
            <div>
              <h1 className="text-white text-lg font-semibold">{title}</h1>
              {pathname === '/business' && (
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
      </div>
    </div>
  )
}
