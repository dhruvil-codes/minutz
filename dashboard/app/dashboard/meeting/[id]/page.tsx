'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Copy, Check } from 'lucide-react'

interface Summary {
  executive_summary: string | null
  action_items: string[]
  decisions: string[]
  follow_ups: string[]
  sentiment: string | null
  urgency: string | null
  niche_data: Record<string, unknown>
}

interface Meeting {
  id: string
  title: string
  niche: string
  status: string
  created_at: string
  summary: Summary | null
  transcript: string | null
}

const NICHE_COLORS: Record<string, string> = {
  sales: '#3B82F6',
  pm: '#A855F7',
  financial: '#10B981',
  general: '#6B7280',
}

const SENTIMENT_COLORS: Record<string, string> = {
  positive: '#10B981',
  neutral: '#64748B',
  negative: '#EF4444',
}

const URGENCY_COLORS: Record<string, string> = {
  high: '#EF4444',
  medium: '#EAB308',
  low: '#10B981',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="text-xs font-medium px-2.5 py-1 rounded-full capitalize"
      style={{ background: `${color}22`, color }}
    >
      {label}
    </span>
  )
}

export default function MeetingDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  useEffect(() => {
    fetch(`http://localhost:8001/meeting/${id}`)
      .then(r => r.json())
      .then(data => { setMeeting(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  function copyActionItems() {
    const items = meeting?.summary?.action_items ?? []
    const text = items.map(i => `- ${i}`).join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function sendToSlack() {
    try {
      const res = await fetch('http://localhost:8001/send-to-slack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meeting_id: id }),
      })
      if (res.ok) showToast('Sent to Slack!', true)
      else showToast('Slack send failed', false)
    } catch {
      showToast('Slack send failed', false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0F', color: '#64748B' }}>
        Loading…
      </div>
    )
  }

  if (!meeting) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0F', color: '#F8FAFC' }}>
        <div className="text-center">
          <p className="text-lg mb-4">Meeting not found</p>
          <Button onClick={() => router.push('/dashboard')} variant="outline" className="border-[#1E1E2E] text-[#F8FAFC] bg-transparent">
            Back to dashboard
          </Button>
        </div>
      </div>
    )
  }

  const s = meeting.summary
  const nicheColor = NICHE_COLORS[meeting.niche] ?? NICHE_COLORS.general

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0F', color: '#F8FAFC' }}>
      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-lg"
          style={{ background: toast.ok ? '#10B981' : '#EF4444', color: '#fff' }}
        >
          {toast.msg}
        </div>
      )}

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Back */}
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-1.5 text-sm mb-8 hover:opacity-80 transition-opacity"
          style={{ color: '#64748B' }}
        >
          <ArrowLeft size={14} /> Back to meetings
        </button>

        {/* Header */}
        <h1 className="text-3xl font-bold mb-4">{meeting.title}</h1>
        <div className="flex flex-wrap gap-2 mb-8">
          <Chip label={meeting.niche} color={nicheColor} />
          {s?.sentiment && (
            <Chip label={s.sentiment} color={SENTIMENT_COLORS[s.sentiment] ?? '#64748B'} />
          )}
          <Chip label={formatDate(meeting.created_at)} color="#64748B" />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="summary">
          <TabsList className="mb-6 bg-[#13131A] border border-[#1E1E2E]">
            <TabsTrigger value="summary" className="data-[state=active]:bg-[#1E1E2E] data-[state=active]:text-[#F8FAFC] text-[#64748B]">
              Summary
            </TabsTrigger>
            <TabsTrigger value="actions" className="data-[state=active]:bg-[#1E1E2E] data-[state=active]:text-[#F8FAFC] text-[#64748B]">
              Action Items
            </TabsTrigger>
            <TabsTrigger value="decisions" className="data-[state=active]:bg-[#1E1E2E] data-[state=active]:text-[#F8FAFC] text-[#64748B]">
              Decisions & Follow-ups
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Summary */}
          <TabsContent value="summary" className="space-y-4">
            <div className="p-5 rounded-xl" style={{ background: '#13131A', border: '1px solid #1E1E2E' }}>
              <p className="text-sm font-semibold mb-3" style={{ color: '#64748B' }}>EXECUTIVE SUMMARY</p>
              <p className="leading-relaxed" style={{ color: '#F8FAFC' }}>
                {s?.executive_summary ?? 'No summary available yet.'}
              </p>
            </div>
            <div className="flex gap-3">
              {s?.sentiment && (
                <div className="p-4 rounded-xl flex-1" style={{ background: '#13131A', border: '1px solid #1E1E2E' }}>
                  <p className="text-xs mb-1" style={{ color: '#64748B' }}>Sentiment</p>
                  <p className="font-semibold capitalize" style={{ color: SENTIMENT_COLORS[s.sentiment] ?? '#F8FAFC' }}>
                    {s.sentiment}
                  </p>
                </div>
              )}
              {s?.urgency && (
                <div className="p-4 rounded-xl flex-1" style={{ background: '#13131A', border: '1px solid #1E1E2E' }}>
                  <p className="text-xs mb-1" style={{ color: '#64748B' }}>Urgency</p>
                  <p className="font-semibold capitalize" style={{ color: URGENCY_COLORS[s.urgency] ?? '#F8FAFC' }}>
                    {s.urgency}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab 2: Action Items */}
          <TabsContent value="actions" className="space-y-3">
            <div className="flex justify-end">
              <Button
                onClick={copyActionItems}
                variant="outline"
                size="sm"
                className="border-[#1E1E2E] text-[#F8FAFC] bg-transparent hover:bg-[#1E1E2E] gap-1.5"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy all'}
              </Button>
            </div>
            {(s?.action_items ?? []).length === 0 ? (
              <p style={{ color: '#64748B' }}>No action items found.</p>
            ) : (
              s?.action_items.map((item, i) => {
                const ownerMatch = item.match(/\(([^)]+)\)$/)
                const owner = ownerMatch?.[1]
                const text = owner ? item.slice(0, item.lastIndexOf('(')).trim() : item
                return (
                  <div
                    key={i}
                    className="p-4 rounded-xl flex items-start justify-between gap-3"
                    style={{ background: '#13131A', border: '1px solid #1E1E2E' }}
                  >
                    <p className="text-sm">{text}</p>
                    {owner && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full shrink-0"
                        style={{ background: '#6366F122', color: '#6366F1' }}
                      >
                        {owner}
                      </span>
                    )}
                  </div>
                )
              })
            )}
          </TabsContent>

          {/* Tab 3: Decisions & Follow-ups */}
          <TabsContent value="decisions" className="space-y-4">
            <div className="p-5 rounded-xl" style={{ background: '#13131A', border: '1px solid #1E1E2E' }}>
              <p className="text-sm font-semibold mb-3" style={{ color: '#64748B' }}>DECISIONS</p>
              {(s?.decisions ?? []).length === 0 ? (
                <p className="text-sm" style={{ color: '#64748B' }}>No decisions recorded.</p>
              ) : (
                <ol className="space-y-2 list-decimal list-inside">
                  {s?.decisions.map((d, i) => (
                    <li key={i} className="text-sm">{d}</li>
                  ))}
                </ol>
              )}
            </div>

            <div className="p-5 rounded-xl" style={{ background: '#13131A', border: '1px solid #1E1E2E' }}>
              <p className="text-sm font-semibold mb-3" style={{ color: '#64748B' }}>FOLLOW-UPS</p>
              {(s?.follow_ups ?? []).length === 0 ? (
                <p className="text-sm" style={{ color: '#64748B' }}>No follow-ups recorded.</p>
              ) : (
                <ul className="space-y-2">
                  {s?.follow_ups.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <input type="checkbox" className="mt-0.5 accent-[#6366F1]" readOnly />
                      {f}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Button
              onClick={sendToSlack}
              className="w-full font-semibold"
              style={{ background: '#6366F1', color: '#fff' }}
            >
              Send to Slack
            </Button>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
