import { useState } from 'react'
import {
  ArrowLeft,
  Coffee,
  ChevronRight,
  Flower2,
  Shirt,
  Play,
} from 'lucide-react'

const CHARACTERS = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Maya Patel',
    business: 'Floral Design',
    icon: Flower2,
    color: 'bg-rose-500',
    colorLight: 'bg-rose-50',
    textColor: 'text-rose-700',
    borderColor: 'border-rose-200',
    painPoints: [
      'February and May are huge - Valentine\'s, Mother\'s Day, weddings - then March drops; cash flow looks scary without seasonality',
      'She doesn\'t want "financial wellness" - she wants someone who can read a spreadsheet',
      'Random product emails instead of "based on your patterns, set cash aside now"',
      'Third different "my banker" in two years - re-explains her business every time',
      'Profitable, no debt, two locations - still denied a credit line after weeks of underwriting; Square offers cash in two clicks',
      'POS, QuickBooks, Venmo, bank - all patched together; switching banks means payroll, vendors, relinks',
    ],
    quote: '"Somebody\'s going to figure this out, right? Some bank is going to actually look at businesses like ours, understand that we\'re seasonal, and talk to us like they\'ve seen our numbers. Because they have."',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Priya Rao',
    business: 'Dry Cleaning',
    icon: Shirt,
    color: 'bg-violet-500',
    colorLight: 'bg-violet-50',
    textColor: 'text-violet-700',
    borderColor: 'border-violet-200',
    painPoints: [
      'Business mobile deposit limit - large checks (e.g. Marriott account) mean branch trips; personal deposits are fine, business gets "please visit your nearest branch"',
      'January is brutal after the holidays - no proactive "slow season\'s coming" from the bank',
      'Second-location loan: banker said it would "sail through" - denied three weeks later, had to call for the story',
      'Credit union looked at the same facts and worked with her - support exists, it\'s just inconsistent',
      'Bank has the deposit history but she still explains herself from scratch every time',
    ],
    quote: '"When they do? I\'m gone. I don\'t care how many direct deposits I have to update."',
  },
]

export default function Scene({ onBack, onLoginAsCharacter }) {
  const [selected, setSelected] = useState(null)

  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 flex flex-col">
      {/* Header */}
      <header className="px-5 pt-5 pb-3 flex items-center gap-3 shrink-0">
        <button onClick={onBack} className="text-white/50 p-1 -ml-1 hover:text-white transition-colors">
          <ArrowLeft size={22} />
        </button>
        <div className="flex-1" />
        <Coffee size={18} className="text-amber-400" />
      </header>

      {/* Title */}
      <div className="px-6 pb-4 text-center">
        <p className="text-amber-400 text-[10px] font-bold tracking-[0.2em] uppercase mb-2">
          Customer Discovery Skit
        </p>
        <h1 className="text-white text-2xl sm:text-3xl font-black leading-tight">
          The Brilliant Banker
        </h1>
        <p className="text-white/40 text-xs mt-2 max-w-sm mx-auto">
          Pick a character to walk through the app as them.
          See the pain points the product solves firsthand.
        </p>
      </div>

      {/* Character cards */}
      <div className="flex-1 px-5 pb-8 overflow-y-auto">
        <div className="max-w-lg mx-auto space-y-4">
          {CHARACTERS.map((char) => {
            const Icon = char.icon
            const isSelected = selected === char.id

            return (
              <div key={char.id}>
                <button
                  onClick={() => setSelected(isSelected ? null : char.id)}
                  className={`w-full rounded-2xl p-5 text-left transition-all border ${
                    isSelected
                      ? `${char.colorLight} ${char.borderColor}`
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className={`w-14 h-14 rounded-full ${char.color} flex items-center justify-center shrink-0`}>
                      <Icon size={26} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <h2 className={`text-lg font-bold ${isSelected ? 'text-slate-900' : 'text-white'}`}>
                        {char.name}
                      </h2>
                      <p className={`text-sm ${isSelected ? 'text-slate-500' : 'text-white/50'}`}>
                        {char.business}
                      </p>
                    </div>
                    <ChevronRight
                      size={20}
                      className={`shrink-0 transition-transform ${isSelected ? `${char.textColor} rotate-90` : 'text-white/30'}`}
                    />
                  </div>

                  {/* Quote */}
                  <p className={`text-sm italic leading-relaxed ${isSelected ? 'text-slate-600' : 'text-white/30'}`}>
                    {char.quote}
                  </p>
                </button>

                {/* Expanded detail */}
                {isSelected && (
                  <div className={`mt-2 rounded-2xl ${char.colorLight} border ${char.borderColor} p-4 animate-fade-up`}>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${char.textColor} mb-3`}>
                      Pain Points from the Skit
                    </p>
                    <ul className="space-y-2 mb-4">
                      {char.painPoints.map((point, i) => (
                        <li key={i} className="flex items-start gap-2 text-slate-700 text-sm leading-relaxed">
                          <span className={`${char.textColor} mt-1 shrink-0 font-bold`}>→</span>
                          {point}
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onLoginAsCharacter(char.id)
                      }}
                      className={`w-full flex items-center justify-center gap-2 ${char.color} text-white
                                  text-sm font-bold py-3 rounded-xl active:opacity-80 transition-opacity`}
                    >
                      <Play size={16} />
                      Enter App as {char.name.split(' ')[0]}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Scene context */}
        <div className="max-w-lg mx-auto mt-6 bg-white/5 border border-white/10 rounded-2xl p-4">
          <p className="text-white/30 text-xs text-center italic leading-relaxed">
            "The basics mostly work… until you need anything slightly more thoughtful."
          </p>
          <p className="text-white/20 text-[10px] text-center mt-2">
            3 minutes · 2 actors · 1 table · 2 coffee cups
          </p>
        </div>
      </div>
    </div>
  )
}
