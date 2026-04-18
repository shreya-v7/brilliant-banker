import { useState, useEffect } from 'react'
import {
  Briefcase,
  MapPin,
  Hash,
  TrendingUp,
  Users,
  CreditCard,
  CheckCircle2,
  LogOut,
} from 'lucide-react'
import { getLeads, getBankerPortfolio } from '../../api'

function fmt(n) {
  if (n == null) return '--'
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  return `$${(n / 1_000).toFixed(0)}K`
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white border border-pnc-gray-200 rounded-xl p-3.5">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon size={14} className={color} />
        <span className="text-pnc-gray-500 text-[11px] font-medium">{label}</span>
      </div>
      <p className="text-pnc-gray-900 text-base font-bold">{value}</p>
    </div>
  )
}

export default function BankerProfile({ user, onLogout }) {
  const [leads, setLeads] = useState([])
  const [portfolio, setPortfolio] = useState(null)

  useEffect(() => {
    const bid = user?.banker_id
    Promise.all([
      getLeads(undefined, bid).catch(() => []),
      getBankerPortfolio(bid).catch(() => null),
    ]).then(([l, p]) => {
      setLeads(l)
      setPortfolio(p)
    })
  }, [user?.banker_id])

  const approved = leads.filter(l => l.status === 'approved').length
  const pending = leads.filter(l => l.status === 'pending').length
  const totalClients = portfolio?.smbs?.length ?? 0
  const totalRevenue = portfolio?.smbs?.reduce((s, c) => s + c.annual_revenue, 0) ?? 0

  return (
    <div className="px-4 py-4 pb-8">
      {/* Profile header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-pnc-navy flex items-center justify-center">
          <span className="text-white text-xl font-bold">
            {user.name.split(' ').map(n => n[0]).join('')}
          </span>
        </div>
        <div>
          <h2 className="text-pnc-gray-900 text-lg font-bold">{user.name}</h2>
          <p className="text-pnc-gray-500 text-sm">{user.title}</p>
        </div>
      </div>

      {/* Banker details */}
      <div className="bg-white border border-pnc-gray-200 rounded-2xl divide-y divide-pnc-gray-100 mb-5">
        <div className="flex items-center gap-3 px-4 py-3">
          <Briefcase size={16} className="text-pnc-gray-400 shrink-0" />
          <div>
            <p className="text-pnc-gray-500 text-xs">Title</p>
            <p className="text-pnc-gray-900 text-sm font-medium">{user.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-3">
          <MapPin size={16} className="text-pnc-gray-400 shrink-0" />
          <div>
            <p className="text-pnc-gray-500 text-xs">Region</p>
            <p className="text-pnc-gray-900 text-sm font-medium">{user.region}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-3">
          <Hash size={16} className="text-pnc-gray-400 shrink-0" />
          <div>
            <p className="text-pnc-gray-500 text-xs">Banker ID</p>
            <p className="text-pnc-gray-700 text-xs font-mono">{user.banker_id}</p>
          </div>
        </div>
      </div>

      {/* Activity stats */}
      <h3 className="text-pnc-gray-900 text-sm font-semibold mb-3">Your Activity</h3>
      <div className="grid grid-cols-2 gap-3 mb-5">
        <StatCard
          icon={Users}
          label="Total Clients"
          value={totalClients}
          color="text-blue-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Portfolio Revenue"
          value={fmt(totalRevenue)}
          color="text-green-600"
        />
        <StatCard
          icon={CheckCircle2}
          label="Approved Loans"
          value={approved}
          color="text-green-600"
        />
        <StatCard
          icon={CreditCard}
          label="Pending Review"
          value={pending}
          color={pending > 0 ? 'text-amber-600' : 'text-pnc-gray-400'}
        />
      </div>

      {/* Logout */}
      <button
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 bg-white border border-red-200
                   text-red-600 text-sm font-semibold py-3 rounded-xl
                   active:bg-red-50 transition-colors"
      >
        <LogOut size={16} />
        Sign out
      </button>
    </div>
  )
}
