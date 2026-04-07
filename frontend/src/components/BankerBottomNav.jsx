import { useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, CreditCard, User } from 'lucide-react'

const NAV_ITEMS = [
  { path: '/banker', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/banker/clients', icon: Users, label: 'Clients' },
  { path: '/banker/credit', icon: CreditCard, label: 'Credit' },
  { path: '/banker/profile', icon: User, label: 'Profile' },
]

export default function BankerBottomNav() {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="bg-white border-t border-pnc-gray-200 safe-bottom shrink-0">
      <div className="flex items-center justify-around h-16">
        {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
          const active = pathname === path
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-0.5 w-16 py-1 transition-colors ${
                active
                  ? 'text-pnc-navy'
                  : 'text-pnc-gray-500 active:text-pnc-gray-700'
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
              <span className={`text-[10px] ${active ? 'font-semibold' : 'font-medium'}`}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
