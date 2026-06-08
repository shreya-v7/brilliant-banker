import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { MessageSquare, X } from 'lucide-react'
import { submitFeedback } from '../api'

export default function FeedbackPanel({ user, role }) {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [status, setStatus] = useState('idle')

  const handleSubmit = async (e) => {
    e.preventDefault()
    const text = comment.trim()
    if (!text) return

    setStatus('sending')
    try {
      await submitFeedback({
        role,
        screen_path: pathname,
        respondent_name: user.name,
        comment: text,
        rating: rating || null,
      })
      setStatus('done')
      setComment('')
      setRating(0)
      setTimeout(() => {
        setStatus('idle')
        setOpen(false)
      }, 2500)
    } catch {
      setStatus('error')
    }
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-[54] bg-black/20 sm:bg-transparent pointer-events-auto sm:pointer-events-none"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="fixed bottom-6 right-6 z-[55] flex flex-col items-end gap-3 pointer-events-none">
        {open && (
          <form
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="pointer-events-auto w-[min(calc(100vw-3rem),340px)] bg-white rounded-2xl shadow-2xl border border-pnc-gray-200 p-4 space-y-3 animate-fade-up"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-pnc-gray-900 text-sm font-bold">User testing feedback</p>
                <p className="text-pnc-gray-500 text-[10px] mt-0.5 font-mono truncate max-w-[240px]">
                  {pathname}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-pnc-gray-400 hover:text-pnc-gray-700 p-1"
                aria-label="Close feedback"
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <p className="text-pnc-gray-600 text-[10px] font-medium mb-1">Rating (optional)</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    className={`w-9 h-9 rounded-lg text-sm font-bold transition-colors ${
                      rating >= n
                        ? 'bg-pnc-orange text-white'
                        : 'bg-pnc-gray-50 border border-pnc-gray-200 text-pnc-gray-400 hover:border-pnc-orange/40'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-pnc-gray-600 text-[10px] font-medium mb-1 block" htmlFor={`feedback-${role}`}>
                Your feedback
              </label>
              <textarea
                id={`feedback-${role}`}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                placeholder="What worked? What was confusing?"
                className="w-full rounded-xl border border-pnc-gray-200 bg-white px-3 py-2 text-sm text-pnc-gray-900
                           placeholder:text-pnc-gray-400 outline-none focus:border-pnc-orange/50 focus:ring-2 focus:ring-pnc-orange/10 resize-none"
              />
            </div>

            {status === 'error' && (
              <p className="text-red-600 text-[10px]">Could not send — is the backend running?</p>
            )}
            {status === 'done' && (
              <p className="text-emerald-600 text-[10px] font-medium">Thanks — feedback recorded!</p>
            )}

            <button
              type="submit"
              disabled={status === 'sending' || !comment.trim()}
              className="w-full py-2.5 rounded-xl bg-pnc-navy text-white text-sm font-semibold
                         disabled:opacity-40 active:opacity-80 transition-opacity"
            >
              {status === 'sending' ? 'Sending…' : 'Submit feedback'}
            </button>
          </form>
        )}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="pointer-events-auto flex items-center gap-2 bg-pnc-navy text-white text-sm font-bold
                     px-4 py-3 rounded-full shadow-xl border-2 border-white/20 hover:bg-pnc-navy/90 transition-colors"
        >
          <MessageSquare size={16} className="text-pnc-orange" />
          Feedback
        </button>
      </div>
    </>
  )
}
