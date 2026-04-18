import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { submitSurvey } from '../../api'

const NAVY = '#002D5F'
const ORANGE = '#E35205'

function ProgressBar({ step, total }) {
  const pct = total > 0 ? (step / total) * 100 : 0
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold text-pnc-gray-600 mb-2">
        Step {step} of {total}
      </p>
      <div className="h-1.5 rounded-full bg-pnc-gray-200 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, backgroundColor: ORANGE }} />
      </div>
    </div>
  )
}

function Rating5({ value, onChange, low, high }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between text-[10px] text-pnc-gray-500 px-0.5">
        <span>{low}</span>
        <span>{high}</span>
      </div>
      <div className="flex gap-2 justify-between">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex-1 min-h-[44px] rounded-xl text-sm font-bold border-2 transition-colors ${
              value === n ? 'text-white border-transparent' : 'bg-white border-pnc-gray-200 text-pnc-gray-700'
            }`}
            style={value === n ? { backgroundColor: NAVY } : {}}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

function NpsScale({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5 justify-center">
      {Array.from({ length: 11 }, (_, i) => i).map((n) => {
        let bg = 'bg-red-50 border-red-200'
        if (n >= 7 && n <= 8) bg = 'bg-amber-50 border-amber-200'
        if (n >= 9) bg = 'bg-emerald-50 border-emerald-200'
        const selected = value === n
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`min-h-[44px] min-w-[44px] rounded-xl text-sm font-bold border-2 ${bg} ${
              selected ? 'ring-2 ring-[#002D5F] ring-offset-1' : ''
            }`}
          >
            {n}
          </button>
        )
      })}
    </div>
  )
}

function McOptions({ options, value, onChange }) {
  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`w-full text-left min-h-[48px] px-4 py-3 rounded-xl border-2 text-sm font-medium transition-colors ${
            value === opt ? 'border-l-4 bg-slate-50' : 'border-pnc-gray-200 bg-white'
          }`}
          style={value === opt ? { borderLeftColor: NAVY, borderColor: '#e5e7eb' } : {}}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

export default function UserTestWizard({ role, steps, storageKey, totalTaskCount }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const testing =
    searchParams.get('testing') === 'true' || searchParams.get('testing') === '1'

  const [stepIndex, setStepIndex] = useState(-1)
  const [intro, setIntro] = useState({ name: '', business: '', email: '' })
  const [taskDone, setTaskDone] = useState({})
  const [taskPhase, setTaskPhase] = useState('task')
  const [answers, setAnswers] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const totalSurveySteps = steps.length

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed.intro) setIntro(parsed.intro)
        if (parsed.answers) setAnswers(parsed.answers)
        if (parsed.taskDone) setTaskDone(parsed.taskDone)
        if (typeof parsed.stepIndex === 'number') setStepIndex(parsed.stepIndex)
      }
    } catch {
      /* ignore */
    }
    if (testing) sessionStorage.setItem('bb-survey-active', role)
  }, [testing, storageKey, role])

  useEffect(() => {
    const payload = { intro, answers, taskDone, stepIndex }
    sessionStorage.setItem(storageKey, JSON.stringify(payload))
  }, [storageKey, intro, answers, taskDone, stepIndex])

  const current = stepIndex >= 0 ? steps[stepIndex] : null

  useEffect(() => {
    if (!current) return
    const hasTask = current.kind === 'task_rating' || current.kind === 'task_mc'
    if (hasTask) {
      setTaskPhase(taskDone[current.id] ? 'question' : 'task')
    } else {
      setTaskPhase('question')
    }
  }, [stepIndex, current, taskDone])

  const setAns = useCallback((id, v) => {
    setAnswers((prev) => ({ ...prev, [id]: v }))
  }, [])

  const clearSurveySession = () => {
    sessionStorage.removeItem('bb-survey-active')
    sessionStorage.removeItem(storageKey)
  }

  const goTask = (path) => {
    const sep = path.includes('?') ? '&' : '?'
    navigate(`${path}${sep}testing=true`)
  }

  const canNextIntro = intro.name.trim().length > 0

  const canNextStep = useMemo(() => {
    if (!current) return false
    const a = answers[current.id] || {}
    if (current.kind === 'task_rating') {
      if (taskPhase === 'task') return false
      return typeof a.rating === 'number'
    }
    if (current.kind === 'task_mc') {
      if (taskPhase === 'task') return false
      return typeof a.choice === 'string' && a.choice.length > 0
    }
    if (current.kind === 'multi') return typeof a.choice === 'string' && a.choice.length > 0
    if (current.kind === 'free') return typeof a.text === 'string' && a.text.trim().length > 0
    if (current.kind === 'nps_pair') {
      return typeof a.nps === 'number' && typeof a.why === 'string' && a.why.trim().length > 0
    }
    return false
  }, [current, answers, taskPhase])

  const handleBack = () => {
    if (stepIndex <= -1) return
    setStepIndex((s) => s - 1)
  }

  const handleNext = async () => {
    if (stepIndex === -1) {
      if (!canNextIntro) return
      setStepIndex(0)
      return
    }
    if (!current) return
    const hasTask = current.kind === 'task_rating' || current.kind === 'task_mc'
    if (hasTask && taskPhase === 'task') return
    if (stepIndex >= totalSurveySteps - 1) {
      await handleSubmit()
      return
    }
    setStepIndex((s) => s + 1)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const responses = []
      let overallNps = null
      let overallComment = null
      let taskCompleteCount = 0

      for (const st of steps) {
        const a = answers[st.id]
        if (!a) continue
        if (st.kind === 'task_rating') {
          if (taskDone[st.id]) taskCompleteCount += 1
          responses.push({
            question_id: st.id,
            question_text: st.questionText,
            answer_type: 'task_rating',
            answer: String(a.rating ?? ''),
            task_completed: !!taskDone[st.id],
          })
        } else if (st.kind === 'task_mc') {
          if (taskDone[st.id]) taskCompleteCount += 1
          responses.push({
            question_id: st.id,
            question_text: st.questionText,
            answer_type: 'multiple_choice',
            answer: a.choice,
            task_completed: !!taskDone[st.id],
          })
        } else if (st.kind === 'multi') {
          responses.push({
            question_id: st.id,
            question_text: st.questionText,
            answer_type: 'multiple_choice',
            answer: a.choice,
            task_completed: false,
          })
        } else if (st.kind === 'free') {
          responses.push({
            question_id: st.id,
            question_text: st.questionText,
            answer_type: 'free_text',
            answer: a.text,
            task_completed: false,
          })
        } else if (st.kind === 'nps_pair') {
          overallNps = a.nps
          overallComment = a.why
          responses.push({
            question_id: `${st.id}_nps`,
            question_text: st.questionText,
            answer_type: 'nps',
            answer: String(a.nps),
            task_completed: false,
          })
          responses.push({
            question_id: `${st.id}_why`,
            question_text: st.followUpLabel,
            answer_type: 'free_text',
            answer: a.why,
            task_completed: false,
          })
        }
      }

      await submitSurvey({
        role,
        respondent_name: intro.name.trim(),
        respondent_business: role === 'smb' ? (intro.business || '').trim() || null : null,
        respondent_email: (intro.email || '').trim() || null,
        tasks_completed: taskCompleteCount,
        total_tasks: totalTaskCount,
        responses,
        overall_nps: overallNps,
        overall_comment: overallComment,
      })
      setDone(true)
      clearSurveySession()
    } catch (e) {
      console.error(e)
      alert('Could not submit. Check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    const summary = steps
      .map((st) => {
        const a = answers[st.id]
        if (!a) return null
        if (st.kind === 'task_rating') {
          if (a.rating == null) return null
          return { label: st.questionText.slice(0, 56), value: String(a.rating) }
        }
        if (st.kind === 'task_mc' || st.kind === 'multi') {
          if (!a.choice) return null
          return { label: st.questionText.slice(0, 56), value: a.choice }
        }
        if (st.kind === 'nps_pair') return { label: 'Recommendation score (NPS)', value: String(a.nps) }
        return null
      })
      .filter(Boolean)

    return (
      <div className="px-4 py-8 max-w-lg mx-auto">
        <h2 className="text-xl font-bold text-pnc-navy mb-2">Thank you, {intro.name.trim()}!</h2>
        <p className="text-pnc-gray-600 text-sm mb-6">Your feedback has been recorded.</p>
        <ul className="space-y-2 mb-8">
          {summary.map((row, i) => (
            <li key={i} className="text-sm border border-pnc-gray-200 rounded-xl px-3 py-2 flex justify-between gap-2">
              <span className="text-pnc-gray-600">{row.label}</span>
              <span className="font-semibold text-pnc-navy shrink-0">{row.value}</span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => navigate(role === 'smb' ? '/business' : '/banker')}
          className="w-full min-h-[48px] rounded-xl font-semibold text-white"
          style={{ backgroundColor: NAVY }}
        >
          Return to app
        </button>
      </div>
    )
  }

  if (stepIndex === -1) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto pb-24">
        <h2 className="text-lg font-bold text-pnc-navy mb-4">Before you begin</h2>
        <div className="space-y-4 bg-white border border-pnc-gray-200 rounded-2xl p-4">
          <div>
            <label className="text-xs font-semibold text-pnc-gray-600">Your name</label>
            <input
              value={intro.name}
              onChange={(e) => setIntro((x) => ({ ...x, name: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-pnc-gray-200 px-3 py-3 text-sm"
              placeholder="Required"
              autoComplete="name"
            />
          </div>
          {role === 'smb' && (
            <div>
              <label className="text-xs font-semibold text-pnc-gray-600">Your business name</label>
              <input
                value={intro.business}
                onChange={(e) => setIntro((x) => ({ ...x, business: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-pnc-gray-200 px-3 py-3 text-sm"
                placeholder="Optional"
              />
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-pnc-gray-600">Email</label>
            <input
              value={intro.email}
              onChange={(e) => setIntro((x) => ({ ...x, email: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-pnc-gray-200 px-3 py-3 text-sm"
              placeholder="Optional"
              type="email"
            />
          </div>
        </div>
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 border-t border-pnc-gray-200 px-4 py-3 flex justify-end max-w-lg mx-auto sm:static sm:border-0 sm:bg-transparent sm:mt-8 sm:px-0">
          <button
            type="button"
            disabled={!canNextIntro}
            onClick={() => setStepIndex(0)}
            className="inline-flex items-center gap-2 min-h-[48px] px-6 rounded-xl font-semibold text-white disabled:opacity-40"
            style={{ backgroundColor: NAVY }}
          >
            Next
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    )
  }

  if (!current) return null

  const hasTask = current.kind === 'task_rating' || current.kind === 'task_mc'
  const a = answers[current.id] || {}

  return (
    <div className="px-4 py-4 pb-28 max-w-lg mx-auto">
      <ProgressBar step={stepIndex + 1} total={totalSurveySteps} />

      {hasTask && taskPhase === 'task' && (
        <div className="bg-white border border-pnc-gray-200 rounded-2xl p-4 mb-4">
          <p className="text-sm text-pnc-gray-800 leading-relaxed mb-4">{current.instruction}</p>
          <button
            type="button"
            onClick={() => goTask(current.linkPath)}
            className="w-full min-h-[48px] rounded-xl font-semibold text-white mb-4"
            style={{ backgroundColor: ORANGE }}
          >
            {current.linkLabel}
          </button>
          <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
            <input
              type="checkbox"
              checked={!!taskDone[current.id]}
              onChange={(e) =>
                setTaskDone((prev) => ({
                  ...prev,
                  [current.id]: e.target.checked,
                }))
              }
              className="w-5 h-5 rounded border-pnc-gray-300"
            />
            <span className="text-sm font-medium text-pnc-gray-800">I have completed this task</span>
          </label>
        </div>
      )}

      {(!hasTask || taskPhase === 'question') && (
        <div>
          <h3 className="text-base font-semibold text-pnc-navy mb-3">{current.questionText}</h3>
          {current.kind === 'task_rating' && (
            <Rating5
              value={a.rating}
              onChange={(n) => setAns(current.id, { ...a, rating: n })}
              low="Not useful"
              high="Extremely useful"
            />
          )}
          {current.kind === 'task_mc' && (
            <McOptions
              options={current.options}
              value={a.choice}
              onChange={(c) => setAns(current.id, { ...a, choice: c })}
            />
          )}
          {current.kind === 'multi' && (
            <McOptions
              options={current.options}
              value={a.choice}
              onChange={(c) => setAns(current.id, { ...a, choice: c })}
            />
          )}
          {current.kind === 'free' && (
            <textarea
              value={a.text || ''}
              onChange={(e) => setAns(current.id, { ...a, text: e.target.value })}
              rows={4}
              placeholder={current.placeholder}
              className="w-full rounded-xl border border-pnc-gray-200 px-3 py-3 text-sm min-h-[96px]"
            />
          )}
          {current.kind === 'nps_pair' && (
            <div className="space-y-4">
              <NpsScale value={a.nps} onChange={(n) => setAns(current.id, { ...a, nps: n })} />
              <div>
                <label className="text-xs font-semibold text-pnc-gray-600">{current.followUpLabel}</label>
                <textarea
                  value={a.why || ''}
                  onChange={(e) => setAns(current.id, { ...a, why: e.target.value })}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-pnc-gray-200 px-3 py-3 text-sm min-h-[80px]"
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white/95 border-t border-pnc-gray-200 px-4 py-3 flex justify-between items-center max-w-lg mx-auto sm:relative sm:border-0 sm:bg-transparent sm:px-0 sm:mt-8 sm:pb-0">
        <button
          type="button"
          onClick={handleBack}
          disabled={stepIndex <= -1}
          className="inline-flex items-center gap-1 text-sm font-medium text-pnc-gray-500 disabled:opacity-30 min-h-[44px]"
        >
          <ChevronLeft size={18} />
          Back
        </button>
        <button
          type="button"
          disabled={!canNextStep || submitting}
          onClick={handleNext}
          className="inline-flex items-center gap-2 min-h-[48px] px-6 rounded-xl font-semibold text-white disabled:opacity-40"
          style={{ backgroundColor: NAVY }}
        >
          {stepIndex >= totalSurveySteps - 1 ? (submitting ? 'Sending...' : 'Submit') : 'Next'}
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}
