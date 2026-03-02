import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    assemblyaiConfigured: !!process.env.ASSEMBLYAI_API_KEY,
  });
}
