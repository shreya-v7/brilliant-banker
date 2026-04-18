import { Link } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Copy, Check } from 'lucide-react'
import { useState } from 'react'

const MAYA_SMB_ID = '11111111-1111-1111-1111-111111111111'

function LinkRow({ to, title, hint }) {
  const [copied, setCopied] = useState(false)
  const full = `${window.location.origin}${to}`

  const copy = () => {
    navigator.clipboard?.writeText(full).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-3 border-b border-white/10 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium text-sm">{title}</p>
        {hint && <p className="text-white/45 text-xs mt-0.5">{hint}</p>}
        <a
          href={full}
          className="text-pnc-orange/90 text-xs font-mono break-all hover:underline mt-1 inline-block"
        >
          {full}
        </a>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link
          to={to}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-white/10 hover:bg-white/15 px-3 py-2 rounded-lg transition-colors"
        >
          Open
          <ExternalLink size={12} />
        </Link>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white/10 hover:bg-white/15 text-white/80 transition-colors"
          aria-label="Copy URL"
        >
          {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
        </button>
      </div>
    </div>
  )
}

export default function ScreenLinks() {
  return (
    <div className="min-h-dvh bg-gradient-to-br from-pnc-navy via-pnc-navy to-pnc-navy-light text-white">
      <div className="max-w-2xl mx-auto px-5 py-8 pb-16">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-6 transition-colors"
        >
          <ArrowLeft size={18} />
          Back to sign-in
        </Link>

        <h1 className="text-2xl font-bold mb-1">Screen links</h1>
        <p className="text-white/50 text-sm mb-8 leading-relaxed">
          Each path is a direct URL. If you are signed out, SMB routes open the SMB sign-in flow and banker
          routes open the banker sign-in flow - after login you land on the same path (deep link).
        </p>

        <section className="mb-10">
          <h2 className="text-pnc-orange text-xs font-bold uppercase tracking-wider mb-3">Public</h2>
          <div className="bg-white/5 border border-white/10 rounded-2xl px-4">
            <LinkRow to="/" title="Sign-in / role picker" hint="Landing" />
            <LinkRow to="/links" title="This page - all screen URLs" />
            <LinkRow to="/scene" title="Customer discovery skit (characters)" />
            <LinkRow to="/marketing" title="Marketing" />
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-pnc-orange text-xs font-bold uppercase tracking-wider mb-3">SMB (sign in as a business user)</h2>
          <div className="bg-white/5 border border-white/10 rounded-2xl px-4">
            <LinkRow to="/business" title="Dashboard" hint="Home - cash signal & summary" />
            <LinkRow to="/business/chat" title="AI chat" />
            <LinkRow to="/business/forms" title="Forms" />
            <LinkRow to="/business/activity" title="Activity" hint="Credit & request status" />
            <LinkRow to="/business/profile" title="Profile" hint="Business brief & details" />
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-pnc-orange text-xs font-bold uppercase tracking-wider mb-3">Banker (sign in as a banker)</h2>
          <div className="bg-white/5 border border-white/10 rounded-2xl px-4">
            <LinkRow to="/banker" title="Banker dashboard" hint="Priority queue" />
            <LinkRow to="/banker/clients" title="Clients list" />
            <LinkRow
              to={`/banker/clients/${MAYA_SMB_ID}`}
              title="Client detail (example: Maya Patel)"
              hint="Replace UUID for another SMB from seed data"
            />
            <LinkRow to="/banker/credit" title="Credit review" />
            <LinkRow to="/banker/profile" title="Banker profile" />
          </div>
        </section>

        <p className="text-white/35 text-xs leading-relaxed">
          Tip: share a link with query params omitted - auth is session-based after you pick a profile on the login
          screen.
        </p>
      </div>
    </div>
  )
}
