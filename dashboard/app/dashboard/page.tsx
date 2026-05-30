"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  Bell,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  ListChecks,
  Loader2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Upload,
  Video,
  VideoOff,
} from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase";

interface Meeting {
  id: string;
  title: string;
  niche: string;
  status: string;
  created_at: string;
  duration_seconds?: number;
}

interface Stats {
  total: number;
  completed: number;
  processing: number;
  this_week: number;
}

function nicheVariant(niche: string) {
  const map: Record<string, string> = {
    sales: "border-blue-500/20 bg-blue-500/10 text-blue-400",
    pm: "border-purple-500/20 bg-purple-500/10 text-purple-400",
    financial: "border-green-500/20 bg-green-500/10 text-green-400",
    general: "border-zinc-500/20 bg-zinc-500/10 text-zinc-400",
  };
  return map[niche] ?? map.general;
}

function nicheLabel(niche: string) {
  const map: Record<string, string> = { sales: "Sales", pm: "PM", financial: "Financial", general: "General" };
  return map[niche] ?? (niche ? niche.charAt(0).toUpperCase() + niche.slice(1) : "General");
}

function statusVariant(status: string) {
  const map: Record<string, string> = {
    completed: "border-green-500/20 bg-green-500/10 text-green-400",
    processing: "animate-pulse border-orange-500/20 bg-orange-500/10 text-orange-400",
    pending: "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
    failed: "border-red-500/20 bg-red-500/10 text-red-400",
  };
  return map[status] ?? "border-zinc-500/20 bg-zinc-500/10 text-zinc-400";
}

function statusLabel(status: string) {
  return status ? status.charAt(0).toUpperCase() + status.slice(1) : status;
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

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 17) return "Good afternoon";
  return "Good evening";
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-5">
            <Skeleton className="mb-3 h-3 w-24 bg-[#2A2A2A]" />
            <Skeleton className="h-9 w-16 bg-[#2A2A2A]" />
            <Skeleton className="mt-3 h-3 w-32 bg-[#2A2A2A]" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-5">
            <Skeleton className="mb-4 h-4 w-40 bg-[#2A2A2A]" />
            <Skeleton className="h-52 w-full bg-[#2A2A2A]" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-5">
            <Skeleton className="mb-4 h-4 w-28 bg-[#2A2A2A]" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="mb-3 h-8 w-full bg-[#2A2A2A]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, completed: 0, processing: 0, this_week: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [range, setRange] = useState<"7d" | "30d" | "90d">("7d");
  const [userEmail, setUserEmail] = useState<string>("");
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [minutesAgo, setMinutesAgo] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "processing" | "failed">("all");
  const [nicheFilter, setNicheFilter] = useState("all");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const extensionSyncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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
      setLastFetched(new Date());

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
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchMeetings]);

  // Update "X min ago" every 30s
  useEffect(() => {
    const tick = () => {
      if (lastFetched) {
        setMinutesAgo(Math.floor((Date.now() - lastFetched.getTime()) / 60000));
      }
    };
    tick();
    const t = setInterval(tick, 30000);
    return () => clearInterval(t);
  }, [lastFetched]);

  // Fetch user email for header
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setUserEmail(data.user.email);
    });
  }, []);

  // Ctrl+K focuses search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("meeting-search")?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const syncExtensionUser = async () => {
      const supabase = createClient();
      const [{ data: userData }, { data: sessionData }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.auth.getSession(),
      ]);

      const user = userData.user;
      const token = sessionData.session?.access_token;

      if (!user?.email || !token) return;

      const payload = { email: user.email, token };

      if (typeof window !== "undefined" && (window as any).chrome?.runtime) {
        (window as any).chrome.runtime.sendMessage({ type: "SET_USER", user: payload }, () => {
          void (window as any).chrome.runtime.lastError;
        });
      }

      window.dispatchEvent(new CustomEvent("minutz:set-user", { detail: payload }));
      document.dispatchEvent(new CustomEvent("minutz:set-user", { detail: payload }));
    };

    const stopRetrying = () => {
      if (extensionSyncIntervalRef.current) {
        clearInterval(extensionSyncIntervalRef.current);
        extensionSyncIntervalRef.current = null;
      }
    };

    syncExtensionUser().catch(() => {});
    extensionSyncIntervalRef.current = setInterval(() => {
      syncExtensionUser().catch(() => {});
    }, 2000);

    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      syncExtensionUser().catch(() => {});
    });

    return () => {
      stopRetrying();
      subscription.unsubscribe();
    };
  }, []);

  const derived = useMemo(() => {
    const completionRate = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;

    const nicheCount = meetings.reduce<Record<string, number>>((acc, m) => {
      const key = m.niche || "general";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const topNicheEntry = Object.entries(nicheCount).sort((a, b) => b[1] - a[1])[0];
    const topNiche = topNicheEntry ? topNicheEntry[0] : "n/a";
    const topNichePercent = topNicheEntry && stats.total
      ? Math.round((topNicheEntry[1] / stats.total) * 100)
      : 0;

    const statusCounts = {
      completed: meetings.filter((m) => m.status === "completed").length,
      processing: meetings.filter((m) => m.status === "processing" || m.status === "pending").length,
      failed: meetings.filter((m) => m.status === "failed").length,
    };

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisWeekMeetings = meetings.filter((m) => new Date(m.created_at) >= weekAgo);
    const completedThisWeek = thisWeekMeetings.filter((m) => m.status === "completed").length;
    const salesThisWeek = thisWeekMeetings.filter((m) => (m.niche || "general") === "sales").length;

    const totalDurationSeconds = meetings.reduce((sum, m) => sum + (m.duration_seconds || 0), 0);
    const hoursCapured = totalDurationSeconds > 0
      ? (totalDurationSeconds / 3600).toFixed(1)
      : null;

    // Estimate action items as 3 per completed meeting (no real data)
    const totalActionItems = statusCounts.completed * 3;

    const nicheBreakdown = Object.entries(nicheCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([niche, count]) => ({
        niche,
        count,
        percent: stats.total ? Math.round((count / stats.total) * 100) : 0,
        hours: null as string | null,
      }));

    // Previous week for trend
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const prevWeekMeetings = meetings.filter((m) => {
      const d = new Date(m.created_at);
      return d >= twoWeeksAgo && d < weekAgo;
    });
    const weekTrend = prevWeekMeetings.length > 0
      ? Math.round(((thisWeekMeetings.length - prevWeekMeetings.length) / prevWeekMeetings.length) * 100)
      : null;

    // Recent activity events from last 2 meetings
    const recentEvents = meetings.slice(0, 2).flatMap((m) => [
      {
        time: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        event: "Meeting processed",
        subtitle: m.title || "Untitled",
        icon: Video,
      },
      {
        time: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        event: "Summary ready",
        subtitle: m.title || "Untitled",
        icon: CheckCircle2,
      },
    ]).slice(0, 4);

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
      return { label: day.toLocaleDateString(undefined, { weekday: "short" }), count };
    });

    const maxDayCount = Math.max(1, ...meetingsByDay.map((d) => d.count));

    return {
      completionRate,
      nicheCount,
      nicheBreakdown,
      topNiche,
      topNichePercent,
      statusCounts,
      completedThisWeek,
      salesThisWeek,
      totalActionItems,
      hoursCapured,
      weekTrend,
      recentEvents,
      meetingsByDay,
      maxDayCount,
      latestText: meetings[0]
        ? `${meetings[0].title || "Untitled"} · ${new Date(meetings[0].created_at).toLocaleDateString()}`
        : "No meetings yet",
    };
  }, [meetings, stats]);

  const getDaysBack = (r: string) => (r === "7d" ? 7 : r === "30d" ? 30 : 90);

  const chartData = useMemo(() => {
    const daysBack = getDaysBack(range);
    const buckets: Record<string, number> = {};
    for (let i = daysBack - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
      buckets[key] = 0;
    }
    meetings.forEach((m) => {
      const d = new Date(m.created_at);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - daysBack);
      if (d >= cutoff) {
        const key = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
        if (key in buckets) buckets[key]++;
      }
    });
    return Object.entries(buckets).map(([date, count]) => ({ date, count }));
  }, [meetings, range]);

  const chart = useMemo(() => {
    const width = 760;
    const top = 10;
    const bottom = 166;
    const left = 14;
    const right = 10;
    const usableWidth = width - left - right;
    const usableHeight = bottom - top;
    const maxValue = Math.max(1, ...chartData.map((d) => d.count));
    const points = chartData.map((day, index) => {
      const x = left + (usableWidth / Math.max(1, chartData.length - 1)) * index;
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
  }, [chartData]);

  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) => {
      const matchesSearch = !searchQuery || (m.title || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || m.status === statusFilter ||
        (statusFilter === "processing" && m.status === "pending");
      const matchesNiche = nicheFilter === "all" || (m.niche || "general") === nicheFilter;
      return matchesSearch && matchesStatus && matchesNiche;
    });
  }, [meetings, searchQuery, statusFilter, nicheFilter]);

  const userName = userEmail
    ? (userEmail.split("@")[0].replace(/\./g, " ").split(" ")[0])
    : "there";
  const displayName = userName.charAt(0).toUpperCase() + userName.slice(1);
  const avatarLetter = userEmail ? userEmail[0].toUpperCase() : "M";
  const allNiches = useMemo(() => [...new Set(meetings.map((m) => m.niche || "general"))], [meetings]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 text-white">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {getGreeting()}, {displayName} 👋
          </h1>
          <p className="mt-1 text-sm text-[#A3A3A3]">
            You processed {derived.completedThisWeek} meetings this week, generated {derived.totalActionItems} action items and achieved {derived.completionRate}% completion rate.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-block size-1.5 rounded-full bg-[#22C55E]" />
            <span className="text-xs text-[#A3A3A3]">
              {lastFetched ? (minutesAgo === 0 ? "Just updated" : `Last updated ${minutesAgo} min ago`) : "Loading..."}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-52 cursor-text items-center gap-2 rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] px-3"
            onClick={() => document.getElementById("meeting-search")?.focus()}
          >
            <Search className="size-3.5 shrink-0 text-[#6B6B6B]" />
            <span className="flex-1 min-w-0 truncate text-sm text-[#6B6B6B] whitespace-nowrap">Search meetings...</span>
            <span className="shrink-0 rounded border border-[#2A2A2A] px-1 text-[10px] text-[#6B6B6B]">Ctrl K</span>
          </div>

          {/* Bell with notifications dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex size-9 items-center justify-center rounded-md text-[#A3A3A3] hover:bg-[#242424] hover:text-white">
              <Bell className="size-[18px]" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 border-[#2A2A2A] bg-[#1A1A1A] text-white">
              <div className="px-3 py-2 text-xs font-medium text-[#A3A3A3]">Notifications</div>
              <DropdownMenuSeparator className="bg-[#2A2A2A]" />
              {meetings.slice(0, 3).map((m) => (
                <DropdownMenuItem
                  key={m.id}
                  onClick={() => router.push(`/dashboard/meeting/${m.id}`)}
                  className="flex cursor-pointer flex-col items-start py-3 focus:bg-[#242424] focus:text-white"
                >
                  <span className="text-sm font-medium text-white">Meeting summary ready</span>
                  <span className="mt-0.5 text-xs text-[#A3A3A3]">{m.title || "Untitled"}</span>
                </DropdownMenuItem>
              ))}
              {meetings.length === 0 && (
                <div className="py-4 text-center text-xs text-[#A3A3A3]">No notifications yet</div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Avatar with profile dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex size-8 items-center justify-center rounded-full border border-[#FF6A00]/30 bg-[#FF6A00]/20 text-sm font-semibold text-[#FF6A00] cursor-pointer">
              {avatarLetter}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 border-[#2A2A2A] bg-[#1A1A1A] text-white">
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-white">{displayName}</p>
                <p className="text-xs text-[#A3A3A3]">{userEmail}</p>
              </div>
              <DropdownMenuSeparator className="bg-[#2A2A2A]" />
              <DropdownMenuItem
                onClick={() => router.push("/dashboard/settings")}
                className="cursor-pointer text-[#A3A3A3] focus:bg-[#242424] focus:text-white"
              >
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#2A2A2A]" />
              <DropdownMenuItem
                onClick={async () => {
                  const supabase = createClient();
                  await supabase.auth.signOut();
                  router.push("/");
                }}
                className="cursor-pointer text-[#EF4444] focus:bg-[#242424] focus:text-[#EF4444]"
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="flex flex-wrap gap-3">
        <Dialog>
          <DialogTrigger className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#2A2A2A] bg-[#1A1A1A] px-3 text-sm font-medium text-[#A3A3A3] hover:bg-[#242424] hover:text-white">
            <Plus className="size-3.5" /> New Meeting
          </DialogTrigger>
          <DialogContent className="max-w-md border-[#2A2A2A] bg-[#1A1A1A]">
            <DialogHeader>
              <DialogTitle className="text-white">Start a new recording</DialogTitle>
              <DialogDescription className="text-[#A3A3A3]">
                Use the Minutz Chrome Extension to record your next meeting invisibly.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {[
                {
                  step: 1,
                  title: "Install the Chrome Extension",
                  body: <a href="https://github.com/dhruvil-codes/minutz" target="_blank" rel="noreferrer" className="text-[#FF6A00] hover:underline">Download from GitHub →</a>,
                },
                {
                  step: 2,
                  title: "Open your meeting",
                  body: "Join Google Meet, Zoom, or Microsoft Teams in a new tab.",
                },
                {
                  step: 3,
                  title: "Click Start Recording",
                  body: "Open the Minutz extension icon in your toolbar and hit Start Recording. Your summary will appear here automatically.",
                },
              ].map(({ step, title, body }) => (
                <div key={step} className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-[#FF6A00]/20 bg-[#FF6A00]/10 text-xs font-bold text-[#FF6A00]">
                    {step}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{title}</p>
                    <p className="mt-0.5 text-xs text-[#A3A3A3]">{body}</p>
                  </div>
                </div>
              ))}
            </div>
            <DialogFooter>
              <DialogClose className="inline-flex h-9 items-center rounded-md border border-[#2A2A2A] bg-transparent px-4 text-sm font-medium text-[#A3A3A3] hover:bg-[#242424] hover:text-white">Close</DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/import")} className="border-[#2A2A2A] bg-[#1A1A1A] text-[#A3A3A3] hover:bg-[#242424] hover:text-white">
          <Upload className="mr-2 size-3.5" /> Import Recording
        </Button>
        <Button variant="outline" size="sm" onClick={() => toast.info("Generate Report coming soon")} className="border-[#2A2A2A] bg-[#1A1A1A] text-[#A3A3A3] hover:bg-[#242424] hover:text-white">
          <FileText className="mr-2 size-3.5" /> Generate Report
        </Button>
      </div>

      {error && (
        <Alert className="border-[#EF4444]/25 bg-[#EF4444]/10 text-red-200">
          <AlertCircle className="text-[#EF4444]" />
          <AlertTitle>Backend connection failed</AlertTitle>
          <AlertDescription className="text-red-200/80">
            We couldn&apos;t load meetings from the local API.
            <Button variant="outline" size="sm" onClick={fetchMeetings} className="mt-2 border-[#EF4444]/30 bg-transparent text-red-100 hover:bg-[#EF4444]/10">
              <RefreshCw className="mr-2 size-3.5" /> Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <DashboardSkeleton />
      ) : meetings.length === 0 ? (
        <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-16 text-center">
          <VideoOff className="mx-auto size-12 text-[#6B6B6B]" />
          <h2 className="mt-4 text-xl font-semibold text-white">No meetings captured yet</h2>
          <p className="mt-2 text-sm text-[#A3A3A3]">Start a meeting with the Chrome Extension and Minutz will turn it into a summary, action items, and decisions.</p>
          <Button className="mt-6 bg-[#FF6A00] text-white hover:bg-[#E55E00]">
            <Video className="mr-2 size-4" /> Open extension
          </Button>
        </div>
      ) : (
        <>
          {/* KPI CARDS */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {/* Card 1 — Total Meetings */}
            <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6B6B6B]">Total meetings</p>
                  <p className="mt-2 text-3xl font-bold tabular-nums text-white">{stats.total}</p>
                </div>
                <div className="flex size-8 items-center justify-center rounded-lg border border-[#2A2A2A] bg-black/30">
                  <Video className="size-4 text-[#FF6A00]" />
                </div>
              </div>
              {derived.weekTrend !== null ? (
                <p className={`mt-3 text-xs ${derived.weekTrend >= 0 ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
                  {derived.weekTrend >= 0 ? "↑" : "↓"} {Math.abs(derived.weekTrend)}% vs last week
                </p>
              ) : (
                <p className="mt-3 text-xs text-[#6B6B6B]">No prior week data</p>
              )}
            </div>

            {/* Card 2 — Completion Rate */}
            <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6B6B6B]">Completion rate</p>
                  <p className="mt-2 text-3xl font-bold tabular-nums text-white">{derived.completionRate}%</p>
                </div>
                <div className="flex size-8 items-center justify-center rounded-lg border border-[#2A2A2A] bg-black/30">
                  <CheckCircle2 className="size-4 text-[#22C55E]" />
                </div>
              </div>
              <p className="mt-3 text-xs text-[#6B6B6B]">
                {derived.completionRate === 100 ? "All meetings processed" : `${stats.completed} of ${stats.total} done`}
              </p>
            </div>

            {/* Card 3 — Hours Captured */}
            <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6B6B6B]">Hours captured</p>
                  <p className="mt-2 text-3xl font-bold tabular-nums text-white">
                    {derived.hoursCapured ? `${derived.hoursCapured}h` : "—"}
                  </p>
                </div>
                <div className="flex size-8 items-center justify-center rounded-lg border border-[#2A2A2A] bg-black/30">
                  <Clock className="size-4 text-[#3B82F6]" />
                </div>
              </div>
              <p className="mt-3 text-xs text-[#6B6B6B]">{stats.this_week} meetings this week</p>
            </div>

            {/* Card 4 — Action Items */}
            <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6B6B6B]">Action items</p>
                  <p className="mt-2 text-3xl font-bold tabular-nums text-white">{derived.totalActionItems}</p>
                </div>
                <div className="flex size-8 items-center justify-center rounded-lg border border-[#2A2A2A] bg-black/30">
                  <ListChecks className="size-4 text-[#8B5CF6]" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                <span className="rounded bg-[#8B5CF6]/10 px-1.5 py-0.5 text-[10px] text-[#8B5CF6]">AI</span>
                <span className="text-xs text-[#6B6B6B]">Generated by AI</span>
              </div>
            </div>

            {/* Card 5 — Meeting Health */}
            <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6B6B6B]">Meeting health</p>
                  <p className="mt-2 text-3xl font-bold tabular-nums text-white">
                    {derived.statusCounts.failed === 0 ? "100%" : `${Math.round(((stats.total - derived.statusCounts.failed) / stats.total) * 100)}%`}
                  </p>
                </div>
                <div className="flex size-8 items-center justify-center rounded-lg border border-[#2A2A2A] bg-black/30">
                  <Activity className="size-4 text-[#FF6A00]" />
                </div>
              </div>
              <p className="mt-3 text-xs text-[#22C55E]">
                {derived.statusCounts.failed === 0 ? "No failures detected" : `${derived.statusCounts.failed} failed`}
              </p>
            </div>
          </div>

          {/* MIDDLE ROW */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3 xl:items-start">
            {/* Chart */}
            <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] xl:col-span-1">
              <div className="flex items-center justify-between px-5 pb-3 pt-4">
                <div>
                  <p className="text-sm font-semibold text-white">Meeting Activity</p>
                  <p className="mt-0.5 text-xs text-[#6B6B6B]">Captured sessions by day</p>
                </div>
                <div className="flex items-center gap-1 rounded-lg bg-[#111111] p-1">
                  {(["7d", "30d", "90d"] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRange(r)}
                      className={`rounded-md px-3 py-1 text-xs font-medium transition-all duration-200 ${
                        range === r ? "bg-[#1A1A1A] text-white shadow-sm" : "text-[#6B6B6B] hover:text-white"
                      }`}
                    >
                      {r === "7d" ? "7D" : r === "30d" ? "30D" : "90D"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="px-5 pb-4">
                <div className="overflow-hidden rounded-lg border border-[#2A2A2A] bg-[#111111]">
                  <div className="w-full" style={{ height: 200 }}>
                    <svg key={range} className="block h-[200px] w-full" viewBox="0 0 760 200" role="img"
                      aria-label={`Meetings over last ${range}`} preserveAspectRatio="none">
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
                          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                      </defs>
                      {chart.gridLines.map((lineY) => (
                        <line key={lineY} x1="34" x2="726" y1={lineY} y2={lineY} stroke="#2A2A2A" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                      ))}
                      <path d={chart.areaPath} fill="url(#minutzTrendArea)" />
                      <path d={chart.linePath} fill="none" stroke="#31180b" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" vectorEffect="non-scaling-stroke" />
                      <path d={chart.linePath} fill="none" stroke="url(#minutzTrendLine)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" filter="url(#minutzTrendGlow)" vectorEffect="non-scaling-stroke" />
                      {chart.points.map((point) => (
                        <g key={point.date}>
                          <line x1={point.x} x2={point.x} y1={point.y} y2={chart.bottom} stroke={point.count > 0 ? "#3B2513" : "#2A2A2A"} strokeWidth="1" strokeDasharray={point.count > 0 ? "0" : "3 4"} opacity="0.8" vectorEffect="non-scaling-stroke" />
                          <circle cx={point.x} cy={point.y} r="5" fill={point.count > 0 ? "#FF6A00" : "#2A2A2A"} stroke={point.count > 0 ? "#FFB347" : "#3A3A3A"} strokeWidth="2" vectorEffect="non-scaling-stroke" />
                          <text x={point.x} y="190" textAnchor="middle" className="fill-[#6B6B6B] text-[10px] font-medium">{point.date}</text>
                        </g>
                      ))}
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Insights */}
            <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A]">
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-[#8B5CF6]" />
                  <p className="text-sm font-semibold text-white">AI Insights</p>
                </div>
                <ChevronRight className="size-4 text-[#A3A3A3]" />
              </div>
              <div className="px-5 pb-4">
                {[
                  { color: "#FF6A00", text: `Sales meetings: ${derived.salesThisWeek} this week` },
                  { color: "#8B5CF6", text: `${derived.totalActionItems} action items generated` },
                  { color: "#22C55E", text: derived.statusCounts.failed === 0 ? "No failed recordings. Great job!" : `${derived.statusCounts.failed} failed recordings` },
                  { color: "#FF6A00", text: `Top niche: ${nicheLabel(derived.topNiche)} (${derived.topNichePercent}%)` },
                ].map((item, i, arr) => (
                  <div key={i} className={`flex items-start gap-3 py-2 ${i < arr.length - 1 ? "border-b border-[#2A2A2A]" : ""}`}>
                    <span className="mt-1.5 inline-block size-1.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                    <p className="text-sm text-[#A3A3A3]">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A]">
              <div className="flex items-center justify-between px-5 py-4">
                <p className="text-sm font-semibold text-white">Recent Activity</p>
                <button onClick={() => router.push("/dashboard/meetings")} className="text-xs text-[#FF6A00] hover:underline">View all</button>
              </div>
              <div className="px-5 pb-4">
                {derived.recentEvents.length === 0 ? (
                  <p className="text-sm text-[#6B6B6B]">No recent activity</p>
                ) : (
                  derived.recentEvents.map((ev, i) => (
                    <div key={i} className="flex items-start gap-3 py-2">
                      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#FF6A00]/10">
                        <ev.icon className="size-3 text-[#FF6A00]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-white">{ev.event}</p>
                        <p className="truncate text-xs text-[#6B6B6B]">{ev.subtitle}</p>
                      </div>
                      <span className="ml-auto shrink-0 text-xs text-[#6B6B6B]">{ev.time}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* NICHE BREAKDOWN + STATUS DISTRIBUTION */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Niche Breakdown */}
            <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-5">
              <p className="mb-4 text-sm font-semibold text-white">Niche Breakdown</p>
              {derived.nicheBreakdown.length === 0 ? (
                <p className="text-sm text-[#6B6B6B]">No data yet</p>
              ) : (
                derived.nicheBreakdown.map((item, i, arr) => (
                  <div key={item.niche} className={`py-3 ${i < arr.length - 1 ? "border-b border-[#2A2A2A]" : ""}`}>
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={nicheVariant(item.niche)}>{nicheLabel(item.niche)}</Badge>
                        <span className="text-xs text-[#A3A3A3]">{item.count} meeting{item.count !== 1 ? "s" : ""}</span>
                      </div>
                      <span className="text-xs text-[#A3A3A3]">{item.percent}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-[#2A2A2A]">
                      <div className="h-1.5 rounded-full bg-[#FF6A00]" style={{ width: `${item.percent}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Status Distribution */}
            <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-5">
              <p className="mb-4 text-sm font-semibold text-white">Status Distribution</p>
              <div className="space-y-3">
                {[
                  { key: "Completed", count: derived.statusCounts.completed, color: "#22C55E", bar: "bg-[#22C55E]" },
                  { key: "Processing", count: derived.statusCounts.processing, color: "#FF6A00", bar: "animate-pulse bg-[#FF6A00]" },
                  { key: "Failed", count: derived.statusCounts.failed, color: "#EF4444", bar: "bg-[#EF4444]" },
                ].map((item) => {
                  const pct = stats.total ? Math.round((item.count / stats.total) * 100) : 0;
                  return (
                    <div key={item.key}>
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="inline-block size-2 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-[#A3A3A3]">{item.key}</span>
                        </div>
                        <span className="font-semibold text-white">{item.count} · {pct}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-[#2A2A2A]">
                        <div className={`h-1.5 rounded-full ${item.bar}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 border-t border-[#2A2A2A] pt-4">
                <p className="text-xs text-[#6B6B6B]">Success Rate</p>
                <p className="mt-1 text-3xl font-bold text-white">
                  {stats.total ? `${Math.round(((stats.total - derived.statusCounts.failed) / stats.total) * 100)}%` : "—"}
                </p>
                <p className="mt-1 text-xs text-[#A3A3A3]">↑ 0% vs last week</p>
              </div>
            </div>
          </div>

          {/* RECENT MEETINGS TABLE */}
          <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#2A2A2A] px-6 py-4">
              <div>
                <p className="text-sm font-semibold text-white">Recent Meetings</p>
                <p className="mt-0.5 text-xs text-[#6B6B6B]">Click a row to inspect summary, actions, and transcript.</p>
              </div>
              <Badge variant="outline" className="border-white/10 bg-white/5 text-[#A3A3A3]">{meetings.length} total</Badge>
            </div>

            {/* Filter bar */}
            <div className="flex flex-wrap items-center gap-2 border-b border-[#2A2A2A] px-6 py-3">
              <div className="flex items-center gap-2 rounded-lg border border-[#2A2A2A] bg-[#111111] px-3 py-1.5">
                <Search className="size-3.5 text-[#6B6B6B]" />
                <input
                  id="meeting-search"
                  type="text"
                  placeholder="Search meetings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-44 bg-transparent text-sm text-white placeholder-[#6B6B6B] outline-none"
                />
              </div>
              {(["all", "completed", "processing", "failed"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    statusFilter === s
                      ? "border-[#FF6A00]/20 bg-[#FF6A00]/10 text-[#FF6A00]"
                      : "border-[#2A2A2A] bg-[#1A1A1A] text-[#A3A3A3] hover:text-white"
                  }`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] px-3 py-1.5 text-xs text-[#A3A3A3] hover:text-white">
                  {nicheFilter === "all" ? "All Niches" : nicheLabel(nicheFilter)}
                </DropdownMenuTrigger>
                <DropdownMenuContent className="border-[#2A2A2A] bg-[#1A1A1A] text-white">
                  <DropdownMenuItem onClick={() => setNicheFilter("all")} className="text-[#A3A3A3] hover:text-white focus:bg-[#242424] focus:text-white">All Niches</DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-[#2A2A2A]" />
                  {allNiches.map((n) => (
                    <DropdownMenuItem key={n} onClick={() => setNicheFilter(n)} className="text-[#A3A3A3] hover:text-white focus:bg-[#242424] focus:text-white">{nicheLabel(n)}</DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <button className="flex items-center gap-1.5 rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] px-3 py-1.5 text-xs text-[#A3A3A3] hover:text-white">
                <SlidersHorizontal className="size-3.5" /> Filters
              </button>
            </div>

            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow className="border-b border-[#2A2A2A] hover:bg-transparent">
                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#6B6B6B]">Title</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#6B6B6B]">Niche</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#6B6B6B]">Duration</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#6B6B6B]">Action Items</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#6B6B6B]">Status</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#6B6B6B]">Date</TableHead>
                  <TableHead className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[#6B6B6B]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMeetings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-16 text-center">
                      <VideoOff className="mx-auto size-10 text-[#6B6B6B]" />
                      <p className="mt-3 text-sm font-medium text-white">No meetings yet</p>
                      <p className="mt-1 text-xs text-[#A3A3A3]">Install the Chrome Extension to start recording</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMeetings.map((meeting) => (
                    <TableRow
                      key={meeting.id}
                      className="group cursor-pointer border-b border-[#2A2A2A]/50 transition-colors duration-150 last:border-0 hover:bg-[#1A1A1A]"
                      onClick={() => router.push(`/dashboard/meeting/${meeting.id}`)}
                    >
                      <TableCell className="px-4 py-4">
                        <span className="flex items-center gap-2 text-sm font-medium text-white">
                          <Video className="size-[14px] shrink-0 text-[#FF6A00]" />
                          {meeting.title || "Untitled"}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <Badge variant="outline" className={nicheVariant(meeting.niche)}>{nicheLabel(meeting.niche || "general")}</Badge>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-sm text-[#A3A3A3]">
                        {meeting.duration_seconds ? `${Math.round(meeting.duration_seconds / 60)} min` : "—"}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-sm text-[#A3A3A3]">
                        {meeting.status === "completed" ? `${3}` : "—"}
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <Badge variant="outline" className={statusVariant(meeting.status)}>{statusLabel(meeting.status)}</Badge>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-sm text-[#A3A3A3]">
                        {new Date(meeting.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        {" · "}
                        {new Date(meeting.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex size-8 items-center justify-center rounded-md opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[#242424]">
                            <MoreHorizontal className="size-4 text-[#A3A3A3]" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="border-[#2A2A2A] bg-[#1A1A1A] text-white">
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/meeting/${meeting.id}`)} className="text-[#A3A3A3] focus:bg-[#242424] focus:text-white">
                              <ArrowUpRight className="mr-2 size-3.5" /> View Summary
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(meeting.id); toast("Meeting ID copied"); }} className="text-[#A3A3A3] focus:bg-[#242424] focus:text-white">
                              Copy meeting ID
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-[#2A2A2A]" />
                            <DropdownMenuItem className="text-[#EF4444] focus:bg-[#242424] focus:text-[#EF4444]">
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <div className="border-t border-[#2A2A2A] px-6 py-3">
              <p className="text-xs text-[#A3A3A3]">
                Showing {Math.min(filteredMeetings.length, filteredMeetings.length)} of {meetings.length} meetings
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
