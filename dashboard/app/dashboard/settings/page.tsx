"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [channelId, setChannelId] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
    });
    setChannelId(localStorage.getItem("slack_channel_id") ?? "");
  }, []);

  function handleSaveSlack() {
    localStorage.setItem("slack_channel_id", channelId);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white">Settings</h1>
        <p className="mt-1 text-sm text-[#6B6B6B]">Manage your integrations and account</p>
      </div>

      {/* Integrations */}
      <Card className="border-[#2A2A2A] bg-[#1A1A1A]">
        <CardHeader>
          <CardTitle className="text-base text-white">Integrations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="slack-channel" className="text-sm text-[#A3A3A3]">
              Slack Channel ID
            </Label>
            <p className="text-xs text-[#6B6B6B]">
              Right-click a channel in Slack and copy the link — the ID is the last segment (starts with C).
            </p>
            <div className="flex gap-2">
              <Input
                id="slack-channel"
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                placeholder="C0XXXXXXXXX"
                className="border-[#2A2A2A] bg-[#0D0D0D] text-white placeholder:text-[#6B6B6B] focus-visible:ring-[#FF6A00]"
              />
              <Button
                onClick={handleSaveSlack}
                className="shrink-0 bg-[#FF6A00] text-white hover:bg-[#E55E00]"
              >
                {saved ? "Saved" : "Save"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account */}
      <Card className="border-[#2A2A2A] bg-[#1A1A1A]">
        <CardHeader>
          <CardTitle className="text-base text-white">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6B6B6B]">Signed in as</p>
            <p className="mt-1 text-sm text-white">{email || "—"}</p>
          </div>
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="border-[#2A2A2A] text-[#A3A3A3] hover:border-red-500 hover:text-red-400"
          >
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
