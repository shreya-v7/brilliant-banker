import { useLocation, useNavigate } from 'react-router-dom'
import { Home, MessageCircle, FileText, ClipboardList, User, Star } from 'lucide-react'
import { useEffectiveUserTestingMode } from '../hooks/useUserTestingMode'

const ALL_NAV_ITEMS = [
  { path: '/business', icon: Home, label: 'Home' },
  { path: '/business/chat', icon: MessageCircle, label: 'Chat' },
  { path: '/business/forms', icon: FileText, label: 'Forms' },
  { path: '/business/activity', icon: ClipboardList, label: 'Activity' },
  { path: '/business/profile', icon: User, label: 'Profile' },
  { path: '/business/feedback', icon: Star, label: 'Feedback' },
]

function navigateBusinessWithTesting(navigate, path, userTesting) {
  if (!userTesting || path.includes('testing=')) {
    navigate(path)
    return
  }
  const sep = path.includes('?') ? '&' : '?'
  navigate(`${path}${sep}testing=true`)
}

export default function BottomNav({ user }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const userTesting = useEffectiveUserTestingMode(user)

  const navItems = userTesting
    ? ALL_NAV_ITEMS
    : ALL_NAV_ITEMS.filter((i) => i.path !== '/business/feedback')

  return (
    <nav className="bg-white border-t border-pnc-gray-200 safe-bottom shrink-0">
      <div className="flex items-center justify-around h-16 gap-0.5 px-1">
        {navItems.map(({ path, icon: Icon, label }) => {
          const active = pathname === path
          return (
            <button
              key={path}
              type="button"
              onClick={() => navigateBusinessWithTesting(navigate, path, userTesting)}
              className={`flex flex-col items-center gap-0.5 flex-1 min-w-0 py-1 transition-colors ${
                active
                  ? 'text-pnc-orange'
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
