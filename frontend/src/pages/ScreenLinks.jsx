import { Link } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Copy, Check } from 'lucide-react'
import { useState } from 'react'

import { MAYA_SMB_ID } from '../constants/demo'

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
          Home
        </Link>

        <h1 className="text-2xl font-bold mb-1">Screen links</h1>
        <p className="text-white/50 text-sm mb-8 leading-relaxed">
          Every screen has its own URL. Sign-in is separate from the app so browser back returns to Home, not the login loop.
        </p>

        <section className="mb-10">
          <h2 className="text-pnc-orange text-xs font-bold uppercase tracking-wider mb-3">Home & public</h2>
          <div className="bg-white/5 border border-white/10 rounded-2xl px-4">
            <LinkRow to="/" title="Home — role picker" hint="Always lands here; no auto-redirect" />
            <LinkRow to="/links" title="This page — all screen URLs" />
            <LinkRow to="/scene" title="Customer discovery skit" />
            <LinkRow to="/marketing" title="Marketing page" />
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-pnc-orange text-xs font-bold uppercase tracking-wider mb-3">Sign-in (pick a demo profile)</h2>
          <div className="bg-white/5 border border-white/10 rounded-2xl px-4">
            <LinkRow to="/signin/smb" title="SMB sign-in" hint="All demo business owners" />
            <LinkRow to="/signin/smb?walkthrough=1" title="SMB walkthrough sign-in" hint="Maya & Priya only" />
            <LinkRow to="/signin/banker" title="Banker sign-in" hint="All demo RMs" />
            <LinkRow to="/signin/banker?walkthrough=1" title="Banker walkthrough sign-in" hint="Sarah Chen only" />
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-pnc-orange text-xs font-bold uppercase tracking-wider mb-3">SMB app (requires sign-in)</h2>
          <div className="bg-white/5 border border-white/10 rounded-2xl px-4">
            <LinkRow to="/business" title="Dashboard" hint="/business — home tab" />
            <LinkRow to="/business/chat" title="AI chat" />
            <LinkRow to="/business/forms" title="Forms" />
            <LinkRow to="/business/activity" title="Activity" hint="Credit & request status" />
            <LinkRow to="/business/profile" title="Profile" hint="Business brief & logout" />
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-pnc-orange text-xs font-bold uppercase tracking-wider mb-3">Banker portal (requires sign-in)</h2>
          <div className="bg-white/5 border border-white/10 rounded-2xl px-4">
            <LinkRow to="/banker" title="Dashboard" hint="Priority queue" />
            <LinkRow to="/banker/clients" title="Clients list" />
            <LinkRow
              to={`/banker/clients/${MAYA_SMB_ID}`}
              title="Client detail — Maya Patel"
              hint="Swap UUID for another SMB"
            />
            <LinkRow to="/banker/credit" title="Credit review" />
            <LinkRow to="/banker/profile" title="Banker profile & logout" />
          </div>
        </section>

        <p className="text-white/35 text-xs leading-relaxed">
          User testing feedback is a floating Feedback tab at the bottom-right of the screen (outside the phone mockup) after sign-in.
        </p>
      </div>
    </div>
  )
}
