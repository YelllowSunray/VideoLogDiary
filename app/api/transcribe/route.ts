import { NextRequest, NextResponse } from "next/server";

const ASSEMBLYAI_API = "https://api.assemblyai.com/v2";

async function pollTranscript(transcriptId: string, apiKey: string): Promise<string> {
  const maxAttempts = 60;
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(`${ASSEMBLYAI_API}/transcript/${transcriptId}`, {
      headers: { authorization: apiKey },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? `AssemblyAI status ${res.status}`);
    }
    const data = (await res.json()) as {
      status: string;
      text?: string;
      error?: string;
    };
    if (data.status === "completed") {
      return data.text ?? "";
    }
    if (data.status === "error") {
      throw new Error(data.error ?? "Transcription failed");
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error("Transcription timed out");
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ASSEMBLYAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ASSEMBLYAI_API_KEY is not set. Add it to .env.local for transcription." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { videoUrl, entryId } = body as { videoUrl?: string; entryId?: string };
    if (!videoUrl || typeof videoUrl !== "string") {
      return NextResponse.json({ error: "videoUrl is required" }, { status: 400 });
    }

    const submitRes = await fetch(`${ASSEMBLYAI_API}/transcript`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: apiKey,
      },
      body: JSON.stringify({
        audio_url: videoUrl,
        speech_models: ["universal-2"],
      }),
    });

    if (!submitRes.ok) {
      const err = await submitRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.error ?? "Failed to submit transcription" },
        { status: submitRes.status }
      );
    }

    const { id: transcriptId } = (await submitRes.json()) as { id: string };
    const text = await pollTranscript(transcriptId, apiKey);

    return NextResponse.json({ transcript: text, entryId });
  } catch (err) {
    console.error("Transcribe error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Transcription failed" },
      { status: 500 }
    );
  }
}
