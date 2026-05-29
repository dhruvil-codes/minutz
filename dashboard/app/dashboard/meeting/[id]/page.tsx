"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CheckSquare,
  ClipboardCopy,
  Clock,
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ActionItem {
  task: string;
  owner?: string;
  due_date?: string;
}

interface NicheData {
  objections_raised?: string[];
  deal_sentiment?: string;
  competitor_mentions?: string[];
  next_committed_step?: string;
  feature_requests?: string[];
  pain_points?: string[];
  themes?: string[];
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

type SignalRow = {
  label: string;
  value?: string | string[];
};

function formatDuration(seconds?: number) {
  if (!seconds) return null;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function formatSignalValue(value?: string | string[]) {
  if (!value) return "No data";
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "No data";
  }
  return value;
}

function statusBadgeClassName(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "completed") {
    return "border-green-500/20 bg-green-500/10 text-green-500";
  }
  if (normalized === "failed") {
    return "border-red-500/20 bg-red-500/10 text-red-500";
  }
  return "border-orange-500/20 bg-orange-500/10 text-orange-500";
}

function sentimentBadgeClassName(sentiment?: string) {
  const normalized = sentiment?.toLowerCase();
  if (normalized === "positive") {
    return "border-green-500/20 bg-green-500/10 text-green-500";
  }
  if (normalized === "negative") {
    return "border-red-500/20 bg-red-500/10 text-red-500";
  }
  return "border-border bg-background text-muted-foreground";
}

function urgencyBadgeClassName(urgency?: string) {
  const normalized = urgency?.toLowerCase();
  if (normalized === "medium") {
    return "border-yellow-500/20 bg-yellow-500/10 text-yellow-500";
  }
  if (normalized === "high") {
    return "border-orange-500/20 bg-orange-500/10 text-orange-500";
  }
  return "border-border bg-background text-muted-foreground";
}

function MeetingPulseValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const lower = value.toLowerCase();
  let className = "border-border bg-background text-muted-foreground";

  if (label === "Sentiment") {
    className = sentimentBadgeClassName(value);
  } else if (label === "Urgency") {
    className = urgencyBadgeClassName(value);
  } else if (lower.includes("item")) {
    className = "border-orange-500/20 bg-orange-500/10 text-orange-500";
  }

  return (
    <Badge variant="outline" className={className}>
      {value}
    </Badge>
  );
}

function SignalCard({
  title,
  description,
  rows,
}: {
  title: string;
  description: string;
  rows: SignalRow[];
}) {
  const visibleRows = rows.filter((row) => row.value !== undefined && row.value !== null);

  if (visibleRows.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <Badge variant="secondary" className="w-fit">
          Niche Intelligence
        </Badge>
        <CardTitle className="text-lg font-semibold tracking-tight">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {visibleRows.map((row) => (
          <div key={row.label} className="rounded-md bg-muted/50 p-3">
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {row.label}
            </p>
            <p className="text-sm font-medium text-foreground whitespace-normal break-words">
              {formatSignalValue(row.value)}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function buildNicheRows(niche: string, data?: NicheData): SignalRow[] {
  if (!data) return [];

  if (niche === "sales") {
    return [
      { label: "Deal sentiment", value: data.deal_sentiment },
      { label: "Next committed step", value: data.next_committed_step },
      { label: "Objections raised", value: data.objections_raised },
      { label: "Competitor mentions", value: data.competitor_mentions },
    ];
  }

  if (niche === "pm") {
    return [
      { label: "Feature requests", value: data.feature_requests },
      { label: "Pain points", value: data.pain_points },
      { label: "Themes", value: data.themes },
    ];
  }

  if (niche === "financial") {
    return [
      { label: "Client goals", value: data.client_goals },
      { label: "Risk tolerance", value: data.risk_tolerance },
      { label: "Compliance flags", value: data.compliance_flags },
    ];
  }

  return [];
}

function ProcessingState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-6 p-8 text-center sm:p-10">
        <Badge variant="secondary" className="size-14 rounded-full p-0 text-orange-500">
          <Loader2 className="size-5 animate-spin" />
        </Badge>
        <div className="space-y-2">
          <CardTitle className="text-2xl font-semibold tracking-tight">Analyzing your meeting</CardTitle>
          <CardDescription className="max-w-xl">
            Transcribing audio, extracting action items, and preparing the summary.
          </CardDescription>
        </div>
        <div className="h-2 w-full max-w-md overflow-hidden rounded-full bg-muted">
          <div className="h-full w-3/5 rounded-full bg-orange-500" />
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof CheckSquare;
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="flex min-h-[220px] flex-col items-center justify-center p-8 text-center">
        <Badge variant="secondary" className="mb-5 size-14 rounded-full p-0 text-orange-500">
          <Icon className="size-5" />
        </Badge>
        <CardTitle className="text-lg font-semibold tracking-tight">{title}</CardTitle>
        <CardDescription className="mt-2 max-w-md">{description}</CardDescription>
      </CardContent>
    </Card>
  );
}

function ActionItemCard({
  item,
  index,
}: {
  item: ActionItem;
  index: number;
}) {
  return (
    <div className="rounded-lg border bg-muted/50 p-4">
      <div className="flex gap-4">
        <Badge variant="secondary" className="h-9 w-9 shrink-0 rounded-lg p-0 text-orange-500">
          {index + 1}
        </Badge>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-medium text-foreground whitespace-normal break-words">
            {item.task}
          </p>
          <p className="text-sm text-muted-foreground">Prioritized from the meeting transcript.</p>
          <div className="flex flex-wrap gap-2">
            {item.owner ? <Badge variant="secondary">Owner: {item.owner}</Badge> : null}
            {item.due_date ? <Badge variant="outline">Due: {item.due_date}</Badge> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MeetingDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [fetchErrorMsg, setFetchErrorMsg] = useState<string | null>(null);
  const [slackLoading, setSlackLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    } catch (error) {
      setFetchError(true);
      setFetchErrorMsg(error instanceof Error ? error.message : String(error));
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
        // Keep polling until the meeting settles.
      }
    }, 3000);
  }, [fetchFull, id]);

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
      .map(
        (item, index) =>
          `${index + 1}. ${item.task}${item.owner ? ` (${item.owner})` : ""}${item.due_date ? ` - ${item.due_date}` : ""}`
      )
      .join("\n");

    navigator.clipboard.writeText(text);
    toast.success("Copied");
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
        <Card>
          <CardContent className="space-y-6 p-6">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-9 w-3/5" />
            <Skeleton className="h-4 w-2/5" />
            <Separator />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-4 p-6">
            <Skeleton className="h-10 w-full" />
            <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <Skeleton className="h-72" />
              <Skeleton className="h-72" />
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (fetchError || !meeting) {
    return (
      <main className="mx-auto flex w-full max-w-6xl items-center justify-center p-4 sm:p-6">
        <Card className="w-full">
          <CardContent className="p-6">
            <Alert>
              <AlertCircle className="size-4" />
              <AlertTitle>Meeting could not be loaded</AlertTitle>
              <AlertDescription className="mt-2">
                The backend may be offline, or this meeting no longer exists.
                {fetchErrorMsg ? (
                  <Card className="mt-4">
                    <CardContent className="p-4 text-sm text-muted-foreground">
                      {fetchErrorMsg}
                    </CardContent>
                  </Card>
                ) : null}
              </AlertDescription>
            </Alert>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={fetchFull}>
                <RefreshCw className="mr-2 size-4" />
                Retry
              </Button>
              <Button variant="outline" onClick={() => router.push("/dashboard")}>
                <ArrowLeft className="mr-2 size-4" />
                Back to dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  const isProcessing = meeting.status === "pending" || meeting.status === "processing";
  const summary = meeting.summary ?? {};
  const actionItems = summary.action_items ?? [];
  const decisions = summary.decisions ?? [];
  const followUps = summary.follow_ups ?? [];
  const formattedDuration = formatDuration(meeting.duration_seconds);
  const nicheRows = buildNicheRows(meeting.niche, summary.niche_data);
  const pulseRows = [
    {
      label: "Sentiment",
      value: summary.sentiment ? summary.sentiment : "neutral",
    },
    {
      label: "Urgency",
      value: summary.urgency ? summary.urgency : "low",
    },
    {
      label: "Next step load",
      value: `${actionItems.length + followUps.length} items`,
    },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" onClick={() => router.push("/dashboard")} className="w-fit px-0">
          <ArrowLeft className="mr-2 size-4" />
          Back to dashboard
        </Button>
        <Button variant="outline" onClick={handleSendToSlack} disabled={slackLoading || isProcessing}>
          {slackLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Send className="mr-2 size-4" />}
          Send to Slack
        </Button>
      </div>

      <Card>
        <CardHeader className="space-y-3 pb-4">
          <Badge variant="secondary" className="w-fit">
            Meeting intelligence
          </Badge>
          <CardTitle className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {meeting.title || "Untitled Meeting"}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Clean summary, decisions, and follow-ups extracted from this conversation.
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="space-y-4 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{meeting.niche || "general"}</Badge>
            <Badge className={statusBadgeClassName(meeting.status)}>{meeting.status}</Badge>
            {summary.sentiment ? (
              <Badge className={sentimentBadgeClassName(summary.sentiment)}>{summary.sentiment}</Badge>
            ) : null}
            {summary.urgency ? (
              <Badge className={urgencyBadgeClassName(summary.urgency)}>{summary.urgency} urgency</Badge>
            ) : null}
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="size-3.5" />
              {new Date(meeting.created_at).toLocaleDateString()}
            </span>
            {formattedDuration ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="size-3.5" />
                {formattedDuration}
              </span>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {isProcessing ? (
        <ProcessingState />
      ) : (
        <Tabs defaultValue="summary" className="w-full">
          <TabsList variant="line" className="grid w-full grid-cols-4">
            <TabsTrigger value="summary" className="text-sm">
              <Sparkles className="size-4" />
              Summary
            </TabsTrigger>
            <TabsTrigger value="actions" className="text-sm">
              <CheckSquare className="size-4" />
              Action Items
              {actionItems.length > 0 ? <Badge variant="secondary">{actionItems.length}</Badge> : null}
            </TabsTrigger>
            <TabsTrigger value="decisions" className="text-sm">
              <Target className="size-4" />
              Decisions
            </TabsTrigger>
            <TabsTrigger value="transcript" className="text-sm">
              <FileText className="size-4" />
              Transcript
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <Badge className="w-fit border-[#FF6A00]/20 bg-[#FF6A00]/10 text-[#FF6A00] text-xs">
                      Executive Summary
                    </Badge>
                    <CardTitle className="text-lg font-semibold tracking-tight">What happened</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-7 text-muted-foreground whitespace-pre-wrap">
                      {summary.executive_summary?.trim()
                        ? summary.executive_summary
                        : "Recording was too short to generate a full summary. Try recording at least 30 seconds of clear speech."}
                    </p>
                  </CardContent>
                </Card>

                {nicheRows.length > 0 ? (
                  <SignalCard
                    title="Mode-specific signals"
                    description={`Extracted intelligence for the ${meeting.niche || "selected"} workflow.`}
                    rows={nicheRows}
                  />
                ) : null}
              </div>

              <Card>
                <CardHeader>
                  <Badge variant="secondary" className="w-fit">
                    Signal
                  </Badge>
                  <CardTitle className="text-lg font-semibold tracking-tight">Meeting pulse</CardTitle>
                  <CardDescription>Sentiment and urgency distilled from the transcript.</CardDescription>
                </CardHeader>
                <CardContent className="px-6">
                  {pulseRows.map((row, index) => (
                    <div key={row.label}>
                      {index > 0 ? <Separator /> : null}
                      <div className="flex items-center justify-between py-3">
                        <span className="text-sm text-muted-foreground">{row.label}</span>
                        <MeetingPulseValue label={row.label} value={row.value} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="actions" className="mt-6">
            <Card>
              <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <Badge className="w-fit border-[#FF6A00]/20 bg-[#FF6A00]/10 text-[#FF6A00] text-xs">
                    Action Items
                  </Badge>
                  <CardTitle className="text-2xl font-semibold tracking-tight">Ranked next moves</CardTitle>
                  <CardDescription>
                    Tasks extracted from the conversation, ready to copy into your workflow.
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={copyAllActionItems} disabled={actionItems.length === 0}>
                  <ClipboardCopy className="mr-2 size-4" />
                  Copy all
                </Button>
              </CardHeader>
              <CardContent>
                {actionItems.length === 0 ? (
                  <EmptyState
                    icon={CheckSquare}
                    title="No action items extracted"
                    description="When the call includes clear owners or next steps, Minutz will rank them here."
                  />
                ) : (
                  <div className="space-y-3">
                    {actionItems.map((item, index) => (
                      <ActionItemCard key={`${item.task}-${index}`} item={item} index={index} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="decisions" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <Badge className="w-fit border-green-500/20 bg-green-500/10 text-green-500 text-xs">
                    Decisions
                  </Badge>
                  <CardTitle className="text-2xl font-semibold tracking-tight">Committed outcomes</CardTitle>
                  <CardDescription>What the conversation resolved or approved.</CardDescription>
                </CardHeader>
                <CardContent>
                  {decisions.length === 0 ? (
                    <EmptyState
                      icon={CheckCircle2}
                      title="No decisions recorded"
                      description="Explicit yes/no outcomes and approvals will appear here."
                    />
                  ) : (
                    <div className="space-y-3">
                      {decisions.map((decision, index) => (
                        <div key={`${decision}-${index}`} className="flex gap-4 rounded-lg border bg-muted/50 p-4">
                          <Badge className="h-9 w-9 shrink-0 rounded-lg border-green-500/20 bg-green-500/10 p-0 text-green-500">
                            <CheckCircle2 className="size-4" />
                          </Badge>
                          <p className="text-sm font-medium text-foreground whitespace-normal break-words">
                            {decision}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Badge className="w-fit border-[#FF6A00]/20 bg-[#FF6A00]/10 text-[#FF6A00] text-xs">
                    Follow-ups
                  </Badge>
                  <CardTitle className="text-2xl font-semibold tracking-tight">Things to chase</CardTitle>
                  <CardDescription>
                    Follow-through items that should not disappear after the call.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {followUps.length === 0 ? (
                    <EmptyState
                      icon={MessageSquareText}
                      title="No follow-ups"
                      description="Questions, promised docs, and relationship follow-through will show up here."
                    />
                  ) : (
                    <div className="space-y-3">
                      {followUps.map((followUp, index) => (
                        <div key={`${followUp}-${index}`} className="flex gap-4 rounded-lg border bg-muted/50 p-4">
                          <Badge className="h-9 w-9 shrink-0 rounded-lg border-[#FF6A00]/20 bg-[#FF6A00]/10 p-0 text-[#FF6A00]">
                            {index + 1}
                          </Badge>
                          <p className="text-sm font-medium text-foreground whitespace-normal break-words">
                            {followUp}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="transcript" className="mt-6">
            <Card>
              <CardHeader>
                <Badge variant="secondary" className="w-fit">
                  Transcript
                </Badge>
                <CardTitle className="text-2xl font-semibold tracking-tight">Raw call text</CardTitle>
                <CardDescription>The source material behind the AI summary.</CardDescription>
              </CardHeader>
              <CardContent>
                {meeting.transcript ? (
                  <div className="max-h-[560px] overflow-auto rounded-lg border bg-muted/30 p-6">
                    <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">
                      {meeting.transcript}
                    </p>
                  </div>
                ) : (
                  <EmptyState
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
