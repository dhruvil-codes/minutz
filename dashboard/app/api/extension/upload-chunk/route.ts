import { NextResponse } from "next/server";

const BACKEND_BASE = "http://localhost:8001";

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
        { status: response.status }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
