"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Calendar, CheckCircle, Loader2, RefreshCw, Video, VideoOff } from "lucide-react";

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
  cost_usd?: number;
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

export default function MeetingsPage() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMeetings = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8001"}/meetings`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data: Meeting[] = await res.json();
      const sorted = [...data].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setMeetings(sorted);
      setError(false);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white">Meetings</h1>
        <p className="mt-1 text-sm text-[#6B6B6B]">All your recorded meetings</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#1A1A1A]">
        {loading ? (
          <div className="space-y-px p-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3">
                <Skeleton className="h-4 w-48 bg-[#2A2A2A]" />
                <Skeleton className="h-4 w-16 bg-[#2A2A2A]" />
                <Skeleton className="h-4 w-20 bg-[#2A2A2A]" />
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
          <Table>
            <TableHeader>
              <TableRow className="border-b border-[#2A2A2A] hover:bg-transparent">
                <TableHead className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6B6B6B]">Title</TableHead>
                <TableHead className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6B6B6B]">Niche</TableHead>
                <TableHead className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6B6B6B]">Status</TableHead>
                <TableHead className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6B6B6B]">Date</TableHead>
                <TableHead className="text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6B6B6B]">Cost</TableHead>
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
                  <TableCell className="text-right text-sm text-[#6B6B6B]">
                    {meeting.cost_usd != null ? `$${meeting.cost_usd.toFixed(4)}` : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
