"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckSquare,
  ClipboardCopy,
  Loader2,
  RefreshCw,
  Send,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

function sentimentColor(s?: string) {
  if (!s) return "bg-[#2A2A2A] text-[#A3A3A3]";
  const l = s.toLowerCase();
  if (l === "positive") return "bg-green-500/10 text-green-400";
  if (l === "negative") return "bg-red-500/10 text-red-400";
  return "bg-[#2A2A2A] text-[#A3A3A3]";
}

function urgencyColor(u?: string) {
  if (!u) return "bg-[#2A2A2A] text-[#A3A3A3]";
  const l = u.toLowerCase();
  if (l === "high") return "bg-[#FF6A00]/10 text-[#FF6A00]";
  if (l === "medium") return "bg-yellow-500/10 text-yellow-400";
  return "bg-green-500/10 text-green-400";
}

function nicheBadgeColor(niche: string) {
  const map: Record<string, string> = {
    sales: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    pm: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
    financial: "bg-green-500/10 text-green-400 border border-green-500/20",
    general: "bg-[#2A2A2A] text-[#A3A3A3]",
  };
  return map[niche] ?? "bg-[#2A2A2A] text-[#A3A3A3]";
}

function formatDuration(seconds?: number) {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function ProcessingState() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-24">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-4 border-[#2A2A2A]" />
        <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-transparent border-t-[#FF6A00]" />
      </div>
      <div className="text-center">
        <p className="text-lg font-semibold text-white">Analyzing your meeting...</p>
        <p className="mt-2 text-sm text-[#6B6B6B]">
          Transcribing audio and extracting intelligence. This takes about 60 seconds.
        </p>
      </div>
      <div className="h-1.5 w-64 overflow-hidden rounded-full bg-[#2A2A2A]">
        <div className="h-full w-1/2 animate-[shimmer-slide_2s_ease-in-out_infinite_alternate] rounded-full bg-gradient-to-r from-[#FF6A00] to-[#FFB347]" />
      </div>
    </div>
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
    <Card className="border-[#2A2A2A] bg-[#1A1A1A]">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-white">Niche Intelligence</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map((row) => {
          if (!row.value || (Array.isArray(row.value) && row.value.length === 0)) return null;
          return (
            <div key={row.label}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6B6B6B]">{row.label}</p>
              {Array.isArray(row.value) ? (
                <ul className="mt-1 space-y-1">
                  {row.value.map((v, i) => (
                    <li key={i} className="text-sm text-[#A3A3A3]">- {v}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-sm text-[#A3A3A3]">{row.value}</p>
              )}
            </div>
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

  const fetchFull = useCallback(async () => {
    try {
      const res = await fetch(`http://localhost:8001/meeting/${id}`);
      if (!res.ok) throw new Error("Not found");
      const data: MeetingDetail = await res.json();
      setMeeting(data);
      setFetchError(false);
      return data;
    } catch {
      setFetchError(true);
      return null;
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Poll status while pending/processing
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
      <div className="space-y-4">
        <Skeleton className="h-8 w-48 bg-[#2A2A2A]" />
        <Skeleton className="h-5 w-72 bg-[#2A2A2A]" />
        <Skeleton className="h-64 w-full bg-[#2A2A2A]" />
      </div>
    );
  }

  if (fetchError || !meeting) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-sm text-[#6B6B6B]">Meeting not found or backend offline.</p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchFull}
            className="border-[#2A2A2A] text-[#A3A3A3] hover:text-white"
          >
            <RefreshCw className="mr-2 h-3.5 w-3.5" /> Retry
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard")}
            className="text-[#A3A3A3] hover:text-white"
          >
            <ArrowLeft className="mr-2 h-3.5 w-3.5" /> Back
          </Button>
        </div>
      </div>
    );
  }

  const isProcessing = meeting.status === "pending" || meeting.status === "processing";
  const summary = meeting.summary ?? {};
  const actionItems = summary.action_items ?? [];
  const decisions = summary.decisions ?? [];
  const followUps = summary.follow_ups ?? [];

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push("/dashboard")}
        className="flex items-center gap-1.5 text-sm text-[#6B6B6B] transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="space-y-3">
        <h1 className="text-2xl font-extrabold tracking-tight text-white">
          {meeting.title || "Untitled Meeting"}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${nicheBadgeColor(meeting.niche)}`}>
            {meeting.niche}
          </span>
          {summary.sentiment && (
            <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${sentimentColor(summary.sentiment)}`}>
              {summary.sentiment}
            </span>
          )}
          <span className="inline-flex items-center rounded-md bg-[#2A2A2A] px-2.5 py-0.5 text-xs font-semibold text-[#A3A3A3]">
            {new Date(meeting.created_at).toLocaleDateString()}
          </span>
          {formatDuration(meeting.duration_seconds) && (
            <span className="inline-flex items-center rounded-md bg-[#2A2A2A] px-2.5 py-0.5 text-xs font-semibold text-[#A3A3A3]">
              {formatDuration(meeting.duration_seconds)}
            </span>
          )}
          <button
            onClick={handleSendToSlack}
            disabled={slackLoading || isProcessing}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-[#2A2A2A] px-3 py-1.5 text-xs font-semibold text-[#A3A3A3] transition-colors hover:border-[#FF6A00] hover:text-[#FF6A00] disabled:opacity-40"
          >
            {slackLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Send to Slack
          </button>
        </div>
      </div>

      {isProcessing ? (
        <ProcessingState />
      ) : (
        <Tabs defaultValue="summary">
          <TabsList className="bg-[#1A1A1A] border border-[#2A2A2A]">
            <TabsTrigger value="summary" className="data-[state=active]:bg-[#2A2A2A] data-[state=active]:text-white">
              Summary
            </TabsTrigger>
            <TabsTrigger value="actions" className="data-[state=active]:bg-[#2A2A2A] data-[state=active]:text-white">
              Action Items {actionItems.length > 0 && `(${actionItems.length})`}
            </TabsTrigger>
            <TabsTrigger value="decisions" className="data-[state=active]:bg-[#2A2A2A] data-[state=active]:text-white">
              Decisions &amp; Follow-ups
            </TabsTrigger>
          </TabsList>

          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-4 pt-4">
            <Card className="border-[#2A2A2A] bg-[#1A1A1A]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-white">Executive Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-[#A3A3A3]">
                  {summary.executive_summary ?? "No summary available."}
                </p>
              </CardContent>
            </Card>

            {(summary.sentiment || summary.urgency) && (
              <div className="flex flex-wrap gap-2">
                {summary.sentiment && (
                  <div className="flex items-center gap-2 rounded-lg border border-[#2A2A2A] px-3 py-2 text-sm">
                    <span className="text-[#6B6B6B]">Sentiment</span>
                    <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${sentimentColor(summary.sentiment)}`}>
                      {summary.sentiment}
                    </span>
                  </div>
                )}
                {summary.urgency && (
                  <div className="flex items-center gap-2 rounded-lg border border-[#2A2A2A] px-3 py-2 text-sm">
                    <span className="text-[#6B6B6B]">Urgency</span>
                    <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${urgencyColor(summary.urgency)}`}>
                      {summary.urgency}
                    </span>
                  </div>
                )}
              </div>
            )}

            {summary.niche_data && (
              <NicheIntelligenceCard niche={meeting.niche} data={summary.niche_data} />
            )}
          </TabsContent>

          {/* Action Items Tab */}
          <TabsContent value="actions" className="space-y-4 pt-4">
            <div className="flex justify-end">
              <button
                onClick={copyAllActionItems}
                disabled={actionItems.length === 0}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#2A2A2A] px-3 py-1.5 text-xs font-semibold text-[#A3A3A3] transition-colors hover:border-[#FF6A00] hover:text-[#FF6A00] disabled:opacity-40"
              >
                <ClipboardCopy className="h-3.5 w-3.5" /> Copy all as markdown
              </button>
            </div>

            {actionItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-[#2A2A2A] py-12 text-[#6B6B6B]">
                <CheckSquare className="h-7 w-7 opacity-30" />
                <span className="text-sm">No action items extracted</span>
              </div>
            ) : (
              <div className="space-y-3">
                {actionItems.map((item, i) => (
                  <Card key={i} className="border-[#2A2A2A] bg-[#1A1A1A]">
                    <CardContent className="flex items-start justify-between gap-4 pt-4 pb-4">
                      <div className="flex items-start gap-3">
                        <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-[#FF6A00]" />
                        <p className="text-sm font-medium text-white">{item.task}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        {item.owner && (
                          <span className="rounded-md bg-[#FF6A00]/10 px-2 py-0.5 text-xs font-semibold text-[#FF6A00]">
                            {item.owner}
                          </span>
                        )}
                        {item.due_date && (
                          <span className="text-xs text-[#6B6B6B]">{item.due_date}</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Decisions & Follow-ups Tab */}
          <TabsContent value="decisions" className="space-y-4 pt-4">
            <Card className="border-[#2A2A2A] bg-[#1A1A1A]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-white">Decisions</CardTitle>
              </CardHeader>
              <CardContent>
                {decisions.length === 0 ? (
                  <p className="text-sm text-[#6B6B6B]">No decisions recorded.</p>
                ) : (
                  <ol className="space-y-2.5">
                    {decisions.map((d, i) => (
                      <li key={i} className="flex gap-2.5 text-sm">
                        <span className="shrink-0 font-semibold text-[#FF6A00]">{i + 1}.</span>
                        <span className="text-[#A3A3A3]">{d}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>

            <Card className="border-[#2A2A2A] bg-[#1A1A1A]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-white">Follow-ups</CardTitle>
              </CardHeader>
              <CardContent>
                {followUps.length === 0 ? (
                  <p className="text-sm text-[#6B6B6B]">No follow-ups.</p>
                ) : (
                  <ul className="space-y-2.5">
                    {followUps.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm">
                        <input
                          type="checkbox"
                          className="mt-0.5 shrink-0 accent-[#FF6A00]"
                          readOnly
                        />
                        <span className="text-[#A3A3A3]">{f}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
