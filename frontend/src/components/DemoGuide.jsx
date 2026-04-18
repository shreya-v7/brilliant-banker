import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { X, ChevronRight, ChevronLeft, Sparkles, Play, Loader2, ArrowRight } from 'lucide-react'
import WalkthroughSpotlight from './WalkthroughSpotlight'

const STEPS = [
  {
    phase: 'smb',
    title: 'Live Demo',
    subtitle: 'From the Pittsburgh coffee-shop skit → the product',
    body: "Maya Patel runs a floral studio in Pittsburgh - big spikes around Valentine’s and Mother’s Day, quiet stretches in between. Her friend Priya hits the same walls: branch runs for large business checks, slow vague credit answers, a new \"my banker\" every year. This walkthrough is what changes when the bank uses the data it already has.",
  },
  {
    phase: 'smb',
    stepNum: '1',
    label: 'Not another generic blast',
    title: 'Signal, not spam',
    body: "Instead of random product emails, Brilliant Banker surfaces a proactive read on her cash position - balances, 30-day view, and stability - so seasonality reads as a pattern, not a panic.",
    navigateTo: '/business',
    highlight: 'Dashboard',
    spotlightSelector: '[data-walkthrough="smb-dashboard"]',
  },
  {
    phase: 'smb',
    stepNum: '2',
    label: 'Someone who reads the numbers',
    title: 'Forecast tied to real history',
    body: "Maya doesn’t need vague “financial wellness.” She taps Ask Brilliant Banker for a 30-day forecast built from her actual transactions - revenue, expenses, net - so planning sounds like a spreadsheet, not a brochure.",
    navigateTo: '/business/chat',
    autoSend: "What's my cash flow forecast?",
    highlight: 'AI Chat',
    waitLabel: 'Wait for AI response, then tap Next',
    spotlightSelector: '[data-walkthrough="smb-chat"]',
  },
  {
    phase: 'smb',
    stepNum: '3',
    label: 'No four-week vague no',
    title: 'Pre-qual with clear factors',
    body: "Credit isn’t a black box anymore: pre-qual runs on scored factors (stability, payment history, capacity), shows eligibility and max, and opens a ticket to her RM - not weeks of silence.",
    navigateTo: '/business/chat',
    autoSend: 'Can I get a $25K credit line?',
    highlight: 'Credit Check',
    waitLabel: 'Wait for response - note scored factors, ticket number, and RM card',
    spotlightSelector: '[data-walkthrough="smb-chat"]',
  },
  {
    phase: 'smb',
    stepNum: '4',
    label: 'Status you can see',
    title: 'Live request tracking',
    body: "Pending, approved, declined, referred - tracked in one place so she’s not calling to learn she was denied last Tuesday.",
    navigateTo: '/business/activity',
    highlight: 'Activity',
    spotlightSelector: '[data-walkthrough="smb-activity"]',
  },
  {
    phase: 'smb',
    stepNum: '5',
    label: 'Less copy-paste hell',
    title: 'Forms that already know her',
    body: "Credit lines, SBA, cards - fields pre-fill from her profile so she’s not retyping the same story she’s told three different bankers.",
    navigateTo: '/business/forms',
    highlight: 'Forms',
    autoAction: 'open_form',
    spotlightSelector: '[data-walkthrough="smb-forms"]',
  },
  {
    phase: 'smb',
    stepNum: '6',
    label: 'More than a balance',
    title: 'The full picture',
    body: "Financials, accounts, and an AI brief live in one profile - the bank sees a business, not “just a checking account.”",
    navigateTo: '/business/profile',
    highlight: 'Profile',
    spotlightSelector: '[data-walkthrough="smb-profile"]',
  },

  {
    phase: 'switch',
    title: 'Now the other side',
    body: "That’s Maya’s view. Switch to Sarah Chen, her Relationship Manager - so the next handoff isn’t “start from zero” again.",
    action: 'switch_to_banker',
  },

  {
    phase: 'banker',
    stepNum: '7',
    label: 'Warm, ranked lead',
    title: 'Top of the queue',
    body: "Maya’s request hits Sarah’s priority queue with an urgency score - not another cold scroll through hundreds of names.",
    navigateTo: '/banker',
    highlight: 'Dashboard',
    spotlightSelector: '[data-walkthrough="banker-queue"]',
  },
  {
    phase: 'banker',
    stepNum: '8',
    label: 'Pre-call intelligence',
    title: 'Brief, scorecard, playbook',
    body: "Expand a lead: AI brief, factor-level risk scorecard, and conversation playbook - so even a new RM isn’t reinventing Priya’s or Maya’s story from scratch.",
    navigateTo: '/banker/credit',
    highlight: 'Credit Review',
    spotlightSelector: '[data-walkthrough="banker-credit"]',
  },
  {
    phase: 'banker',
    stepNum: '9',
    label: 'Continuity',
    title: 'Client file in one place',
    body: "Financials, transactions, credit history, and prior notes - the “third banker in two years” problem gets a shared brain.",
    navigateTo: '/banker/clients',
    highlight: 'Clients',
    spotlightSelector: '[data-walkthrough="banker-clients"]',
  },
  {
    phase: 'banker',
    stepNum: '10',
    label: 'Clear decision, fast',
    title: 'Approve · decline · refer',
    body: "One action; Claude drafts the client message. Maya sees the outcome in Activity within seconds - not a month of guessing. Expand a lead and tap Approve.",
    navigateTo: '/banker/credit',
    highlight: 'Credit Review',
    spotlightSelector: '[data-walkthrough="banker-credit"]',
  },
  {
    phase: 'banker',
    title: "That’s Brilliant Banker",
    body: "Signal, not spam. Numbers, not noise. Credit with factors, not fog. Banker and owner aligned - because the bank finally acts like it’s seen the deposits.",
  },
]

export default function DemoGuide({ onClose, onSwitchToBanker }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [step, setStep] = useState(0)
  const [switching, setSwitching] = useState(false)

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1
  const progress = ((step + 1) / STEPS.length) * 100

  const spotlight = current.spotlightSelector ?? null

  // Navigate when step or URL changes (banker steps mount after role switch; deps must include pathname)
  useEffect(() => {
    if (switching) return
    const cfg = STEPS[step]
    if (!cfg?.navigateTo) return

    const sendState = cfg.autoSend
      ? { demoPrompt: cfg.autoSend, demoAutoSend: true, _ts: Date.now() }
      : null

    const target = cfg.navigateTo

    const run = () => {
      if (location.pathname !== target) {
        navigate(target, sendState ? { state: sendState } : undefined)
      } else if (sendState) {
        navigate(target, { state: sendState, replace: true })
      }
    }

    if (cfg.phase === 'banker') {
      const t = window.setTimeout(run, 150)
      return () => clearTimeout(t)
    }
    run()
  }, [step, switching, location.pathname, navigate])

  // Auto-open first form and trigger auto-fill
  useEffect(() => {
    const current = STEPS[step]
    if (current.autoAction === 'open_form') {
      const t = setTimeout(() => {
        const formBtn = document.querySelector('[data-form-id="loc"]')
        if (formBtn) formBtn.click()
        setTimeout(() => {
          const autoFillBtn = document.querySelector('[data-autofill]')
          if (autoFillBtn) autoFillBtn.click()
        }, 400)
      }, 300)
      return () => clearTimeout(t)
    }
  }, [step])

  const goNext = () => {
    if (switching) return

    if (current.action === 'switch_to_banker') {
      setSwitching(true)
      onSwitchToBanker()
        .then(() => new Promise(r => setTimeout(r, 600)))
        .then(() => {
          setSwitching(false)
          setStep(s => s + 1)
        })
        .catch(() => setSwitching(false))
      return
    }

    if (!isLast) setStep(s => s + 1)
    else onClose()
  }

  const goPrev = () => {
    if (switching) return
    setStep(s => Math.max(0, s - 1))
  }

  const phaseLabel = current.phase === 'banker'
    ? 'Banker Side'
    : current.phase === 'switch'
    ? 'Switching...'
    : 'SMB Side'

  return (
    <>
      <WalkthroughSpotlight selector={spotlight} />

      <div className="bg-pnc-navy rounded-2xl p-4 shadow-2xl border border-white/10">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-pnc-orange flex items-center justify-center">
              <Sparkles size={12} className="text-white" />
            </div>
            <span className="text-white/60 text-xs font-medium uppercase tracking-wide">
              {phaseLabel} - {step + 1}/{STEPS.length}
            </span>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="w-full bg-white/10 rounded-full h-1.5 mb-4">
          <div
            className="bg-pnc-orange h-1.5 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {current.stepNum && (
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-pnc-orange text-white text-xs font-bold">
              {current.stepNum}
            </span>
            {current.label && (
              <span className="text-pnc-orange text-[11px] font-bold uppercase tracking-wide">
                {current.label}
              </span>
            )}
          </div>
        )}

        {current.subtitle && (
          <p className="text-white/40 text-[11px] italic mb-2">{current.subtitle}</p>
        )}

        <div className="flex items-center gap-2 mb-1.5">
          <h3 className="text-white text-sm font-bold">{current.title}</h3>
          {current.highlight && (
            <span className="text-[9px] font-bold text-pnc-orange bg-pnc-orange/15 px-1.5 py-0.5 rounded-full">
              {current.highlight}
            </span>
          )}
        </div>

        <p className="text-white/70 text-xs leading-relaxed mb-3">{current.body}</p>

        {current.waitLabel && (
          <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 mb-3">
            <p className="text-white/50 text-[11px] font-medium flex items-center gap-1.5">
              <Play size={10} className="shrink-0" />
              {current.waitLabel}
            </p>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={goPrev}
            disabled={step === 0 || switching}
            className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center
                       disabled:opacity-30 active:bg-white/20 transition-colors shrink-0"
          >
            <ChevronLeft size={18} className="text-white" />
          </button>

          <button
            onClick={goNext}
            disabled={switching}
            className="flex-1 flex items-center justify-center gap-1.5 bg-pnc-orange text-white
                       text-xs font-semibold py-2.5 rounded-xl active:opacity-90 transition-opacity
                       disabled:opacity-60"
          >
            {switching ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Switching to Sarah Chen...
              </>
            ) : current.action === 'switch_to_banker' ? (
              <>
                Switch to Banker
                <ArrowRight size={14} />
              </>
            ) : isLast ? (
              'Finish'
            ) : (
              <>
                Next
                <ChevronRight size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    </>
  )
}
