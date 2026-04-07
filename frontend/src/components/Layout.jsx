import { useLocation } from 'react-router-dom'
import BottomNav from './BottomNav'

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

  return (
    <div className="flex flex-col h-dvh max-w-md mx-auto bg-white shadow-xl">
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
    </div>
  )
}
