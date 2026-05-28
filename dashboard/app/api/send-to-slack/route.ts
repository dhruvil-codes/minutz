import { NextResponse } from "next/server";

const BACKEND_BASE = "http://localhost:8001";

type SlackPayload = {
  meeting_id: string;
  channel_id?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SlackPayload;

    const response = await fetch(`${BACKEND_BASE}/send-to-slack`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      let detail = `Slack send failed (${response.status})`;
      try {
        const errorJson = await response.json();
        if (typeof errorJson?.detail === "string" && errorJson.detail) {
          detail = errorJson.detail;
        } else if (typeof errorJson?.error === "string" && errorJson.error) {
          detail = errorJson.error;
        }
      } catch {
        const raw = await response.text();
        if (raw) detail = raw;
      }
      return NextResponse.json(
        { error: detail },
        { status: response.status }
      );
    }

    const data = await response.json().catch(() => ({ ok: true }));
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Slack send failed" },
      { status: 500 }
    );
  }
}
