import { NextResponse } from "next/server";
import { OPCONORE_VERSION, OPCONORE_CODENAME } from "@/lib/opencore";

export async function GET() {
  return NextResponse.json({
    name: "OpenCore",
    version: OPCONORE_VERSION,
    codename: OPCONORE_CODENAME,
    status: "online",
    telemetry: "none",
    endpoints: [
      "/v1/chat/completions",
      "/v1/models",
      "/api/gateway/providers",
      "/api/gateway/keys",
      "/api/chat",
      "/api/voice",
      "/api/setup",
      "/api/integrations",
    ],
  });
}
