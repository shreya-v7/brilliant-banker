import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, ChevronRight, ChevronLeft, Play, Sparkles } from 'lucide-react'

// The complete end-to-end workflow demo steps
const SMB_STEPS = [
  {
    title: 'Welcome to Brilliant Banker',
    description: 'This demo walks through the full AI-powered banking workflow — from an SMB owner asking for credit, to a banker making a decision, to the SMB seeing the result.',
    action: null,
    role: 'smb',
    screen: 'home',
    tip: 'You are logged in as an SMB owner. The AI assistant handles your banking queries 24/7.',
  },
  {
    title: 'Step 1 — Check Your Cash Flow',
    description: 'Tap the AI chat and ask about your cash flow. The AI uses your real financial data to forecast the next 30 days.',
    action: { label: 'Open Chat', path: '/chat' },
    role: 'smb',
    screen: 'chat',
    tip: 'Try: "What\'s my cash flow forecast?" — the AI reads your actual account data.',
    prompt: "What's my cash flow forecast?",
  },
  {
    title: 'Step 2 — Request a Credit Line',
    description: 'Ask the AI about a credit line. It runs a real pre-qualification check against your profile and automatically escalates to a banker if the amount is over $10K.',
    action: { label: 'Open Chat', path: '/chat' },
    role: 'smb',
    screen: 'chat',
    tip: 'Try: "Can I get a $25K credit line?" — this triggers auto-escalation to a banker.',
    prompt: "Can I get a $25K credit line?",
  },
  {
    title: 'Step 3 — Track Your Requests',
    description: 'After the AI escalates, check your Activity tab to see the status. Your banker will review and respond.',
    action: { label: 'View Activity', path: '/activity' },
    role: 'smb',
    screen: 'activity',
    tip: 'Your request is now in the banker\'s priority queue.',
  },
  {
    title: 'Step 4 — Switch to Banker View',
    description: 'Now log out and sign in as a PNC Banker (e.g. Sarah Chen) to see the other side of this workflow.',
    action: { label: 'Go to Profile to Sign Out', path: '/profile' },
    role: 'smb',
    screen: 'profile',
    tip: 'After signing out, choose the PNC Banker tab on the login screen.',
  },
]

const BANKER_STEPS = [
  {
    title: 'Step 5 — Banker Dashboard',
    description: 'As a banker, your dashboard shows the priority queue of pending decisions, portfolio health, and clients needing attention — all powered by real data.',
    action: null,
    role: 'banker',
    screen: 'banker-home',
    tip: 'The AI has already sorted leads by urgency score so you work the most critical cases first.',
  },
  {
    title: 'Step 6 — Review a Credit Request',
    description: 'Open Credit Review to see the SMB\'s pending request. Expand it, generate an AI pre-call brief, and review the conversation playbook.',
    action: { label: 'Open Credit Review', path: '/banker/credit' },
    role: 'banker',
    screen: 'banker-credit',
    tip: 'The AI brief is a 30-second summary of the client\'s financial health for before your call.',
  },
  {
    title: 'Step 7 — Make a Decision',
    description: 'Approve, decline, or refer the request. The AI drafts a notification message that the SMB will see immediately.',
    action: { label: 'Open Credit Review', path: '/banker/credit' },
    role: 'banker',
    screen: 'banker-credit',
    tip: 'Set the approved amount, then tap Approve. Claude drafts a warm, plain-language notification.',
  },
  {
    title: 'Step 8 — View the Full Client Profile',
    description: 'Navigate to My Clients to see a 360° view: financial health, real transactions, credit history, and add a note for the next call.',
    action: { label: 'View My Clients', path: '/banker/clients' },
    role: 'banker',
    screen: 'banker-clients',
    tip: 'Tap any client to drill into their transactions, credit history, and leave a note.',
  },
  {
    title: 'Demo Complete!',
    description: 'You\'ve seen the full workflow: SMB asks AI → AI pre-qualifies & escalates → Banker reviews with AI brief → Decision made → SMB notified. All powered by Claude.',
    action: null,
    role: 'banker',
    screen: 'done',
    tip: '🎉 Built with FastAPI + LangGraph + Claude Sonnet 4.6 + React',
  },
]

export default function DemoGuide({ userRole, onClose }) {
  const navigate = useNavigate()
  const allSteps = [...SMB_STEPS, ...BANKER_STEPS]
  const steps = userRole === 'banker' ? BANKER_STEPS : allSteps
  const [step, setStep] = useState(0)
  const current = steps[step]

  const handleAction = () => {
    if (current.action?.path) {
      navigate(current.action.path)
    }
  }

  const isLast = step === steps.length - 1

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
      {/* Semi-transparent backdrop on bottom area only */}
      <div
        className="absolute inset-0 bg-black/20 pointer-events-auto"
        onClick={onClose}
      />

      {/* Demo card */}
      <div className="relative w-full max-w-md pointer-events-auto mb-20 mx-4 z-10">
        <div className="bg-pnc-navy rounded-2xl p-4 shadow-2xl border border-white/10">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-pnc-orange flex items-center justify-center">
                <Sparkles size={12} className="text-white" />
              </div>
              <span className="text-white/60 text-xs font-medium uppercase tracking-wide">
                Demo Guide · {step + 1}/{steps.length}
              </span>
            </div>
            <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-white/10 rounded-full h-1 mb-4">
            <div
              className="bg-pnc-orange h-1 rounded-full transition-all duration-300"
              style={{ width: `${((step + 1) / steps.length) * 100}%` }}
            />
          </div>

          {/* Content */}
          <h3 className="text-white text-sm font-bold mb-2">{current.title}</h3>
          <p className="text-white/80 text-xs leading-relaxed mb-3">{current.description}</p>

          {/* Tip */}
          <div className="bg-white/10 rounded-xl px-3 py-2 mb-4">
            <p className="text-white/70 text-xs leading-relaxed">
              <span className="text-pnc-orange font-semibold">Tip: </span>
              {current.tip}
            </p>
          </div>

          {/* Prompt chip (for chat steps) */}
          {current.prompt && (
            <div
              className="bg-pnc-orange/20 border border-pnc-orange/30 rounded-xl px-3 py-2 mb-4 cursor-pointer"
              onClick={() => {
                navigate('/chat', { state: { demoPrompt: current.prompt } })
              }}
            >
              <p className="text-pnc-orange text-xs font-medium">
                Try saying: "{current.prompt}"
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0}
              className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center
                         disabled:opacity-30 active:bg-white/20 transition-colors shrink-0"
            >
              <ChevronLeft size={18} className="text-white" />
            </button>

            {current.action && (
              <button
                onClick={handleAction}
                className="flex-1 flex items-center justify-center gap-1.5 bg-white/10 text-white
                           text-xs font-semibold py-2.5 rounded-xl active:bg-white/20 transition-colors"
              >
                <Play size={12} /> {current.action.label}
              </button>
            )}

            {!isLast ? (
              <button
                onClick={() => setStep(s => s + 1)}
                className="flex-1 flex items-center justify-center gap-1.5 bg-pnc-orange text-white
                           text-xs font-semibold py-2.5 rounded-xl active:opacity-90 transition-opacity"
              >
                Next <ChevronRight size={14} />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="flex-1 bg-pnc-orange text-white text-xs font-semibold
                           py-2.5 rounded-xl active:opacity-90 transition-opacity"
              >
                Finish Demo
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
