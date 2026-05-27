'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

interface Meeting {
  id: string
  title: string
  niche: string
  status: string
  created_at: string
  executive_summary_preview: string | null
}

const NICHE_COLORS: Record<string, string> = {
  sales: '#3B82F6',
  pm: '#A855F7',
  financial: '#10B981',
  general: '#6B7280',
}

const NICHE_LABELS: Record<string, string> = {
  sales: 'Sales',
  pm: 'Product',
  financial: 'Financial',
  general: 'General',
}

const STATUS_CONFIG: Record<string, { label: string; color: string; pulse: boolean }> = {
  pending: { label: 'Pending', color: '#EAB308', pulse: false },
  processing: { label: 'Processing', color: '#6366F1', pulse: true },
  completed: { label: 'Completed', color: '#10B981', pulse: false },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}

export default function DashboardPage() {
  const router = useRouter()
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [userEmail, setUserEmail] = useState('')
  const [loading, setLoading] = useState(true)

  async function fetchMeetings() {
    try {
      const res = await fetch('http://localhost:8001/meetings')
      if (res.ok) setMeetings(await res.json())
    } catch {}
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      setUserEmail(data.user.email ?? '')
    })
    fetchMeetings().then(() => setLoading(false))
    const interval = setInterval(fetchMeetings, 5000)
    return () => clearInterval(interval)
  }, [router])

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0F', color: '#F8FAFC' }}>
      {/* Navbar */}
      <nav
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: '#1E1E2E' }}
      >
        <span className="text-xl font-bold" style={{ color: '#6366F1' }}>⚡ Minutz</span>
        <div className="flex items-center gap-4">
          <span className="text-sm" style={{ color: '#64748B' }}>{userEmail}</span>
          <Button
            onClick={signOut}
            variant="outline"
            size="sm"
            className="border-[#1E1E2E] text-[#F8FAFC] bg-transparent hover:bg-[#1E1E2E]"
          >
            Sign out
          </Button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-8">Your Meetings</h1>

        {loading ? (
          <div className="text-center py-20" style={{ color: '#64748B' }}>Loading…</div>
        ) : meetings.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">⚡</p>
            <p className="text-xl font-semibold mb-2">No meetings yet</p>
            <p style={{ color: '#64748B' }}>Install the Chrome Extension to start recording</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {meetings.map(m => {
              const status = STATUS_CONFIG[m.status] ?? STATUS_CONFIG.pending
              const nicheColor = NICHE_COLORS[m.niche] ?? NICHE_COLORS.general
              return (
                <div
                  key={m.id}
                  onClick={() => router.push(`/dashboard/meeting/${m.id}`)}
                  className="group relative p-5 rounded-xl cursor-pointer transition-all hover:border-[#6366F1]"
                  style={{ background: '#13131A', border: '1px solid #1E1E2E' }}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h2 className="font-semibold text-base leading-snug">{m.title}</h2>
                    <ArrowRight
                      size={16}
                      className="shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: '#6366F1' }}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ background: `${nicheColor}22`, color: nicheColor }}
                    >
                      {NICHE_LABELS[m.niche] ?? m.niche}
                    </span>
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1"
                      style={{ background: `${status.color}22`, color: status.color }}
                    >
                      {status.pulse && (
                        <span
                          className="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
                          style={{ background: status.color }}
                        />
                      )}
                      {status.label}
                    </span>
                  </div>

                  <p className="text-xs mb-2" style={{ color: '#64748B' }}>
                    {formatDate(m.created_at)}
                  </p>

                  {m.executive_summary_preview && (
                    <p className="text-sm line-clamp-2" style={{ color: '#94A3B8' }}>
                      {m.executive_summary_preview.slice(0, 100)}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
