"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCw,
  TrendingUp,
  Video,
  VideoOff,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Meeting {
  id: string;
  title: string;
  niche: string;
  status: string;
  created_at: string;
}

interface Stats {
  total: number;
  completed: number;
  processing: number;
  this_week: number;
}

function nicheBadge(niche: string) {
  const map: Record<string, string> = {
    sales: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    pm: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
    financial: "bg-green-500/10 text-green-400 border border-green-500/20",
    general: "bg-[#2A2A2A] text-[#A3A3A3]",
  };
  return map[niche] ?? "bg-[#2A2A2A] text-[#A3A3A3]";
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    completed: "bg-green-500/10 text-green-400",
    processing: "bg-[#FF6A00]/10 text-[#FF6A00] animate-pulse",
    pending: "bg-yellow-500/10 text-yellow-400 animate-pulse",
    failed: "bg-red-500/10 text-red-400",
  };
  return map[status] ?? "bg-[#2A2A2A] text-[#A3A3A3]";
}

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  loading,
}: {
  title: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  loading: boolean;
}) {
  return (
    <div className="card-hover rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6B6B6B]">{title}</span>
        <Icon className="h-4 w-4 text-[#FF6A00]" />
      </div>
      {loading ? (
        <Skeleton className="h-9 w-24 bg-[#2A2A2A]" />
      ) : (
        <p className="text-3xl font-extrabold tabular-nums text-white">{value}</p>
      )}
      <p className="mt-2 text-xs text-[#6B6B6B]">{sub}</p>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, completed: 0, processing: 0, this_week: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMeetings = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:8001/meetings");
      if (!res.ok) throw new Error("Failed to fetch");
      const data: Meeting[] = await res.json();

      const sorted = [...data].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setMeetings(sorted);
      setError(false);

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      setStats({
        total: sorted.length,
        completed: sorted.filter((m) => m.status === "completed").length,
        processing: sorted.filter((m) => m.status === "processing" || m.status === "pending").length,
        this_week: sorted.filter((m) => new Date(m.created_at) >= weekAgo).length,
      });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeetings();
    intervalRef.current = setInterval(fetchMeetings, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchMeetings]);

  const derived = useMemo(() => {
    const completionRate = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;

    const nicheCount = meetings.reduce<Record<string, number>>((acc, m) => {
      const key = m.niche || "general";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const topNiche = Object.entries(nicheCount).sort((a, b) => b[1] - a[1])[0];

    const latest = meetings[0];
    const latestText = latest
      ? `${latest.title || "Untitled"} - ${new Date(latest.created_at).toLocaleDateString()}`
      : "No meetings yet";

    const statusCounts = {
      completed: meetings.filter((m) => m.status === "completed").length,
      processing: meetings.filter((m) => m.status === "processing" || m.status === "pending").length,
      failed: meetings.filter((m) => m.status === "failed").length,
    };

    const sevenDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - (6 - i));
      return d;
    });

    const meetingsByDay = sevenDays.map((day) => {
      const next = new Date(day);
      next.setDate(next.getDate() + 1);
      const count = meetings.filter((m) => {
        const created = new Date(m.created_at);
        return created >= day && created < next;
      }).length;
      return {
        label: day.toLocaleDateString(undefined, { weekday: "short" }),
        count,
      };
    });

    const maxDayCount = Math.max(1, ...meetingsByDay.map((d) => d.count));

    const nicheBreakdown = Object.entries(nicheCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([niche, count]) => ({
        niche,
        count,
        percent: stats.total ? Math.round((count / stats.total) * 100) : 0,
      }));

    return {
      completionRate,
      topNiche: topNiche ? `${topNiche[0]} (${topNiche[1]})` : "n/a",
      latestText,
      statusCounts,
      meetingsByDay,
      maxDayCount,
      nicheBreakdown,
    };
  }, [meetings, stats]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-[#6B6B6B]">Your meeting intelligence command center</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchMeetings}
          className="border-[#2A2A2A] bg-[#121212] text-[#A3A3A3] hover:border-[#FF6A00] hover:text-white"
        >
          <RefreshCw className="mr-2 h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Meetings" value={String(stats.total)} sub={derived.latestText} icon={Video} loading={loading} />
        <StatCard title="Completed" value={String(stats.completed)} sub={`${derived.completionRate}% completion rate`} icon={CheckCircle2} loading={loading} />
        <StatCard title="Processing" value={String(stats.processing)} sub={stats.processing ? "Summaries in pipeline" : "Pipeline is clear"} icon={Loader2} loading={loading} />
        <StatCard title="This Week" value={String(stats.this_week)} sub={`Top niche: ${derived.topNiche}`} icon={Calendar} loading={loading} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Meetings Last 7 Days</h2>
            <span className="rounded-md bg-[#2A2A2A] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#A3A3A3]">
              Trend
            </span>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {derived.meetingsByDay.map((day) => (
              <div key={day.label} className="flex flex-col items-center gap-2">
                <div className="flex h-28 w-full items-end rounded-md border border-[#2A2A2A] bg-[#121212] p-1">
                  <div
                    className="w-full rounded-sm bg-gradient-to-t from-[#FF6A00] to-[#FFB347]"
                    style={{ height: `${Math.max(8, Math.round((day.count / derived.maxDayCount) * 100))}%` }}
                  />
                </div>
                <span className="text-[10px] text-[#6B6B6B]">{day.label}</span>
                <span className="text-xs font-semibold text-white">{day.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-5">
          <h2 className="mb-4 text-sm font-semibold text-white">Quick Insights</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2 rounded-lg border border-[#2A2A2A] bg-[#121212] p-3">
              <TrendingUp className="mt-0.5 h-4 w-4 text-[#FF6A00]" />
              <div>
                <p className="text-white">Most active niche</p>
                <p className="text-[#6B6B6B]">{derived.topNiche}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-lg border border-[#2A2A2A] bg-[#121212] p-3">
              <Clock3 className="mt-0.5 h-4 w-4 text-[#FF6A00]" />
              <div>
                <p className="text-white">Pipeline status</p>
                <p className="text-[#6B6B6B]">{stats.processing ? `${stats.processing} meeting(s) still processing` : "No pending summaries"}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-lg border border-[#2A2A2A] bg-[#121212] p-3">
              <Zap className="mt-0.5 h-4 w-4 text-[#FF6A00]" />
              <div>
                <p className="text-white">Latest update</p>
                <p className="text-[#6B6B6B]">{derived.latestText}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-5">
          <h2 className="mb-4 text-sm font-semibold text-white">Status Distribution</h2>
          <div className="space-y-3">
            {[
              { key: "Completed", count: derived.statusCounts.completed, color: "bg-green-500" },
              { key: "Processing", count: derived.statusCounts.processing, color: "bg-[#FF6A00]" },
              { key: "Failed", count: derived.statusCounts.failed, color: "bg-red-500" },
            ].map((item) => {
              const percent = stats.total ? Math.round((item.count / stats.total) * 100) : 0;
              return (
                <div key={item.key}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-[#A3A3A3]">{item.key}</span>
                    <span className="font-semibold text-white">{item.count} ({percent}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#2A2A2A]">
                    <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-5">
          <h2 className="mb-4 text-sm font-semibold text-white">Niche Breakdown</h2>
          <div className="space-y-3">
            {derived.nicheBreakdown.length === 0 ? (
              <p className="text-sm text-[#6B6B6B]">No niche data available yet.</p>
            ) : (
              derived.nicheBreakdown.map((item) => (
                <div key={item.niche}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-[#A3A3A3] capitalize">{item.niche}</span>
                    <span className="font-semibold text-white">{item.count} ({item.percent}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#2A2A2A]">
                    <div className="h-2 rounded-full bg-gradient-to-r from-[#FF6A00] to-[#FFB347]" style={{ width: `${item.percent}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#1A1A1A]">
        <div className="border-b border-[#2A2A2A] px-6 py-4">
          <h2 className="text-sm font-semibold text-white">Recent Meetings</h2>
        </div>

        {loading ? (
          <div className="space-y-px">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <Skeleton className="h-4 w-48 bg-[#2A2A2A]" />
                <Skeleton className="h-4 w-16 bg-[#2A2A2A]" />
                <Skeleton className="h-4 w-20 bg-[#2A2A2A]" />
                <Skeleton className="h-4 w-24 bg-[#2A2A2A]" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-[#6B6B6B]">
            <AlertCircle className="h-8 w-8 opacity-40" />
            <span className="text-sm">Could not connect to backend</span>
            <Button variant="outline" size="sm" onClick={fetchMeetings} className="border-[#2A2A2A] text-[#A3A3A3] hover:text-white">
              <RefreshCw className="mr-2 h-3.5 w-3.5" /> Retry
            </Button>
          </div>
        ) : meetings.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-[#6B6B6B]">
            <VideoOff className="h-8 w-8 opacity-40" />
            <span className="text-sm">No meetings yet. Start recording with the Chrome Extension.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[650px]">
              <TableHeader>
                <TableRow className="border-b border-[#2A2A2A] hover:bg-transparent">
                  <TableHead className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6B6B6B]">Title</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6B6B6B]">Niche</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6B6B6B]">Status</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6B6B6B]">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meetings.map((meeting) => (
                  <TableRow
                    key={meeting.id}
                    className="cursor-pointer border-b border-[#2A2A2A] transition-colors last:border-0 hover:bg-[#242424]"
                    onClick={() => router.push(`/dashboard/meeting/${meeting.id}`)}
                  >
                    <TableCell className="font-medium text-white">{meeting.title || "Untitled"}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${nicheBadge(meeting.niche)}`}>
                        {meeting.niche}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${statusBadge(meeting.status)}`}>
                        {meeting.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-[#6B6B6B]">
                      {new Date(meeting.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
