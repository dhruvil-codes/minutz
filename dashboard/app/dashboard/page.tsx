"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ElementType } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Sparkles,
  Video,
  VideoOff,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
}

interface Stats {
  total: number;
  completed: number;
  processing: number;
  this_week: number;
}

function nicheVariant(niche: string) {
  const map: Record<string, string> = {
    sales: "border-orange-500/20 bg-orange-500/10 text-orange-500",
    pm: "border-violet-500/20 bg-violet-500/10 text-violet-500",
    financial: "border-green-500/20 bg-green-500/10 text-green-500",
    general: "border-border bg-background text-muted-foreground",
  };

  return map[niche] ?? map.general;
}

function statusVariant(status: string) {
  const map: Record<string, string> = {
    completed: "border-green-500/20 bg-green-500/10 text-green-500",
    processing: "border-orange-500/20 bg-orange-500/10 text-orange-500",
    pending: "border-orange-500/20 bg-orange-500/10 text-orange-500",
    failed: "border-red-500/20 bg-red-500/10 text-red-500",
  };

  return map[status.toLowerCase()] ?? "border-border bg-background text-muted-foreground";
}

function StatCard({
  title,
  value,
  subtext,
  icon: Icon,
}: {
  title: string;
  value: string;
  subtext: string;
  icon: ElementType;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <CardDescription className="text-xs font-medium uppercase tracking-wider">
          {title}
        </CardDescription>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{subtext}</p>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="space-y-4 p-6">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-3 w-36" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-56" />
        </CardHeader>
        <CardContent className="p-0">
          <Skeleton className="h-[320px] w-full rounded-none" />
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyState({ onRefresh }: { onRefresh: () => void }) {
  return (
    <Card>
      <CardContent className="flex min-h-[360px] flex-col items-center justify-center p-8 text-center">
        <Badge variant="secondary" className="mb-5 size-14 rounded-full p-0 text-orange-500">
          <VideoOff className="size-5" />
        </Badge>
        <h2 className="text-2xl font-semibold tracking-tight">No meetings captured yet</h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          Start a meeting with the Chrome Extension and Minutz will turn it into a summary,
          action items, and decisions.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={onRefresh}>
            <RefreshCw className="mr-2 size-4" />
            Refresh
          </Button>
          <Button variant="outline" disabled>
            <Video className="mr-2 size-4" />
            Open extension
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    completed: 0,
    processing: 0,
    this_week: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const extensionSyncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
        completed: sorted.filter((meeting) => meeting.status === "completed").length,
        processing: sorted.filter(
          (meeting) => meeting.status === "processing" || meeting.status === "pending"
        ).length,
        this_week: sorted.filter((meeting) => new Date(meeting.created_at) >= weekAgo).length,
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
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      syncExtensionUser().catch(() => {});
    });

    return () => {
      stopRetrying();
      subscription.unsubscribe();
    };
  }, []);

  const derived = useMemo(() => {
    const completionRate = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;
    const latest = meetings[0];
    const latestText = latest
      ? `${latest.title || "Untitled"} · ${new Date(latest.created_at).toLocaleDateString()}`
      : "No meetings yet";

    const nicheCount = meetings.reduce<Record<string, number>>((acc, meeting) => {
      const key = meeting.niche || "general";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const topNiche = Object.entries(nicheCount).sort((a, b) => b[1] - a[1])[0];

    return {
      completionRate,
      latestText,
      topNiche: topNiche ? `${topNiche[0]} (${topNiche[1]})` : "n/a",
    };
  }, [meetings, stats]);

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 p-4 text-foreground sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Badge variant="secondary" className="w-fit">
            <Sparkles className="mr-1 size-3" />
            Meeting intelligence
          </Badge>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Your meeting pipeline, summaries, and operational signals in one place.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchMeetings}>
          <RefreshCw className="mr-2 size-3.5" />
          Refresh
        </Button>
      </div>

      {error ? (
        <Alert>
          <AlertCircle className="size-4" />
          <AlertTitle>Backend connection failed</AlertTitle>
          <AlertDescription>
            We couldn&apos;t load meetings from the local API.
            <Button variant="outline" size="sm" onClick={fetchMeetings} className="mt-3">
              <RefreshCw className="mr-2 size-3.5" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <DashboardSkeleton />
      ) : meetings.length === 0 ? (
        <EmptyState onRefresh={fetchMeetings} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total meetings"
              value={String(stats.total)}
              subtext={derived.latestText}
              icon={Video}
            />
            <StatCard
              title="Completed"
              value={String(stats.completed)}
              subtext={`${derived.completionRate}% completion rate`}
              icon={CheckCircle2}
            />
            <StatCard
              title="Processing"
              value={String(stats.processing)}
              subtext={stats.processing ? "Summaries in pipeline" : "Pipeline is clear"}
              icon={Loader2}
            />
            <StatCard
              title="This week"
              value={String(stats.this_week)}
              subtext={`Top niche: ${derived.topNiche}`}
              icon={Calendar}
            />
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 border-b pb-4">
              <div className="space-y-1">
                <CardTitle className="text-sm font-semibold">Recent meetings</CardTitle>
                <CardDescription>
                  Click a row to inspect summary, actions, and transcript.
                </CardDescription>
              </div>
              <Badge variant="secondary">{meetings.length} total</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Title
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Niche
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Status
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Date
                    </TableHead>
                    <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Open
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {meetings.map((meeting) => (
                    <TableRow
                      key={meeting.id}
                      className="cursor-pointer transition-colors hover:bg-muted/50"
                      onClick={() => router.push(`/dashboard/meeting/${meeting.id}`)}
                    >
                      <TableCell className="py-4 text-sm font-medium text-foreground">
                        {meeting.title || "Untitled"}
                      </TableCell>
                      <TableCell className="py-4 text-sm">
                        <Badge variant="outline" className={nicheVariant(meeting.niche)}>
                          {meeting.niche || "general"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 text-sm">
                        <Badge variant="outline" className={statusVariant(meeting.status)}>
                          {meeting.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 text-sm text-muted-foreground">
                        {new Date(meeting.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="py-4 text-right text-sm">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={(event) => {
                            event.stopPropagation();
                            router.push(`/dashboard/meeting/${meeting.id}`);
                          }}
                          aria-label={`Open ${meeting.title || "meeting"}`}
                        >
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
    </main>
  );
}
