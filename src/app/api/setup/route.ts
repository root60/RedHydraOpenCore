import { NextResponse } from "next/server";
import { SETUP_STEPS, OPCONORE_VERSION, OPCONORE_CODENAME } from "@/lib/opencore";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    version: OPCONORE_VERSION,
    codename: OPCONORE_CODENAME,
    oneLiner: "curl -fsSL https://opencore.sh | bash",
    steps: SETUP_STEPS,
  });
}
