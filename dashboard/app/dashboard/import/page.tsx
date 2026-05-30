"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const NICHE_OPTIONS = ["general", "sales", "pm", "financial"] as const;
type Niche = (typeof NICHE_OPTIONS)[number];

const NICHE_LABELS: Record<Niche, string> = {
  general: "General",
  sales: "Sales",
  pm: "PM",
  financial: "Financial",
};

type Stage = "idle" | "uploading" | "transcribing" | "analyzing" | "done" | "error";

export default function ImportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [niche, setNiche] = useState<Niche>("general");
  const [stage, setStage] = useState<Stage>("idle");
  const [dragOver, setDragOver] = useState(false);

  function handleFileSelect(selected: File | null) {
    if (!selected) return;
    setFile(selected);
    if (!title) setTitle(selected.name.replace(/\.[^.]+$/, ""));
  }

  async function handleProcess() {
    if (!file) { toast.error("Please select a file first"); return; }
    if (!title.trim()) { toast.error("Please enter a meeting title"); return; }

    try {
      const sessionId = crypto.randomUUID();

      // Step 1 — upload
      setStage("uploading");
      const formData = new FormData();
      formData.append("audio", file);
      formData.append("session_id", sessionId);
      formData.append("chunk_index", "0");
      formData.append("total_chunks", "1");

      const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8001";
      const uploadRes = await fetch(`${BACKEND}/upload-chunk`, {
        method: "POST",
        body: formData,
      });
      if (!uploadRes.ok) throw new Error("Upload failed");

      // Step 2 — finalize
      setStage("transcribing");
      const finalizeRes = await fetch(`${BACKEND}/finalize/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), niche }),
      });
      if (!finalizeRes.ok) {
        const finalizeError = await finalizeRes.text();
        throw new Error(`Finalize failed (${finalizeRes.status}): ${finalizeError || "No error details returned"}`);
      }
      const finalizeData = await finalizeRes.json();

      // Step 3 — summarize
      setStage("analyzing");
      const summarizeRes = await fetch(`${BACKEND}/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meeting_id: finalizeData.meeting_id,
          transcript: finalizeData.transcript || "",
          niche,
        }),
      });
      if (!summarizeRes.ok) {
        const summarizeError = await summarizeRes.text();
        throw new Error(`Summarize failed (${summarizeRes.status}): ${summarizeError || "No error details returned"}`);
      }
      const summarizeData = await summarizeRes.json();

      setStage("done");
      const meetingId = summarizeData.meeting_id || finalizeData.meeting_id;
      if (meetingId) {
        router.push(`/dashboard/meeting/${meetingId}`);
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setStage("error");
      toast.error(err instanceof Error ? err.message : "Processing failed");
    }
  }

  const stageLabel: Record<Stage, string> = {
    idle: "Process Recording",
    uploading: "Uploading...",
    transcribing: "Transcribing...",
    analyzing: "Analyzing with AI...",
    done: "Done!",
    error: "Try again",
  };

  const isProcessing = stage === "uploading" || stage === "transcribing" || stage === "analyzing";

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 text-white">
      <div>
        <h1 className="text-2xl font-bold text-white">Import Recording</h1>
        <p className="mt-1 text-sm text-[#A3A3A3]">Upload an audio or video file to generate AI summaries</p>
      </div>

      {/* Drop zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFileSelect(e.dataTransfer.files[0] ?? null);
        }}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-colors ${
          dragOver
            ? "border-[#FF6A00]/70 bg-[#FF6A00]/5"
            : file
            ? "border-[#FF6A00]/40 bg-[#FF6A00]/5"
            : "border-[#2A2A2A] bg-[#1A1A1A] hover:border-[#FF6A00]/50"
        }`}
      >
        <Upload className="mx-auto size-12 text-[#A3A3A3]" />
        {file ? (
          <>
            <p className="mt-3 text-sm font-medium text-white">{file.name}</p>
            <p className="mt-1 text-xs text-[#6B6B6B]">{(file.size / 1024 / 1024).toFixed(1)} MB · Click to change</p>
          </>
        ) : (
          <>
            <p className="mt-3 text-sm text-[#A3A3A3]">Drag and drop your recording here</p>
            <p className="mt-1 text-xs text-[#6B6B6B]">or click to browse</p>
            <p className="mt-2 text-xs text-[#6B6B6B]">MP3, MP4, WAV, M4A, WebM · Max 500MB</p>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".mp3,.mp4,.wav,.m4a,.webm"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
        />
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#A3A3A3]">Meeting title <span className="text-[#EF4444]">*</span></label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Product Weekly Sync"
            className="rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] px-3 py-2 text-sm text-white placeholder-[#6B6B6B] outline-none focus:border-[#FF6A00]/50"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#A3A3A3]">Niche</label>
          <select
            value={niche}
            onChange={(e) => setNiche(e.target.value as Niche)}
            className="rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] px-3 py-2 text-sm text-white outline-none focus:border-[#FF6A00]/50"
          >
            {NICHE_OPTIONS.map((n) => (
              <option key={n} value={n}>{NICHE_LABELS[n]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Progress indicator */}
      {isProcessing && (
        <div className="flex items-center gap-3 rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] px-4 py-3">
          <div className="size-4 animate-spin rounded-full border-2 border-[#FF6A00] border-t-transparent" />
          <p className="text-sm text-[#A3A3A3]">{stageLabel[stage]}</p>
        </div>
      )}

      <Button
        onClick={handleProcess}
        disabled={isProcessing || !file}
        className="w-full bg-[#FF6A00] text-white hover:bg-[#E55E00] disabled:opacity-50"
      >
        {stageLabel[stage]}
      </Button>
    </div>
  );
}
