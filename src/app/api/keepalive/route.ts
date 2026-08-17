import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Hit once a day by a Vercel Cron Job (see vercel.json) purely to keep the
// Supabase free-tier project from auto-pausing after a week of no database
// activity. No auth, no side effects — just a trivial read.
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
