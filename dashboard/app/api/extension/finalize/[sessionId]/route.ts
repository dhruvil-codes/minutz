import { NextResponse } from "next/server";

const BACKEND_BASE = "http://localhost:8001";

type FinalizeBody = {
  title?: string;
  niche?: string;
};

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
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Finalize failed" },
      { status: 500 }
    );
  }
}
