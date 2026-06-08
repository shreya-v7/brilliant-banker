import { LogOut } from 'lucide-react'

const VARIANTS = {
  dark: 'border border-white/30 bg-white/10 text-white hover:bg-white/15 text-[11px] font-semibold px-3 py-1.5 rounded-lg',
  light: 'border border-red-200 bg-white text-red-600 hover:bg-red-50 text-xs font-semibold px-3 py-1.5 rounded-lg',
  sidebar: 'w-full flex items-center justify-center gap-2 border border-white/20 bg-white/10 text-white hover:bg-white/15 text-sm font-semibold py-2.5 rounded-lg',
  profile: 'w-full flex items-center justify-center gap-2 bg-red-600 text-white hover:bg-red-700 text-sm font-bold py-3 rounded-xl shadow-sm',
}

export function SignOutButton({ onLogout, variant = 'light', label = 'Sign out', className = '' }) {
  return (
    <button
      type="button"
      onClick={onLogout}
      className={`inline-flex items-center gap-1.5 shrink-0 transition-colors active:opacity-80 ${VARIANTS[variant]} ${className}`}
    >
      <LogOut size={14} />
      {label}
    </button>
  )
}

export function SessionBanner({ user, onLogout }) {
  const otherExperience = user.role === 'banker' ? 'Business Owner mobile app' : 'RM portal'

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-5">
      <p className="text-amber-950 text-sm font-bold">
        Signed in as {user.name}
      </p>
      <p className="text-amber-900/75 text-xs mt-1.5 leading-relaxed">
        Only one demo user can be active at a time. Sign out before opening the {otherExperience}, or
        you may see the wrong role or stale data.
      </p>
      <SignOutButton
        onLogout={onLogout}
        variant="profile"
        label="Sign out & return home"
        className="mt-3"
      />
    </div>
  )
}

export function SessionStrip({ user, onLogout, tone = 'dark' }) {
  const roleLabel = user.role === 'banker' ? 'RM' : 'Business'

  if (tone === 'dark') {
    return (
      <div className="bg-pnc-navy px-3 py-2 flex items-center justify-between gap-2 shrink-0 border-b border-white/10">
        <div className="min-w-0">
          <p className="text-white/40 text-[9px] font-semibold uppercase tracking-wide">
            {roleLabel} demo
          </p>
          <p className="text-white text-xs font-semibold truncate">{user.name}</p>
        </div>
        <SignOutButton onLogout={onLogout} variant="dark" label="Sign out" />
      </div>
    )
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between gap-3 shrink-0">
      <p className="text-amber-950 text-xs truncate">
        <span className="font-semibold">{user.name}</span>
        <span className="text-amber-800/70"> · sign out to switch role</span>
      </p>
      <SignOutButton onLogout={onLogout} variant="light" label="Sign out" />
    </div>
  )
}
