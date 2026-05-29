import { NextResponse } from "next/server";

const BACKEND_BASE = "http://localhost:8001";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

type SummarizeBody = {
  meeting_id: string;
  transcript: string;
  niche: string;
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SummarizeBody;

    const response = await fetch(`${BACKEND_BASE}/summarize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Summarize failed (${response.status})` },
        { status: response.status, headers: CORS }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { headers: CORS });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Summarize failed" },
      { status: 500, headers: CORS }
    );
  }
}
