import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Hit throughout the day by Vercel Cron Jobs (see vercel.json) to generate
// real application-database activity for the Supabase free-tier project.
// The request is read-only and never exposes the result.
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (
    !cronSecret ||
    request.headers.get("authorization") !== `Bearer ${cronSecret}`
  ) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    await prisma.user.findFirst({ select: { id: true } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(
      "Keepalive database request failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
