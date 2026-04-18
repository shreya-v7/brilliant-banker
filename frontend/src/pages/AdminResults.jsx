import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { getSurveyExportUrl, getSurveyResults } from '../api'

const NAVY = '#002D5F'
const ORANGE = '#E35205'
const STORAGE_KEY = 'bb-admin-survey-auth'

export default function AdminResults() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (pwd) => {
    setLoading(true)
    setError('')
    try {
      const res = await getSurveyResults(pwd)
      setData(res)
      sessionStorage.setItem(STORAGE_KEY, pwd)
    } catch (e) {
      setError(e.message || 'Could not load results')
      setData(null)
      sessionStorage.removeItem(STORAGE_KEY)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY)
    if (saved) load(saved)
  }, [load])

  const onSubmit = (e) => {
    e.preventDefault()
    load(password)
  }

  if (!data && !loading) {
    return (
      <div className="min-h-dvh bg-pnc-gray-100 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl border border-pnc-gray-200 shadow-sm p-8">
          <h1 className="text-xl font-bold text-pnc-navy mb-2">User Testing Results</h1>
          <p className="text-sm text-pnc-gray-600 mb-6">Enter password to view the dashboard.</p>
          <form onSubmit={onSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password to view results"
              className="w-full rounded-xl border border-pnc-gray-200 px-4 py-3 text-sm"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              className="w-full min-h-[48px] rounded-xl font-semibold text-white"
              style={{ backgroundColor: NAVY }}
            >
              Unlock
            </button>
          </form>
          <Link to="/" className="block text-center text-sm text-pnc-gray-500 mt-6 hover:text-pnc-orange">
            Back to app
          </Link>
        </div>
      </div>
    )
  }

  if (loading && !data) {
    return (
      <div className="min-h-dvh flex items-center justify-center text-pnc-gray-500">
        Loading...
      </div>
    )
  }

  const dr = data?.date_range || {}
  const npsColor =
    data.avg_nps == null ? 'text-pnc-gray-600' : data.avg_nps < 7 ? 'text-red-600' : data.avg_nps < 9 ? 'text-amber-600' : 'text-emerald-600'

  return (
    <div className="min-h-dvh bg-pnc-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-pnc-navy">Brilliant Banker: User Testing Results</h1>
            <p className="text-sm text-pnc-gray-600 mt-1">
              Total responses: <strong>{data.total_responses}</strong>
              {dr.min && dr.max && (
                <span className="text-pnc-gray-500">
                  {' '}
                  ({dr.min?.slice(0, 10)} to {dr.max?.slice(0, 10)})
                </span>
              )}
            </p>
          </div>
          <a
            href={getSurveyExportUrl(sessionStorage.getItem(STORAGE_KEY) || password)}
            className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-xl font-semibold text-white"
            style={{ backgroundColor: ORANGE }}
          >
            Download CSV
          </a>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-pnc-gray-200 p-5">
            <p className="text-xs font-semibold text-pnc-gray-500 uppercase">Total responses</p>
            <p className="text-3xl font-black text-pnc-navy mt-1">{data.total_responses}</p>
            <p className="text-sm text-pnc-gray-600 mt-2">
              SMB: {data.smb_count} &middot; Banker: {data.banker_count}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-pnc-gray-200 p-5">
            <p className="text-xs font-semibold text-pnc-gray-500 uppercase">Average NPS</p>
            <p className={`text-3xl font-black mt-1 ${npsColor}`}>
              {data.avg_nps != null ? data.avg_nps.toFixed(1) : 'n/a'}
            </p>
            <p className="text-xs text-pnc-gray-500 mt-2">
              SMB: {data.avg_nps_smb != null ? data.avg_nps_smb.toFixed(1) : 'n/a'} &middot; Banker:{' '}
              {data.avg_nps_banker != null ? data.avg_nps_banker.toFixed(1) : 'n/a'}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-pnc-gray-200 p-5">
            <p className="text-xs font-semibold text-pnc-gray-500 uppercase">Avg task completion</p>
            <p className="text-3xl font-black text-pnc-navy mt-1">
              {data.avg_task_completion_rate != null
                ? `${(data.avg_task_completion_rate * 100).toFixed(0)}%`
                : 'n/a'}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-pnc-gray-200 p-5">
            <p className="text-xs font-semibold text-pnc-gray-500 uppercase">Avg feature rating</p>
            <p className="text-3xl font-black text-pnc-navy mt-1">
              {data.avg_feature_rating != null ? data.avg_feature_rating.toFixed(2) : 'n/a'}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {(data.per_question || []).map((pq) => (
            <div key={pq.question_id} className="bg-white rounded-2xl border border-pnc-gray-200 p-6">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
                <h3 className="text-sm font-semibold text-pnc-navy max-w-3xl">{pq.question_text}</h3>
                <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-pnc-gray-100 text-pnc-gray-600">
                  {pq.answer_type}
                </span>
              </div>

              {(pq.answer_type === 'rating' || pq.answer_type === 'task_rating') && pq.distribution && (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={['1', '2', '3', '4', '5'].map((k) => ({ key: k, count: pq.distribution[k] || 0 }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="key" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill={NAVY} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <p className="text-sm text-pnc-gray-600 mt-2">
                    Average: {pq.avg_rating != null ? pq.avg_rating : 'n/a'}
                    {pq.answer_type === 'task_rating' && pq.task_completion_rate != null && (
                      <span className="ml-3">
                        Task completion: {(pq.task_completion_rate * 100).toFixed(0)}%
                      </span>
                    )}
                  </p>
                </div>
              )}

              {pq.answer_type === 'multiple_choice' && pq.choices && (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={Object.entries(pq.choices).map(([name, count]) => ({
                        name: name.length > 40 ? `${name.slice(0, 40)}...` : name,
                        count,
                      }))}
                      layout="vertical"
                      margin={{ left: 16 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis dataKey="name" type="category" width={200} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill={ORANGE} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {pq.answer_type === 'free_text' && pq.free_texts && (
                <div className="max-h-48 overflow-y-auto space-y-2 text-sm text-pnc-gray-700 border border-pnc-gray-100 rounded-xl p-3">
                  {pq.free_texts.map((t, i) => (
                    <p key={i} className="border-b border-pnc-gray-100 last:border-0 pb-2 last:pb-0">
                      {t}
                    </p>
                  ))}
                </div>
              )}

              {pq.answer_type === 'nps' && pq.nps_distribution && (
                <div className="flex flex-col lg:flex-row gap-6 items-center">
                  <div className="w-full h-52 max-w-xs">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Detractors', value: pq.nps_distribution.detractor || 0 },
                            { name: 'Passives', value: pq.nps_distribution.passive || 0 },
                            { name: 'Promoters', value: pq.nps_distribution.promoter || 0 },
                          ]}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          label
                        >
                          <Cell fill="#fecaca" />
                          <Cell fill="#fde68a" />
                          <Cell fill="#bbf7d0" />
                        </Pie>
                        <Legend />
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-sm text-pnc-gray-600">
                    Average NPS score: {pq.nps_avg != null ? pq.nps_avg : 'n/a'}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-pnc-gray-200 p-6">
          <h3 className="text-sm font-bold text-pnc-navy mb-3">Recent comments</h3>
          <ul className="space-y-3">
            {(data.recent_comments || []).map((c, i) => (
              <li key={i} className="text-sm border-b border-pnc-gray-100 pb-3 last:border-0">
                <span className="font-semibold text-pnc-navy">{c.name}</span>
                <span className="text-pnc-gray-400 text-xs ml-2">{c.role}</span>
                <p className="text-pnc-gray-700 mt-1">{c.comment}</p>
                <p className="text-[10px] text-pnc-gray-400 mt-1">{c.date}</p>
              </li>
            ))}
          </ul>
        </div>

        <Link to="/" className="inline-block text-sm text-pnc-gray-500 hover:text-pnc-orange">
          Back to app
        </Link>
      </div>
    </div>
  )
}
