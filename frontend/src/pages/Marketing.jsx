import { useState } from 'react'
import {
  Landmark,
  Bot,
  Zap,
  Shield,
  TrendingUp,
  CreditCard,
  MessageCircle,
  Bell,
  Ticket,
  Users,
  Clock,
  ArrowRight,
  Check,
  Star,
  BarChart3,
  Brain,
  Smartphone,
} from 'lucide-react'

const STATS = [
  { value: '928K', label: 'SMB client relationships across PNC\'s national footprint' },
  { value: '2,200', label: 'branches with dedicated business banking teams' },
  { value: '$5.4B', label: 'addressable SMB revenue within PNC\'s existing base' },
  { value: '596', label: 'business bankers serving the SMB portfolio today' },
]

const PNC_STRENGTHS = [
  {
    icon: Shield,
    title: 'Deep SMB relationships',
    description: 'PNC already serves 928K SMB clients with dedicated relationship managers, branch infrastructure, and a trusted brand built over decades.',
  },
  {
    icon: CreditCard,
    title: 'Full product suite',
    description: 'Business checking, credit lines, SBA loans, treasury management, merchant services. The product shelf is already built.',
  },
  {
    icon: Users,
    title: 'Experienced RM teams',
    description: '596 business bankers with deep industry knowledge, local market expertise, and existing client relationships across every region.',
  },
  {
    icon: Landmark,
    title: 'Regulatory and compliance foundation',
    description: 'Established ECOA, OCC, and TCPA compliance frameworks. Audit infrastructure. Data governance already in place.',
  },
]

const ADDS = [
  {
    icon: Clock,
    title: 'Proactive outreach at scale',
    description: 'Today, 35% of SMBs get contacted in 2 years. AI monitors all 928K clients and surfaces the ones who need attention right now.',
  },
  {
    icon: Brain,
    title: 'Instant credit pre-qualification',
    description: 'Clients get a scored, data-backed answer in seconds instead of waiting days. RMs receive a pre-call brief before the phone even rings.',
  },
  {
    icon: TrendingUp,
    title: 'Cash flow intelligence',
    description: 'Personalized 30-day forecasts built from real transaction data. Seasonal patterns, risk flags, and actionable insight, always on.',
  },
  {
    icon: Zap,
    title: 'Real-time RM feed',
    description: 'Every client interaction streams to the RM dashboard live. No CRM digging. Context is never lost between banker transitions.',
  },
]

const FEATURES = [
  {
    icon: Brain,
    tag: 'AI AGENT',
    title: 'LangGraph-Powered AI Assistant',
    description: 'A multi-node AI pipeline that classifies intent, routes to the right tool, composes natural replies, and auto-escalates high-value requests  - all in under 3 seconds.',
    details: ['Intent classification with Claude', 'Cash flow forecasting from real transaction data', 'Credit pre-qualification with specific dollar amounts', 'Never makes up numbers  - every figure comes from data'],
    color: 'pnc-orange',
  },
  {
    icon: Zap,
    tag: 'REAL-TIME STREAM',
    title: 'Live RM Event Feed',
    description: 'Every client interaction streams to the RM dashboard in real-time via Redis pub/sub. No more checking CRM for updates  - insights come to you.',
    details: ['Redis pub/sub event pipeline (Kafka-grade for SMB scale)', 'Server-Sent Events for zero-latency delivery', 'Urgency-tagged notifications with toast alerts', 'Claude-generated 1-line summaries per interaction'],
    color: 'pnc-navy',
  },
  {
    icon: Ticket,
    tag: 'TICKET SYSTEM',
    title: 'Instant Escalation & Ticketing',
    description: 'When AI detects a human-touch moment, it creates a trackable ticket, assigns the client\'s RM, and shares their contact details  - all within the chat.',
    details: ['Pattern detection for escalation intent', 'Auto-generated ticket numbers (TKT-XXXXXX)', 'RM assignment with name, title, and email', 'Visible on both client Activity and RM dashboard'],
    color: 'pnc-blue',
  },
  {
    icon: BarChart3,
    tag: 'CREDIT INTELLIGENCE',
    title: 'Pre-Qualification in Seconds',
    description: 'Clients ask "Can I get a $50K credit line?" and get an instant, data-backed answer with approval probability, max amount, and specific reasoning.',
    details: ['Weighted scoring: cash stability, payment history, revenue', 'Requests over $10K auto-escalate with full context', 'RM receives pre-call brief with 3 bullet points', 'Append-only decision audit trail in PostgreSQL'],
    color: 'pnc-orange',
  },
  {
    icon: TrendingUp,
    tag: 'CASH FLOW',
    title: '30-Day Cash Flow Intelligence',
    description: 'Forecasts built from actual transaction history  - not generic formulas. Clients see projected revenue, expenses, and net position with risk flags.',
    details: ['Queries last 30 days of real transactions', 'Adjusts for cash stability score', 'Flags high, medium, low risk automatically', 'Helps RMs proactively reach out before shortfalls'],
    color: 'pnc-navy',
  },
  {
    icon: Smartphone,
    tag: 'MOBILE-FIRST',
    title: 'PNC-Branded PWA Experience',
    description: 'A mobile-first Progressive Web App with PNC brand colors, bottom navigation, and a native app feel  - no App Store required.',
    details: ['Dual interfaces: SMB client + RM dashboard', 'Chat with typing indicators and intent badges', 'Activity tracker with ticket status and RM info', 'Portfolio view, client profiles, and banker notes'],
    color: 'pnc-blue',
  },
]

const FLOW_STEPS = [
  { step: '01', title: 'Client chats with AI', description: 'SMB owner asks about cash flow, credit, or anything banking-related.', icon: MessageCircle },
  { step: '02', title: 'AI processes & responds', description: 'LangGraph pipeline classifies intent, runs the right tool, composes a plain-language reply.', icon: Brain },
  { step: '03', title: 'RM gets notified instantly', description: 'A Claude-generated highlight streams to the RM dashboard with urgency tagging.', icon: Bell },
  { step: '04', title: 'Ticket created if needed', description: 'High-value requests auto-generate a ticket with RM assignment and client contact card.', icon: Ticket },
  { step: '05', title: 'RM takes informed action', description: 'RM opens pre-call brief, reviews full context, and reaches out with a personalized touch.', icon: Users },
]

const PRICING = [
  {
    name: 'Starter',
    price: 2500,
    period: '/month',
    description: 'For community banks testing AI-assisted SMB banking',
    highlight: false,
    features: [
      'Up to 500 SMB clients',
      'AI chat assistant (Claude-powered)',
      'Basic intent classification',
      'FAQ automation',
      'Email support',
    ],
    cta: 'Start free trial',
  },
  {
    name: 'Growth',
    price: 8500,
    period: '/month',
    description: 'For regional banks scaling their SMB portfolio',
    highlight: true,
    badge: 'MOST POPULAR',
    features: [
      'Up to 5,000 SMB clients',
      'Everything in Starter, plus:',
      'Credit pre-qualification engine',
      'Cash flow forecasting',
      'Real-time RM event stream',
      'Ticket & escalation system',
      'RM dashboard with pre-call briefs',
      'Priority support + onboarding',
    ],
    cta: 'Start free trial',
  },
  {
    name: 'Enterprise',
    price: null,
    period: '',
    description: 'For top-20 banks with custom integration needs',
    highlight: false,
    features: [
      'Unlimited SMB clients',
      'Everything in Growth, plus:',
      'Custom model fine-tuning',
      'Core banking API integration',
      'Dedicated success manager',
      'SLA guarantee (99.95% uptime)',
      'SOC 2 Type II compliance',
      'On-premise deployment option',
    ],
    cta: 'Contact sales',
  },
]

const TESTIMONIALS = [
  {
    quote: 'We used to lose 30% of credit inquiries because they took too long. Now clients get an answer in seconds and my team only handles the ones that truly need a human touch.',
    name: 'Sarah Chen',
    title: 'VP, Business Banking',
    initials: 'SC',
  },
  {
    quote: 'The live feed changed everything. I used to check CRM 15 times a day. Now I see what my clients need the moment they ask  - before they even finish the conversation.',
    name: 'Jordan Patel',
    title: 'Senior RM, Mid-Atlantic',
    initials: 'JP',
  },
  {
    quote: 'I asked about a credit line at 9pm on a Tuesday and got a real answer with numbers. Then my RM emailed me the next morning already knowing what I needed. That\'s never happened before.',
    name: 'Anne Fox',
    title: 'Owner, Fox Floral Design',
    initials: 'AF',
  },
]

function FeatureCard({ feature }) {
  const Icon = feature.icon
  const isOrange = feature.color === 'pnc-orange'
  const isNavy = feature.color === 'pnc-navy'
  const accent = isOrange ? 'text-pnc-orange' : isNavy ? 'text-pnc-navy' : 'text-pnc-blue'
  const accentBg = isOrange ? 'bg-pnc-orange/10' : isNavy ? 'bg-pnc-navy/10' : 'bg-pnc-blue/10'
  const borderColor = isOrange ? 'border-pnc-orange/20' : isNavy ? 'border-pnc-navy/20' : 'border-pnc-blue/20'

  return (
    <div className={`rounded-2xl border ${borderColor} bg-white p-6 flex flex-col h-full
                     hover:shadow-lg transition-shadow`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${accentBg}`}>
        <Icon size={22} className={accent} />
      </div>
      <span className={`text-[10px] font-bold tracking-widest ${accent}`}>{feature.tag}</span>
      <h3 className="text-pnc-gray-900 text-base font-bold mt-1.5 leading-snug">{feature.title}</h3>
      <p className="text-pnc-gray-500 text-sm mt-2 leading-relaxed flex-1">{feature.description}</p>
      <div className="mt-4 pt-4 border-t border-pnc-gray-100 space-y-2">
        {feature.details.map((d, i) => (
          <div key={i} className="flex items-start gap-2">
            <Check size={13} className={`shrink-0 mt-0.5 ${accent}`} />
            <span className="text-pnc-gray-600 text-xs leading-relaxed">{d}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Marketing({ onBack }) {
  const [billingAnnual, setBillingAnnual] = useState(true)

  return (
    <div className="min-h-dvh bg-white">
      {/* ─── NAVBAR ─────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-pnc-navy/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-pnc-orange/20 flex items-center justify-center">
              <Landmark size={18} className="text-pnc-orange" />
            </div>
            <span className="text-white font-bold text-base">Brilliant Banker</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="#pricing" className="text-white/70 text-sm font-medium hover:text-white transition-colors hidden sm:block">
              Pricing
            </a>
            <a href="#features" className="text-white/70 text-sm font-medium hover:text-white transition-colors hidden sm:block">
              Features
            </a>
            <button
              onClick={onBack}
              className="bg-pnc-orange text-white text-sm font-semibold px-4 py-2 rounded-lg active:bg-pnc-orange-dark transition-colors"
            >
              Try Demo
            </button>
          </div>
        </div>
      </nav>

      {/* ─── HERO ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pnc-navy via-pnc-navy to-pnc-navy-light" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-pnc-orange rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-pnc-blue rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-pnc-orange text-xs font-bold px-4 py-1.5 rounded-full mb-6 tracking-wide">
            <Zap size={12} />
            AI-POWERED SMB BANKING PLATFORM
          </div>

          <h1 className="text-white text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight max-w-3xl mx-auto">
            Give every RM{' '}
            <span className="text-pnc-orange">superpowers</span>
          </h1>

          <p className="text-white/70 text-lg sm:text-xl mt-6 max-w-2xl mx-auto leading-relaxed">
            PNC already has the clients, the products, and the bankers.
            Brilliant Banker adds the AI layer that turns 596 RMs into a team
            that can proactively serve all 928K SMB relationships.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
            <button
              onClick={onBack}
              className="w-full sm:w-auto bg-pnc-orange text-white font-bold text-base px-8 py-3.5 rounded-xl
                         active:bg-pnc-orange-dark transition-colors shadow-lg shadow-pnc-orange/25"
            >
              Try the live demo
            </button>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto bg-white/10 text-white font-semibold text-base px-8 py-3.5 rounded-xl
                         border border-white/20 active:bg-white/20 transition-colors text-center"
            >
              See how it works
            </a>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16 max-w-3xl mx-auto">
            {STATS.map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-pnc-orange text-2xl sm:text-3xl font-black">{s.value}</p>
                <p className="text-white/50 text-[11px] mt-1 leading-snug">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHAT PNC ALREADY HAS ────────────────────────────── */}
      <section className="bg-pnc-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-pnc-navy text-xs font-bold tracking-widest">THE FOUNDATION</span>
            <h2 className="text-pnc-gray-900 text-3xl sm:text-4xl font-black mt-3">
              What PNC already does well
            </h2>
            <p className="text-pnc-gray-500 text-base mt-3 max-w-xl mx-auto">
              PNC has the infrastructure, the relationships, and the products.
              Brilliant Banker doesn't replace any of it. It amplifies it.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {PNC_STRENGTHS.map((p, i) => {
              const Icon = p.icon
              return (
                <div key={i} className="bg-white border border-pnc-gray-200 rounded-2xl p-6">
                  <div className="w-10 h-10 rounded-xl bg-pnc-navy/10 flex items-center justify-center mb-4">
                    <Icon size={20} className="text-pnc-navy" />
                  </div>
                  <h3 className="text-pnc-gray-900 text-base font-bold">{p.title}</h3>
                  <p className="text-pnc-gray-500 text-sm mt-2 leading-relaxed">{p.description}</p>
                </div>
              )
            })}
          </div>

          {/* What Brilliant Banker adds */}
          <div className="text-center mt-16 mb-12">
            <span className="text-pnc-orange text-xs font-bold tracking-widest">THE AI LAYER</span>
            <h2 className="text-pnc-gray-900 text-3xl sm:text-4xl font-black mt-3">
              What Brilliant Banker adds
            </h2>
            <p className="text-pnc-gray-500 text-base mt-3 max-w-xl mx-auto">
              The math: 928K clients, 596 bankers. That's ~354 SMBs per manager.
              AI is the only solution that scales insight to every client simultaneously.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {ADDS.map((p, i) => {
              const Icon = p.icon
              return (
                <div key={i} className="bg-white border border-pnc-orange/20 rounded-2xl p-6">
                  <div className="w-10 h-10 rounded-xl bg-pnc-orange/10 flex items-center justify-center mb-4">
                    <Icon size={20} className="text-pnc-orange" />
                  </div>
                  <h3 className="text-pnc-gray-900 text-base font-bold">{p.title}</h3>
                  <p className="text-pnc-gray-500 text-sm mt-2 leading-relaxed">{p.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── THE SOLUTION ───────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-6">
            <span className="text-pnc-navy text-xs font-bold tracking-widest">TWO SIDES, ONE PLATFORM</span>
            <h2 className="text-pnc-gray-900 text-3xl sm:text-4xl font-black mt-3">
              Built for both sides of the{' '}<span className="text-pnc-orange">relationship</span>
            </h2>
            <p className="text-pnc-gray-500 text-base mt-3 max-w-2xl mx-auto">
              Brilliant Banker serves SMB owners and RMs simultaneously. Clients get instant,
              personalized answers. RMs get the context to act when it matters.
            </p>
          </div>

          <div className="bg-pnc-navy rounded-3xl p-6 sm:p-10 mt-10">
            <div className="grid sm:grid-cols-3 gap-6 text-center">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-pnc-orange/20 flex items-center justify-center mx-auto mb-4">
                  <Bot size={28} className="text-pnc-orange" />
                </div>
                <h3 className="text-white text-base font-bold">For the Client</h3>
                <p className="text-white/60 text-sm mt-2">
                  Instant answers, real numbers, and a direct line to their RM when they need it.
                  No hold music. No branch visit.
                </p>
              </div>
              <div>
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
                  <Zap size={28} className="text-white" />
                </div>
                <h3 className="text-white text-base font-bold">For the RM</h3>
                <p className="text-white/60 text-sm mt-2">
                  A live feed of client activity, AI-generated pre-call briefs, and
                  automatic ticket routing. Focus on relationships, not admin.
                </p>
              </div>
              <div>
                <div className="w-14 h-14 rounded-2xl bg-pnc-blue/20 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp size={28} className="text-pnc-blue" />
                </div>
                <h3 className="text-white text-base font-bold">For the Bank</h3>
                <p className="text-white/60 text-sm mt-2">
                  Higher conversion on credit, lower cost-to-serve, and an SMB experience
                  that actually drives retention and wallet share.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ───────────────────────────────────── */}
      <section id="how-it-works" className="bg-pnc-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <span className="text-pnc-orange text-xs font-bold tracking-widest">HOW IT WORKS</span>
            <h2 className="text-pnc-gray-900 text-3xl sm:text-4xl font-black mt-3">
              From chat to close in 5 steps
            </h2>
          </div>

          <div className="space-y-4 max-w-2xl mx-auto">
            {FLOW_STEPS.map((s, i) => {
              const Icon = s.icon
              return (
                <div key={i} className="flex items-start gap-4 bg-white border border-pnc-gray-200 rounded-2xl p-5">
                  <div className="w-12 h-12 rounded-xl bg-pnc-navy flex items-center justify-center shrink-0">
                    <span className="text-pnc-orange text-sm font-black">{s.step}</span>
                  </div>
                  <div>
                    <h3 className="text-pnc-gray-900 text-base font-bold flex items-center gap-2">
                      {s.title}
                      <Icon size={16} className="text-pnc-gray-400" />
                    </h3>
                    <p className="text-pnc-gray-500 text-sm mt-1">{s.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ───────────────────────────────────────── */}
      <section id="features" className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <span className="text-pnc-navy text-xs font-bold tracking-widest">PLATFORM CAPABILITIES</span>
            <h2 className="text-pnc-gray-900 text-3xl sm:text-4xl font-black mt-3">
              Built different. Built to ship.
            </h2>
            <p className="text-pnc-gray-500 text-base mt-3 max-w-xl mx-auto">
              Not a pitch deck. Not a wireframe. Every feature below is live, running code
              with real AI, real databases, and real-time streaming.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <FeatureCard key={i} feature={f} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── TECH STACK ─────────────────────────────────────── */}
      <section className="bg-pnc-navy py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <span className="text-pnc-orange text-xs font-bold tracking-widest">UNDER THE HOOD</span>
            <h2 className="text-white text-2xl sm:text-3xl font-black mt-3">
              Production-grade architecture
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { name: 'LangGraph', desc: 'Agent orchestration' },
              { name: 'Claude', desc: 'Anthropic LLM' },
              { name: 'FastAPI', desc: 'Async Python backend' },
              { name: 'Redis', desc: 'Pub/sub + sessions' },
              { name: 'PostgreSQL', desc: 'Leads & profiles' },
              { name: 'MongoDB', desc: 'Conversation history' },
              { name: 'React + Vite', desc: 'Mobile-first PWA' },
              { name: 'Docker', desc: 'One-command deploy' },
            ].map((t, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <p className="text-white text-sm font-bold">{t.name}</p>
                <p className="text-white/40 text-xs mt-1">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ───────────────────────────────────── */}
      <section className="py-20 bg-pnc-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-pnc-orange text-xs font-bold tracking-widest">WHAT THEY SAY</span>
            <h2 className="text-pnc-gray-900 text-3xl sm:text-4xl font-black mt-3">
              From pilot users
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-white border border-pnc-gray-200 rounded-2xl p-6 flex flex-col">
                <div className="flex gap-1 mb-4">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={14} className="text-pnc-orange fill-pnc-orange" />
                  ))}
                </div>
                <p className="text-pnc-gray-700 text-sm leading-relaxed flex-1">"{t.quote}"</p>
                <div className="flex items-center gap-3 mt-5 pt-4 border-t border-pnc-gray-100">
                  <div className="w-9 h-9 rounded-full bg-pnc-navy flex items-center justify-center shrink-0">
                    <span className="text-white text-[10px] font-bold">{t.initials}</span>
                  </div>
                  <div>
                    <p className="text-pnc-gray-900 text-xs font-semibold">{t.name}</p>
                    <p className="text-pnc-gray-500 text-[11px]">{t.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ────────────────────────────────────────── */}
      <section id="pricing" className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-6">
            <span className="text-pnc-navy text-xs font-bold tracking-widest">PRICING</span>
            <h2 className="text-pnc-gray-900 text-3xl sm:text-4xl font-black mt-3">
              Simple pricing, serious ROI
            </h2>
            <p className="text-pnc-gray-500 text-base mt-3 max-w-lg mx-auto">
              The average RM costs $85K/year. Brilliant Banker gives every RM superpowers
              for a fraction of one hire.
            </p>
          </div>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3 mb-10">
            <span className={`text-sm font-medium transition-colors ${!billingAnnual ? 'text-pnc-gray-900' : 'text-pnc-gray-400'}`}>Monthly</span>
            <button
              onClick={() => setBillingAnnual(!billingAnnual)}
              className={`relative inline-flex h-7 w-[52px] items-center rounded-full transition-colors ${
                billingAnnual ? 'bg-pnc-orange' : 'bg-pnc-gray-200'
              }`}
            >
              <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                billingAnnual ? 'translate-x-[27px]' : 'translate-x-[3px]'
              }`} />
            </button>
            <span className={`text-sm font-medium transition-colors ${billingAnnual ? 'text-pnc-gray-900' : 'text-pnc-gray-400'}`}>
              Annual
              <span className="ml-1.5 text-[10px] font-bold text-pnc-orange bg-pnc-orange/10 px-2 py-0.5 rounded-full">
                Save 20%
              </span>
            </span>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {PRICING.map((plan, i) => {
              const displayPrice = plan.price
                ? billingAnnual ? Math.round(plan.price * 0.8) : plan.price
                : null
              return (
                <div key={i} className={`rounded-2xl p-6 flex flex-col relative ${
                  plan.highlight
                    ? 'bg-pnc-navy text-white border-2 border-pnc-orange shadow-xl'
                    : 'bg-white border border-pnc-gray-200'
                }`}>
                  {plan.badge && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-pnc-orange text-white text-[10px] font-bold px-3 py-1 rounded-full">
                      {plan.badge}
                    </span>
                  )}
                  <h3 className={`text-lg font-bold ${plan.highlight ? 'text-white' : 'text-pnc-gray-900'}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-xs mt-1 ${plan.highlight ? 'text-white/60' : 'text-pnc-gray-500'}`}>
                    {plan.description}
                  </p>
                  <div className="mt-5 mb-6">
                    {displayPrice ? (
                      <div className="flex items-baseline gap-1">
                        <span className={`text-4xl font-black ${plan.highlight ? 'text-white' : 'text-pnc-gray-900'}`}>
                          ${displayPrice.toLocaleString()}
                        </span>
                        <span className={`text-sm ${plan.highlight ? 'text-white/50' : 'text-pnc-gray-500'}`}>/mo</span>
                      </div>
                    ) : (
                      <p className={`text-4xl font-black ${plan.highlight ? 'text-white' : 'text-pnc-gray-900'}`}>
                        Custom
                      </p>
                    )}
                  </div>
                  <ul className="space-y-2.5 flex-1">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2">
                        <Check size={14} className={`shrink-0 mt-0.5 ${
                          plan.highlight ? 'text-pnc-orange' : 'text-pnc-navy'
                        }`} />
                        <span className={`text-sm ${
                          plan.highlight ? 'text-white/80' : 'text-pnc-gray-700'
                        } ${f.includes('Everything') ? 'font-semibold' : ''}`}>
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={onBack}
                    className={`w-full mt-6 py-3 rounded-xl text-sm font-bold transition-colors ${
                      plan.highlight
                        ? 'bg-pnc-orange text-white active:bg-pnc-orange-dark'
                        : 'bg-pnc-navy text-white active:bg-pnc-navy-light'
                    }`}
                  >
                    {plan.cta}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── CTA BANNER ─────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-pnc-navy to-pnc-navy-light py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-white text-3xl sm:text-4xl font-black">
            From 596 bankers to 928K conversations
          </h2>
          <p className="text-white/60 text-base mt-4 max-w-xl mx-auto">
            PNC has the foundation. Brilliant Banker scales what your best RMs already do
            to every client in the portfolio. The demo is live. The code is real.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <button
              onClick={onBack}
              className="w-full sm:w-auto bg-pnc-orange text-white font-bold px-8 py-3.5 rounded-xl
                         active:bg-pnc-orange-dark transition-colors shadow-lg shadow-pnc-orange/25"
            >
              Launch the demo
            </button>
            <a
              href="mailto:demo@brilliantbanker.com?subject=Schedule%20a%20call"
              className="w-full sm:w-auto bg-white/10 text-white font-semibold px-8 py-3.5 rounded-xl
                         border border-white/20 active:bg-white/20 transition-colors text-center"
            >
              Schedule a call
            </a>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─────────────────────────────────────────── */}
      <footer className="bg-pnc-navy border-t border-white/10 py-10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Landmark size={18} className="text-pnc-orange" />
              <span className="text-white font-bold text-sm">Brilliant Banker</span>
            </div>
            <p className="text-white/30 text-xs">
              A prototype by CSL Innovation Lab. Not affiliated with PNC Financial Services.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
