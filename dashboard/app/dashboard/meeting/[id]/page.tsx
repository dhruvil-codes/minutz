"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CheckSquare,
  ClipboardCopy,
  Clock3,
  FileText,
  Loader2,
  MessageSquareText,
  RefreshCw,
  Send,
  Sparkles,
  Target,
} from "lucide-react";
import { toast } from "sonner";

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
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ActionItem {
  task: string;
  owner?: string;
  due_date?: string;
}

interface NicheData {
  // Sales
  objections_raised?: string[];
  deal_sentiment?: string;
  competitor_mentions?: string[];
  next_committed_step?: string;
  // PM
  feature_requests?: string[];
  pain_points?: string[];
  themes?: string[];
  // Financial
  client_goals?: string[];
  risk_tolerance?: string;
  compliance_flags?: string[];
}

interface MeetingDetail {
  id: string;
  title: string;
  niche: string;
  status: string;
  created_at: string;
  duration_seconds?: number;
  transcript?: string;
  summary?: {
    executive_summary?: string;
    sentiment?: string;
    urgency?: string;
    action_items?: ActionItem[];
    decisions?: string[];
    follow_ups?: string[];
    niche_data?: NicheData;
  };
}

const SURFACE = "border-[#2A2A2A] bg-[#1A1A1A] text-white shadow-[0_20px_80px_rgba(0,0,0,0.35)]";
const SOFT_SURFACE = "border-[#2A2A2A] bg-[#131313] text-white";
const MUTED_TEXT = "text-[#A3A3A3]";

function sentimentColor(s?: string) {
  if (!s) return "border-[#2A2A2A] bg-[#2A2A2A] text-[#A3A3A3]";
  const l = s.toLowerCase();
  if (l === "positive") return "border-[#22C55E]/25 bg-[#22C55E]/10 text-[#22C55E]";
  if (l === "negative") return "border-[#EF4444]/25 bg-[#EF4444]/10 text-[#EF4444]";
  return "border-[#2A2A2A] bg-[#2A2A2A] text-[#A3A3A3]";
}

function urgencyColor(u?: string) {
  if (!u) return "border-[#2A2A2A] bg-[#2A2A2A] text-[#A3A3A3]";
  const l = u.toLowerCase();
  if (l === "high") return "border-[#FF6A00]/30 bg-[#FF6A00]/10 text-[#FF6A00]";
  if (l === "medium") return "border-yellow-400/25 bg-yellow-400/10 text-yellow-300";
  return "border-[#22C55E]/25 bg-[#22C55E]/10 text-[#22C55E]";
}

function nicheBadgeColor(niche: string) {
  const map: Record<string, string> = {
    sales: "border-blue-400/25 bg-blue-500/10 text-blue-300",
    pm: "border-purple-400/25 bg-purple-500/10 text-purple-300",
    financial: "border-[#22C55E]/25 bg-[#22C55E]/10 text-[#22C55E]",
    general: "border-[#2A2A2A] bg-[#2A2A2A] text-[#A3A3A3]",
  };
  return map[niche] ?? "border-[#2A2A2A] bg-[#2A2A2A] text-[#A3A3A3]";
}

function statusBadgeColor(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "completed") return "border-[#22C55E]/25 bg-[#22C55E]/10 text-[#22C55E]";
  if (normalized === "failed") return "border-[#EF4444]/25 bg-[#EF4444]/10 text-[#EF4444]";
  return "border-[#FF6A00]/30 bg-[#FF6A00]/10 text-[#FF6A00] animate-pulse";
}

function formatDuration(seconds?: number) {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function EmptyFeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof CheckSquare;
  title: string;
  description: string;
}) {
  return (
    <Card className={`${SOFT_SURFACE} overflow-hidden`}>
      <CardContent className="flex min-h-[220px] flex-col items-center justify-center p-10 text-center">
        <Badge className="mb-5 h-14 w-14 rounded-2xl border-[#2A2A2A] bg-[#1A1A1A] text-[#FF6A00]">
          <Icon className="size-6" />
        </Badge>
        <CardTitle className="text-lg text-white">{title}</CardTitle>
        <CardDescription className="mt-2 max-w-md text-[#A3A3A3]">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  );
}

function ProcessingState() {
  return (
    <Card className={`${SURFACE} overflow-hidden`}>
      <CardContent className="flex flex-col items-center justify-center gap-7 p-14 text-center">
        <Badge className="relative h-20 w-20 rounded-full border-[#2A2A2A] bg-[#0D0D0D] text-[#FF6A00]">
          <Loader2 className="size-8 animate-spin" />
        </Badge>
        <CardHeader className="p-0">
          <CardTitle className="text-2xl text-white">Analyzing your meeting</CardTitle>
          <CardDescription className="mx-auto mt-2 max-w-xl text-[#A3A3A3]">
            Transcribing audio, extracting action items, and preparing your summary.
            This usually lands in about 60 seconds.
          </CardDescription>
        </CardHeader>
        <Progress
          value={58}
          className="h-2 max-w-md bg-[#2A2A2A]"
          indicatorClassName="animate-pulse bg-[#FF6A00]"
        />
      </CardContent>
    </Card>
  );
}

function NicheIntelligenceCard({ niche, data }: { niche: string; data: NicheData }) {
  const rows: { label: string; value: string | string[] | undefined }[] = [];

  if (niche === "sales") {
    rows.push(
      { label: "Deal Sentiment", value: data.deal_sentiment },
      { label: "Next Committed Step", value: data.next_committed_step },
      { label: "Objections Raised", value: data.objections_raised },
      { label: "Competitor Mentions", value: data.competitor_mentions }
    );
  } else if (niche === "pm") {
    rows.push(
      { label: "Feature Requests", value: data.feature_requests },
      { label: "Pain Points", value: data.pain_points },
      { label: "Themes", value: data.themes }
    );
  } else if (niche === "financial") {
    rows.push(
      { label: "Client Goals", value: data.client_goals },
      { label: "Risk Tolerance", value: data.risk_tolerance },
      { label: "Compliance Flags", value: data.compliance_flags }
    );
  }

  const hasContent = rows.some((r) => r.value && (Array.isArray(r.value) ? r.value.length > 0 : true));
  if (!hasContent) return null;

  return (
    <Card className={`${SURFACE} lg:col-span-2`}>
      <CardHeader>
        <Badge className="mb-3 w-fit border-[#FF6A00]/30 bg-[#FF6A00]/10 text-[#FF6A00]">
          Niche Intelligence
        </Badge>
        <CardTitle className="text-xl text-white">Mode-specific signals</CardTitle>
        <CardDescription className="text-[#A3A3A3]">
          Extracted intelligence for the {niche || "selected"} workflow.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {rows.map((row) => {
          if (!row.value || (Array.isArray(row.value) && row.value.length === 0)) return null;
          const values = Array.isArray(row.value) ? row.value : [row.value];
          return (
            <Card key={row.label} className={SOFT_SURFACE}>
              <CardHeader className="pb-3">
                <CardDescription className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#707070]">
                  {row.label}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {values.map((value, index) => (
                  <Badge
                    key={`${row.label}-${index}`}
                    className="border-[#2A2A2A] bg-[#0D0D0D] text-[#D4D4D4]"
                  >
                    {value}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default function MeetingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [slackLoading, setSlackLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [fetchErrorMsg, setFetchErrorMsg] = useState<string | null>(null);

  const fetchFull = useCallback(async () => {
    try {
      const res = await fetch(`http://localhost:8001/meeting/${id}`);
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`${res.status}: ${body || "Unknown error"}`);
      }
      const data: MeetingDetail = await res.json();
      setMeeting(data);
      setFetchError(false);
      setFetchErrorMsg(null);
      return data;
    } catch (err) {
      setFetchError(true);
      setFetchErrorMsg(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setLoading(false);
    }
  }, [id]);

  const startPolling = useCallback(() => {
    if (pollRef.current) return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:8001/meeting/${id}/status`);
        if (!res.ok) return;
        const { status } = await res.json();
        if (status === "completed" || status === "failed") {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
          await fetchFull();
        }
      } catch {
        // keep polling
      }
    }, 3000);
  }, [id, fetchFull]);

  useEffect(() => {
    fetchFull().then((data) => {
      if (data && (data.status === "pending" || data.status === "processing")) {
        startPolling();
      }
    });
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchFull, startPolling]);

  async function handleSendToSlack() {
    const channelId = localStorage.getItem("slack_channel_id")?.trim() ?? "";
    if (!channelId) {
      toast.error("Set Slack Channel ID in Settings first.");
      return;
    }

    setSlackLoading(true);
    try {
      const res = await fetch("/api/send-to-slack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meeting_id: id, channel_id: channelId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Error sending to Slack" }));
        throw new Error(data.error || "Error sending to Slack");
      }
      toast.success("Sent to Slack");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error sending to Slack");
    } finally {
      setSlackLoading(false);
    }
  }

  function copyAllActionItems() {
    const items = meeting?.summary?.action_items ?? [];
    const text = items
      .map((a, i) => `${i + 1}. ${a.task}${a.owner ? ` (${a.owner})` : ""}${a.due_date ? ` - ${a.due_date}` : ""}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Copied");
  }

  if (loading) {
    return (
      <Card className={`${SURFACE} mx-auto max-w-7xl`}>
        <CardContent className="space-y-7 p-8">
          <Skeleton className="h-9 w-44 bg-[#2A2A2A]" />
          <Skeleton className="h-20 w-full rounded-2xl bg-[#2A2A2A]" />
          <div className="grid gap-4 lg:grid-cols-3">
            <Skeleton className="h-56 rounded-2xl bg-[#2A2A2A]" />
            <Skeleton className="h-56 rounded-2xl bg-[#2A2A2A] lg:col-span-2" />
          </div>
          <Skeleton className="h-72 rounded-2xl bg-[#2A2A2A]" />
        </CardContent>
      </Card>
    );
  }

  if (fetchError || !meeting) {
    return (
      <Card className={`${SURFACE} mx-auto max-w-3xl`}>
        <CardContent className="p-8">
          <Alert className="border-[#EF4444]/30 bg-[#EF4444]/10 text-white">
            <AlertCircle className="size-4 text-[#EF4444]" />
            <AlertTitle className="text-white">Meeting could not be loaded</AlertTitle>
            <AlertDescription className="mt-2 text-[#A3A3A3]">
              The backend may be offline, or this meeting no longer exists.
              {fetchErrorMsg ? (
                <Card className="mt-4 border-[#EF4444]/20 bg-[#0D0D0D]">
                  <CardContent className="p-4 text-xs text-[#EF4444]">{fetchErrorMsg}</CardContent>
                </Card>
              ) : null}
            </AlertDescription>
          </Alert>
          <CardContent className="flex gap-3 px-0 pb-0 pt-6">
            <Button onClick={fetchFull} className="bg-[#FF6A00] text-white hover:bg-[#FF6A00]/90">
              <RefreshCw className="mr-2 size-4" />
              Retry
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard")}
              className="border-[#2A2A2A] bg-transparent text-[#A3A3A3] hover:bg-[#1A1A1A] hover:text-white"
            >
              <ArrowLeft className="mr-2 size-4" />
              Back to dashboard
            </Button>
          </CardContent>
        </CardContent>
      </Card>
    );
  }

  const isProcessing = meeting.status === "pending" || meeting.status === "processing";
  const summary = meeting.summary ?? {};
  const actionItems = summary.action_items ?? [];
  const decisions = summary.decisions ?? [];
  const followUps = summary.follow_ups ?? [];
  const formattedDuration = formatDuration(meeting.duration_seconds);

  return (
    <main className="mx-auto max-w-7xl space-y-8">
      <Card className={`${SURFACE} overflow-hidden`}>
        <CardContent className="p-6 md:p-8">
          <CardContent className="mb-8 flex flex-col gap-3 p-0 sm:flex-row sm:items-center sm:justify-between">
            <Button
              variant="ghost"
              onClick={() => router.push("/dashboard")}
              className="w-fit px-0 text-[#A3A3A3] hover:bg-transparent hover:text-white"
            >
              <ArrowLeft className="mr-2 size-4" />
              Back to dashboard
            </Button>
            <Button
              onClick={handleSendToSlack}
              disabled={slackLoading || isProcessing}
              variant="outline"
              className="w-fit border-[#2A2A2A] bg-[#0D0D0D] text-[#A3A3A3] hover:border-[#FF6A00] hover:bg-[#FF6A00]/10 hover:text-[#FF6A00]"
            >
              {slackLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Send className="mr-2 size-4" />}
              Send to Slack
            </Button>
          </CardContent>

          <CardHeader className="p-0">
            <Badge className="mb-4 w-fit border-[#FF6A00]/30 bg-[#FF6A00]/10 text-[#FF6A00]">
              Meeting Intelligence
            </Badge>
            <CardTitle className="max-w-4xl text-4xl font-semibold tracking-[-0.04em] text-white md:text-5xl">
              {meeting.title || "Untitled Meeting"}
            </CardTitle>
            <CardDescription className="mt-3 text-base text-[#A3A3A3]">
              Clean summary, decisions, and follow-ups extracted from this conversation.
            </CardDescription>
          </CardHeader>

          <CardContent className="mt-7 flex flex-wrap gap-2 p-0">
            <Badge className={nicheBadgeColor(meeting.niche)}>{meeting.niche || "general"}</Badge>
            <Badge className={statusBadgeColor(meeting.status)}>{meeting.status}</Badge>
            {summary.sentiment ? <Badge className={sentimentColor(summary.sentiment)}>{summary.sentiment}</Badge> : null}
            {summary.urgency ? <Badge className={urgencyColor(summary.urgency)}>{summary.urgency} urgency</Badge> : null}
            <Badge className="border-[#2A2A2A] bg-[#0D0D0D] text-[#A3A3A3]">
              <Clock3 className="mr-1.5 size-3.5" />
              {new Date(meeting.created_at).toLocaleDateString()}
            </Badge>
            {formattedDuration ? (
              <Badge className="border-[#2A2A2A] bg-[#0D0D0D] text-[#A3A3A3]">{formattedDuration}</Badge>
            ) : null}
          </CardContent>
        </CardContent>
      </Card>

      {isProcessing ? (
        <ProcessingState />
      ) : (
        <Tabs defaultValue="summary" className="flex w-full flex-col gap-5">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-2xl border border-[#2A2A2A] bg-[#1A1A1A] p-2 md:grid-cols-4">
            <TabsTrigger
              value="summary"
              className="h-11 rounded-xl px-4 text-[#A3A3A3] data-active:border-[#2A2A2A] data-active:bg-[#0D0D0D] data-active:text-white"
            >
              <Sparkles className="size-4" />
              Summary
            </TabsTrigger>
            <TabsTrigger
              value="actions"
              className="h-11 rounded-xl px-4 text-[#A3A3A3] data-active:border-[#2A2A2A] data-active:bg-[#0D0D0D] data-active:text-white"
            >
              <CheckSquare className="size-4" />
              Action Items
              {actionItems.length > 0 ? <Badge className="ml-1 bg-[#FF6A00] text-white">{actionItems.length}</Badge> : null}
            </TabsTrigger>
            <TabsTrigger
              value="decisions"
              className="h-11 rounded-xl px-4 text-[#A3A3A3] data-active:border-[#2A2A2A] data-active:bg-[#0D0D0D] data-active:text-white"
            >
              <Target className="size-4" />
              Decisions
            </TabsTrigger>
            <TabsTrigger
              value="transcript"
              className="h-11 rounded-xl px-4 text-[#A3A3A3] data-active:border-[#2A2A2A] data-active:bg-[#0D0D0D] data-active:text-white"
            >
              <FileText className="size-4" />
              Transcript
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="w-full grid gap-4 lg:grid-cols-3">
            <Card className={`${SURFACE} lg:col-span-2`}>
              <CardHeader>
                <Badge className="mb-3 w-fit border-[#FF6A00]/30 bg-[#FF6A00]/10 text-[#FF6A00]">
                  Executive Summary
                </Badge>
                <CardTitle className="text-2xl text-white">What happened</CardTitle>
              </CardHeader>
              <CardContent>
                <Card className={SOFT_SURFACE}>
                  <CardContent className="p-6 text-base leading-8 text-[#D4D4D4]">
                    {summary.executive_summary && summary.executive_summary.trim()
                      ? summary.executive_summary
                      : "Recording was too short to generate a full summary. Try recording at least 30 seconds of clear speech."}
                  </CardContent>
                </Card>
              </CardContent>
            </Card>

            <Card className={SURFACE}>
              <CardHeader>
                <Badge className="mb-3 w-fit border-[#2A2A2A] bg-[#0D0D0D] text-[#A3A3A3]">
                  Signal
                </Badge>
                <CardTitle className="text-xl text-white">Meeting pulse</CardTitle>
                <CardDescription className={MUTED_TEXT}>
                  Sentiment and urgency distilled from the transcript.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Card className={SOFT_SURFACE}>
                  <CardContent className="flex items-center justify-between p-4">
                    <CardDescription className="text-[#A3A3A3]">Sentiment</CardDescription>
                    <Badge className={sentimentColor(summary.sentiment)}>{summary.sentiment || "neutral"}</Badge>
                  </CardContent>
                </Card>
                <Card className={SOFT_SURFACE}>
                  <CardContent className="flex items-center justify-between p-4">
                    <CardDescription className="text-[#A3A3A3]">Urgency</CardDescription>
                    <Badge className={urgencyColor(summary.urgency)}>{summary.urgency || "low"}</Badge>
                  </CardContent>
                </Card>
                <Card className={SOFT_SURFACE}>
                  <CardContent className="flex items-center justify-between p-4">
                    <CardDescription className="text-[#A3A3A3]">Next step load</CardDescription>
                    <Badge className="border-[#FF6A00]/30 bg-[#FF6A00]/10 text-[#FF6A00]">
                      {actionItems.length + followUps.length} items
                    </Badge>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>

            {summary.niche_data ? <NicheIntelligenceCard niche={meeting.niche} data={summary.niche_data} /> : null}
          </TabsContent>

          <TabsContent value="actions" className="w-full space-y-4">
            <Card className={SURFACE}>
              <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <CardContent className="p-0">
                  <Badge className="mb-3 w-fit border-[#FF6A00]/30 bg-[#FF6A00]/10 text-[#FF6A00]">
                    Action Items
                  </Badge>
                  <CardTitle className="text-2xl text-white">Ranked next moves</CardTitle>
                  <CardDescription className={MUTED_TEXT}>
                    Tasks extracted from the conversation, ready to copy into your workflow.
                  </CardDescription>
                </CardContent>
                <Button
                  onClick={copyAllActionItems}
                  disabled={actionItems.length === 0}
                  variant="outline"
                  className="border-[#2A2A2A] bg-[#0D0D0D] text-[#A3A3A3] hover:border-[#FF6A00] hover:bg-[#FF6A00]/10 hover:text-[#FF6A00]"
                >
                  <ClipboardCopy className="mr-2 size-4" />
                  Copy all
                </Button>
              </CardHeader>
              <CardContent>
                {actionItems.length === 0 ? (
                  <EmptyFeatureCard
                    icon={CheckSquare}
                    title="No action items extracted"
                    description="When the call includes clear owners or next steps, Minutz will rank them here."
                  />
                ) : (
                  <Card className={SOFT_SURFACE}>
                    <CardContent className="grid gap-3 p-4">
                      {actionItems.map((item, index) => (
                        <Card key={`${item.task}-${index}`} className="border-[#2A2A2A] bg-[#0D0D0D]">
                          <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-start md:justify-between">
                            <CardContent className="flex gap-4 p-0">
                              <Badge className="h-9 w-9 rounded-xl border-[#FF6A00]/30 bg-[#FF6A00]/10 text-[#FF6A00]">
                                {index + 1}
                              </Badge>
                              <CardContent className="p-0">
                                <CardTitle className="text-base leading-6 text-white">{item.task}</CardTitle>
                                <CardDescription className="mt-2 text-[#A3A3A3]">
                                  Prioritized from the meeting transcript.
                                </CardDescription>
                              </CardContent>
                            </CardContent>
                            <CardContent className="flex flex-wrap gap-2 p-0 md:justify-end">
                              {item.owner ? (
                                <Badge className="border-[#FF6A00]/30 bg-[#FF6A00]/10 text-[#FF6A00]">
                                  Owner: {item.owner}
                                </Badge>
                              ) : null}
                              {item.due_date ? (
                                <Badge className="border-[#2A2A2A] bg-[#1A1A1A] text-[#A3A3A3]">
                                  Due: {item.due_date}
                                </Badge>
                              ) : null}
                            </CardContent>
                          </CardContent>
                        </Card>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="decisions" className="w-full grid gap-4 lg:grid-cols-2">
            <Card className={SURFACE}>
              <CardHeader>
                <Badge className="mb-3 w-fit border-[#22C55E]/25 bg-[#22C55E]/10 text-[#22C55E]">
                  Decisions
                </Badge>
                <CardTitle className="text-2xl text-white">Committed outcomes</CardTitle>
                <CardDescription className={MUTED_TEXT}>
                  What the conversation resolved or approved.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {decisions.length === 0 ? (
                  <EmptyFeatureCard
                    icon={CheckCircle2}
                    title="No decisions recorded"
                    description="Explicit yes/no outcomes and approvals will appear here."
                  />
                ) : (
                  decisions.map((decision, index) => (
                    <Card key={`${decision}-${index}`} className={SOFT_SURFACE}>
                      <CardContent className="flex gap-4 p-5">
                        <Badge className="h-9 w-9 rounded-xl border-[#22C55E]/25 bg-[#22C55E]/10 text-[#22C55E]">
                          <CheckCircle2 className="size-4" />
                        </Badge>
                        <CardTitle className="text-base leading-6 text-white">{decision}</CardTitle>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className={SURFACE}>
              <CardHeader>
                <Badge className="mb-3 w-fit border-[#FF6A00]/30 bg-[#FF6A00]/10 text-[#FF6A00]">
                  Follow-ups
                </Badge>
                <CardTitle className="text-2xl text-white">Things to chase</CardTitle>
                <CardDescription className={MUTED_TEXT}>
                  Follow-through items that should not disappear after the call.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {followUps.length === 0 ? (
                  <EmptyFeatureCard
                    icon={MessageSquareText}
                    title="No follow-ups"
                    description="Questions, promised docs, and relationship follow-through will show up here."
                  />
                ) : (
                  followUps.map((followUp, index) => (
                    <Card key={`${followUp}-${index}`} className={SOFT_SURFACE}>
                      <CardContent className="flex gap-4 p-5">
                        <Badge className="h-9 w-9 rounded-xl border-[#FF6A00]/30 bg-[#FF6A00]/10 text-[#FF6A00]">
                          {index + 1}
                        </Badge>
                        <CardTitle className="text-base leading-6 text-white">{followUp}</CardTitle>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transcript" className="w-full">
            <Card className={SURFACE}>
              <CardHeader>
                <Badge className="mb-3 w-fit border-[#2A2A2A] bg-[#0D0D0D] text-[#A3A3A3]">
                  Transcript
                </Badge>
                <CardTitle className="text-2xl text-white">Raw call text</CardTitle>
                <CardDescription className={MUTED_TEXT}>
                  The source material behind the AI summary.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {meeting.transcript ? (
                  <Card className={`${SOFT_SURFACE} max-h-[560px] overflow-y-auto`}>
                    <CardContent className="whitespace-pre-wrap p-6 text-sm leading-7 text-[#D4D4D4]">
                      {meeting.transcript}
                    </CardContent>
                  </Card>
                ) : (
                  <EmptyFeatureCard
                    icon={FileText}
                    title="No transcript available"
                    description="Once transcription completes, the full text will be available here."
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </main>
  );
}
