import { useState, useEffect, useRef, useCallback } from 'react'
import { getChatHistory, sendMessage } from '../api'
import { ArrowLeft, Send, Bot, Sparkles, Mail, Phone, Ticket, User } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

const SUGGESTIONS = [
  "What's my cash flow forecast?",
  "Can I get a $25K credit line?",
  "What are your branch hours?",
  "Connect me with a banker",
]

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 animate-fade-up">
      <div className="w-8 h-8 rounded-full bg-pnc-navy flex items-center justify-center shrink-0">
        <Bot size={16} className="text-white" />
      </div>
      <div className="bg-pnc-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex gap-1.5">
          <span className="typing-dot w-2 h-2 bg-pnc-gray-500 rounded-full inline-block" />
          <span className="typing-dot w-2 h-2 bg-pnc-gray-500 rounded-full inline-block" />
          <span className="typing-dot w-2 h-2 bg-pnc-gray-500 rounded-full inline-block" />
        </div>
      </div>
    </div>
  )
}

function IntentBadge({ intent }) {
  const labels = {
    cash_flow_query: 'Cash Flow',
    credit_prequal_request: 'Credit Check',
    faq_question: 'FAQ',
    escalate_to_banker: 'Escalation',
    general_chat: null,
  }
  const colors = {
    cash_flow_query: 'bg-blue-50 text-blue-700',
    credit_prequal_request: 'bg-amber-50 text-amber-700',
    faq_question: 'bg-green-50 text-green-700',
    escalate_to_banker: 'bg-red-50 text-red-700',
  }
  const label = labels[intent]
  if (!label) return null
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${colors[intent] || ''}`}>
      <Sparkles size={10} />
      {label}
    </span>
  )
}

export default function Chat({ user }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

  // Accept demo prompt injected from DemoGuide
  useEffect(() => {
    if (location.state?.demoPrompt && loaded) {
      setInput(location.state.demoPrompt)
      // Clear the state so it doesn't re-trigger on re-render
      navigate('/chat', { replace: true, state: {} })
    }
  }, [location.state?.demoPrompt, loaded])

  useEffect(() => {
    getChatHistory(user.smb_id)
      .then((history) => {
        setMessages(history.map(m => ({ ...m, animate: false })))
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [user.smb_id])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, sending])

  const handleSend = useCallback(async (text) => {
    const msg = (text || input).trim()
    if (!msg || sending) return

    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: msg, animate: true }])
    setSending(true)

    try {
      const res = await sendMessage(user.smb_id, msg)
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: res.reply,
          intent: res.intent,
          escalated: res.escalated,
          ticket_number: res.ticket_number,
          assigned_rm: res.assigned_rm,
          animate: true,
        },
      ])
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.', animate: true },
      ])
    } finally {
      setSending(false)
    }
  }, [input, sending, user.smb_id])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <header className="bg-pnc-navy px-3 pt-3 pb-3 flex items-center gap-3 shrink-0">
        <button onClick={() => navigate('/')} className="text-white p-1 -ml-1 active:opacity-70">
          <ArrowLeft size={22} />
        </button>
        <div className="w-9 h-9 rounded-full bg-pnc-orange/20 flex items-center justify-center">
          <Bot size={20} className="text-pnc-orange" />
        </div>
        <div>
          <h1 className="text-white text-base font-semibold leading-tight">Brilliant Banker</h1>
          <p className="text-white/60 text-xs">AI Assistant</p>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {!loaded ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-pnc-orange border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 && !sending ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-full bg-pnc-orange/10 flex items-center justify-center mb-4">
              <Bot size={32} className="text-pnc-orange" />
            </div>
            <h2 className="text-pnc-gray-900 font-semibold text-base">
              Hi {user.name.split(' ')[0]}!
            </h2>
            <p className="text-pnc-gray-500 text-sm mt-1.5 max-w-[260px]">
              I can help you check cash flow, explore credit options, answer account questions, or connect you with your Relationship Manager.
            </p>
            <div className="mt-6 w-full space-y-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="w-full text-left text-sm text-pnc-navy bg-pnc-gray-50 border border-pnc-gray-200 
                             rounded-xl px-4 py-3 active:bg-pnc-gray-100 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'items-end gap-2'} ${
                  m.animate ? 'animate-fade-up' : ''
                }`}
              >
                {m.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-pnc-navy flex items-center justify-center shrink-0">
                    <Bot size={16} className="text-white" />
                  </div>
                )}
                <div className="max-w-[80%]">
                  {m.intent && m.role === 'assistant' && (
                    <div className="mb-1">
                      <IntentBadge intent={m.intent} />
                    </div>
                  )}
                  <div
                    className={`px-4 py-2.5 text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-pnc-orange text-white rounded-2xl rounded-br-md'
                        : 'bg-pnc-gray-100 text-pnc-gray-900 rounded-2xl rounded-bl-md'
                    }`}
                  >
                    {m.content}
                  </div>
                  {m.escalated && m.role === 'assistant' && m.assigned_rm && (
                    <div className="mt-2 bg-pnc-navy/5 border border-pnc-navy/10 rounded-xl p-3 space-y-2">
                      {m.ticket_number && (
                        <div className="flex items-center gap-1.5">
                          <Ticket size={12} className="text-pnc-orange" />
                          <span className="text-[10px] font-bold text-pnc-orange tracking-wide">
                            {m.ticket_number}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-pnc-navy flex items-center justify-center shrink-0">
                          <span className="text-white text-[10px] font-bold">
                            {m.assigned_rm.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="text-pnc-gray-900 text-xs font-semibold">{m.assigned_rm.name}</p>
                          <p className="text-pnc-gray-500 text-[10px]">{m.assigned_rm.title}</p>
                        </div>
                      </div>
                      <a
                        href={`mailto:${m.assigned_rm.email}`}
                        className="flex items-center gap-1.5 text-pnc-navy text-xs font-medium active:opacity-70"
                      >
                        <Mail size={12} />
                        {m.assigned_rm.email}
                      </a>
                    </div>
                  )}
                  {m.escalated && m.role === 'assistant' && !m.assigned_rm && (
                    <p className="text-[10px] text-amber-600 mt-1 ml-1 font-medium">
                      Your Relationship Manager has been notified
                    </p>
                  )}
                </div>
              </div>
            ))}
            {sending && <TypingIndicator />}
          </>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-pnc-gray-200 px-3 py-2.5 safe-bottom shrink-0 bg-white">
        <div className="flex items-end gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            disabled={sending}
            className="flex-1 bg-pnc-gray-50 border border-pnc-gray-200 rounded-full px-4 py-2.5 text-sm
                       text-pnc-gray-900 placeholder:text-pnc-gray-500 outline-none
                       focus:border-pnc-orange/50 focus:ring-2 focus:ring-pnc-orange/10 transition-all
                       disabled:opacity-50"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || sending}
            className="w-10 h-10 bg-pnc-orange rounded-full flex items-center justify-center shrink-0
                       active:bg-pnc-orange-dark disabled:opacity-40 transition-colors"
          >
            <Send size={18} className="text-white ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
