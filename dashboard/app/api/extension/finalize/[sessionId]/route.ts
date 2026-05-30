import { NextResponse } from "next/server";

const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8001";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

type FinalizeBody = {
  title?: string;
  niche?: string;
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await context.params;
    const body = (await request.json()) as FinalizeBody;

    const response = await fetch(`${BACKEND_BASE}/finalize/${sessionId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: body?.title ?? "Meeting",
        niche: body?.niche ?? "general",
      })
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Finalize failed (${response.status})` },
        { status: response.status, headers: CORS }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { headers: CORS });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Finalize failed" },
      { status: 500, headers: CORS }
    );
  }
}
