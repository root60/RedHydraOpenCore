import { NextResponse } from "next/server";
import { INTEGRATIONS } from "@/lib/opencore";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    count: INTEGRATIONS.length,
    integrations: INTEGRATIONS.map((it) => ({
      id: it.id,
      name: it.name,
      handle: it.handle,
      status: it.status,
      blurb: it.blurb,
      quirk: it.quirk,
    })),
  });
}
