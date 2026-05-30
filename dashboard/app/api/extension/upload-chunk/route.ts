import { NextResponse } from "next/server";

const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8001";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const response = await fetch(`${BACKEND_BASE}/upload-chunk`, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Upload failed (${response.status})` },
        { status: response.status, headers: CORS }
      );
    }

    return NextResponse.json({ ok: true }, { headers: CORS });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500, headers: CORS }
    );
  }
}
