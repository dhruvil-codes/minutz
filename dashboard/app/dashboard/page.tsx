"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Video,
  VideoOff,
  Zap,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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

const surface = "border-[#2A2A2A] bg-[#1A1A1A] text-white shadow-[0_24px_80px_rgba(0,0,0,0.28)]";
const subtleSurface = "border-[#2A2A2A] bg-[#111111] text-white";

function nicheVariant(niche: string) {
  const map: Record<string, string> = {
    sales: "border-[#FF6A00]/30 bg-[#FF6A00]/10 text-[#FFB347]",
    pm: "border-violet-500/25 bg-violet-500/10 text-violet-300",
    financial: "border-[#22C55E]/25 bg-[#22C55E]/10 text-[#86EFAC]",
    general: "border-white/10 bg-white/5 text-[#A3A3A3]",
  };
  return map[niche] ?? map.general;
}

function statusVariant(status: string) {
  const map: Record<string, string> = {
    completed: "border-[#22C55E]/25 bg-[#22C55E]/10 text-[#86EFAC]",
    processing: "animate-pulse border-[#FF6A00]/30 bg-[#FF6A00]/10 text-[#FFB347]",
    pending: "animate-pulse border-[#FF6A00]/30 bg-[#FF6A00]/10 text-[#FFB347]",
    failed: "border-[#EF4444]/25 bg-[#EF4444]/10 text-red-300",
  };
  return map[status] ?? "border-white/10 bg-white/5 text-[#A3A3A3]";
}

function buildSmoothPath(points: { x: number; y: number }[]) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;

    const previous = points[index - 1];
    const controlX = (previous.x + point.x) / 2;
    return `${path} C ${controlX} ${previous.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`;
  }, "");
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
    <Card className={`${surface} group relative overflow-hidden py-0`}>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FF6A00]/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6B6B6B]">{title}</p>
            {loading ? (
              <Skeleton className="h-9 w-20 bg-[#2A2A2A]" />
            ) : (
          <p className="text-3xl font-semibold tracking-tight text-white tabular-nums">{value}</p>
            )}
          </div>
          <Badge variant="outline" className="size-8 rounded-lg border-[#2A2A2A] bg-black/30 p-0 text-[#FF6A00]">
            <Icon className="size-4" />
          </Badge>
        </div>
        <p className="mt-4 line-clamp-1 text-xs text-[#A3A3A3]">{sub}</p>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className={`${surface} py-0`}>
            <CardContent className="space-y-4 p-5">
              <Skeleton className="h-3 w-24 bg-[#2A2A2A]" />
              <Skeleton className="h-9 w-16 bg-[#2A2A2A]" />
              <Skeleton className="h-3 w-36 bg-[#2A2A2A]" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className={`${surface} py-0`}>
        <CardContent className="space-y-4 p-6">
          <Skeleton className="h-4 w-40 bg-[#2A2A2A]" />
          <Skeleton className="h-56 w-full bg-[#2A2A2A]" />
        </CardContent>
      </Card>
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
      ? `${latest.title || "Untitled"} · ${new Date(latest.created_at).toLocaleDateString()}`
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

  const chart = useMemo(() => {
    const width = 760;
    const top = 42;
    const bottom = 190;
    const left = 34;
    const right = 34;
    const usableWidth = width - left - right;
    const usableHeight = bottom - top;
    const maxValue = Math.max(1, derived.maxDayCount);

    const points = derived.meetingsByDay.map((day, index) => {
      const x = left + (usableWidth / Math.max(1, derived.meetingsByDay.length - 1)) * index;
      const y = bottom - (day.count / maxValue) * usableHeight;
      return { ...day, x, y };
    });

    const linePath = buildSmoothPath(points);
    const areaPath = points.length
      ? `${linePath} L ${points[points.length - 1].x} ${bottom} L ${points[0].x} ${bottom} Z`
      : "";

    return {
      bottom,
      points,
      linePath,
      areaPath,
      gridLines: [top, top + usableHeight / 3, top + (usableHeight / 3) * 2, bottom],
    };
  }, [derived.maxDayCount, derived.meetingsByDay]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 text-white">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Badge variant="outline" className="border-[#FF6A00]/30 bg-[#FF6A00]/10 text-[#FFB347]">
            <Sparkles className="mr-1 size-3" />
            Meeting intelligence
          </Badge>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white">Dashboard</h1>
            <p className="mt-1 text-sm text-[#A3A3A3]">Your meeting pipeline, summaries, and operational signals in one place.</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchMeetings}
          className="border-[#2A2A2A] bg-[#1A1A1A] text-[#A3A3A3] hover:border-[#FF6A00]/50 hover:bg-[#24170f] hover:text-white"
        >
          <RefreshCw className="mr-2 size-3.5" /> Refresh
        </Button>
      </div>

      {error && (
        <Alert className="border-[#EF4444]/25 bg-[#EF4444]/10 text-red-200">
          <AlertCircle className="text-[#EF4444]" />
          <AlertTitle>Backend connection failed</AlertTitle>
          <AlertDescription className="text-red-200/80">
            We couldn&apos;t load meetings from the local API.
            <Button
              variant="outline"
              size="sm"
              onClick={fetchMeetings}
              className="mt-2 border-[#EF4444]/30 bg-transparent text-red-100 hover:bg-[#EF4444]/10"
            >
              <RefreshCw className="mr-2 size-3.5" /> Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <DashboardSkeleton />
      ) : meetings.length === 0 ? (
        <Card className={`${surface} min-h-[520px] py-0`}>
          <CardContent className="flex min-h-[520px] flex-col items-center justify-center p-8 text-center">
            <Badge variant="outline" className="mb-5 size-16 rounded-2xl border-[#FF6A00]/25 bg-[#FF6A00]/10 p-0 text-[#FF6A00]">
              <VideoOff className="size-7" />
            </Badge>
            <h2 className="text-2xl font-semibold tracking-tight text-white">No meetings captured yet</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-[#A3A3A3]">
              Start a meeting with the Chrome Extension and Minutz will turn it into a summary, action items, and decisions.
            </p>
            <Button className="mt-6 bg-[#FF6A00] text-white hover:bg-[#E55E00]">
              <Video className="mr-2 size-4" /> Open extension
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Total meetings" value={String(stats.total)} sub={derived.latestText} icon={Video} loading={loading} />
            <StatCard title="Completed" value={String(stats.completed)} sub={`${derived.completionRate}% completion rate`} icon={CheckCircle2} loading={loading} />
            <StatCard title="Processing" value={String(stats.processing)} sub={stats.processing ? "Summaries in pipeline" : "Pipeline is clear"} icon={Loader2} loading={loading} />
            <StatCard title="This week" value={String(stats.this_week)} sub={`Top niche: ${derived.topNiche}`} icon={Calendar} loading={loading} />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card className={`${surface} py-0 xl:col-span-2`}>
              <CardHeader className="flex flex-row items-center justify-between px-5 py-4">
                <div>
                  <CardTitle className="text-sm font-semibold text-white">Meetings last 7 days</CardTitle>
                  <p className="mt-1 text-xs text-[#6B6B6B]">Captured sessions by day</p>
                </div>
                <Badge variant="outline" className="border-white/10 bg-white/5 text-[#A3A3A3]">Trend</Badge>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <Card className={`${subtleSurface} overflow-hidden py-0`}>
                  <CardContent className="p-0">
                    <svg
                      className="block h-[260px] w-full"
                      viewBox="0 0 760 240"
                      role="img"
                      aria-label="Line graph showing meetings captured over the last seven days"
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <linearGradient id="minutzTrendArea" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#FF6A00" stopOpacity="0.46" />
                          <stop offset="55%" stopColor="#FF9B2F" stopOpacity="0.18" />
                          <stop offset="100%" stopColor="#FF6A00" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="minutzTrendLine" x1="0" x2="1" y1="0" y2="0">
                          <stop offset="0%" stopColor="#FF6A00" />
                          <stop offset="55%" stopColor="#FFB347" />
                          <stop offset="100%" stopColor="#FF6A00" />
                        </linearGradient>
                        <filter id="minutzTrendGlow" x="-20%" y="-60%" width="140%" height="220%">
                          <feGaussianBlur stdDeviation="5" result="coloredBlur" />
                          <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>

                      {chart.gridLines.map((lineY) => (
                        <line
                          key={lineY}
                          x1="34"
                          x2="726"
                          y1={lineY}
                          y2={lineY}
                          stroke="#2A2A2A"
                          strokeWidth="1"
                          vectorEffect="non-scaling-stroke"
                        />
                      ))}

                      <path d={chart.areaPath} fill="url(#minutzTrendArea)" />
                      <path
                        d={chart.linePath}
                        fill="none"
                        stroke="#21140b"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.75"
                        vectorEffect="non-scaling-stroke"
                      />
                      <path
                        d={chart.linePath}
                        fill="none"
                        stroke="url(#minutzTrendLine)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#minutzTrendGlow)"
                        vectorEffect="non-scaling-stroke"
                      />

                      {chart.points.map((point) => (
                        <g key={point.label}>
                          <line
                            x1={point.x}
                            x2={point.x}
                            y1={point.y}
                            y2={chart.bottom}
                            stroke="#FF6A00"
                            strokeDasharray="3 6"
                            strokeOpacity={point.count > 0 ? 0.32 : 0}
                            vectorEffect="non-scaling-stroke"
                          />
                          <circle
                            cx={point.x}
                            cy={point.y}
                            r={point.count > 0 ? 5 : 3.5}
                            fill={point.count > 0 ? "#FF6A00" : "#2A2A2A"}
                            stroke={point.count > 0 ? "#FFB347" : "#3A3A3A"}
                            strokeWidth="2"
                            vectorEffect="non-scaling-stroke"
                          />
                          <text
                            x={point.x}
                            y="222"
                            textAnchor="middle"
                            className="fill-[#6B6B6B] text-[10px] font-medium"
                          >
                            {point.label}
                          </text>
                          <text
                            x={point.x}
                            y={Math.max(24, point.y - 14)}
                            textAnchor="middle"
                            className="fill-white text-[11px] font-semibold"
                          >
                            {point.count}
                          </text>
                        </g>
                      ))}
                    </svg>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>

            <Card className={`${surface} py-0`}>
              <CardHeader className="px-5 py-4">
                <CardTitle className="text-sm font-semibold text-white">Quick insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-5 pb-5">
                {[
                  { title: "Most active niche", value: derived.topNiche, icon: TrendingUp },
                  { title: "Pipeline status", value: stats.processing ? `${stats.processing} meeting(s) still processing` : "No pending summaries", icon: Clock3 },
                  { title: "Latest update", value: derived.latestText, icon: Zap },
                ].map((item) => (
                  <Card key={item.title} className={`${subtleSurface} py-0`}>
                    <CardContent className="flex items-start gap-3 p-3">
                      <Badge variant="outline" className="size-8 rounded-lg border-[#FF6A00]/20 bg-[#FF6A00]/10 p-0 text-[#FF6A00]">
                        <item.icon className="size-4" />
                      </Badge>
                      <div>
                        <p className="text-sm font-medium text-white">{item.title}</p>
                        <p className="mt-0.5 text-xs text-[#A3A3A3]">{item.value}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className={`${surface} py-0`}>
              <CardHeader className="px-5 py-4">
                <CardTitle className="text-sm font-semibold text-white">Status distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 px-5 pb-5">
                {[
                  { key: "Completed", count: derived.statusCounts.completed, className: "bg-[#22C55E]" },
                  { key: "Processing", count: derived.statusCounts.processing, className: "animate-pulse bg-[#FF6A00]" },
                  { key: "Failed", count: derived.statusCounts.failed, className: "bg-[#EF4444]" },
                ].map((item) => {
                  const percent = stats.total ? Math.round((item.count / stats.total) * 100) : 0;
                  return (
                    <div key={item.key} className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#A3A3A3]">{item.key}</span>
                  <span className="font-semibold text-white">{item.count} · {percent}%</span>
                      </div>
                      <Progress value={percent} className="bg-[#2A2A2A]" indicatorClassName={item.className} />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className={`${surface} py-0`}>
              <CardHeader className="px-5 py-4">
                <CardTitle className="text-sm font-semibold text-white">Niche breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 px-5 pb-5">
                {derived.nicheBreakdown.map((item) => (
                  <div key={item.niche} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={nicheVariant(item.niche)}>{item.niche}</Badge>
                  <span className="text-xs font-semibold text-white">{item.count} · {item.percent}%</span>
                    </div>
                    <Progress value={item.percent} className="bg-[#2A2A2A]" indicatorClassName="bg-gradient-to-r from-[#FF6A00] to-[#FFB347]" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className={`${surface} overflow-hidden py-0`}>
            <CardHeader className="flex flex-row items-center justify-between border-b border-[#2A2A2A] px-6 py-4">
              <div>
                <CardTitle className="text-sm font-semibold text-white">Recent meetings</CardTitle>
                <p className="mt-1 text-xs text-[#6B6B6B]">Click a row to inspect summary, actions, and transcript.</p>
              </div>
              <Badge variant="outline" className="border-white/10 bg-white/5 text-[#A3A3A3]">{meetings.length} total</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <Table className="min-w-[760px]">
                <TableHeader>
                  <TableRow className="border-b border-[#2A2A2A] hover:bg-transparent">
                    <TableHead className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6B6B6B]">Title</TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6B6B6B]">Niche</TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6B6B6B]">Status</TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6B6B6B]">Date</TableHead>
                    <TableHead className="text-right text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6B6B6B]">Open</TableHead>
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
                        <Badge variant="outline" className={nicheVariant(meeting.niche)}>{meeting.niche || "general"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusVariant(meeting.status)}>{meeting.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-[#A3A3A3]">
                        {new Date(meeting.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon-sm" className="text-[#A3A3A3] hover:text-white">
                          <ArrowUpRight className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
