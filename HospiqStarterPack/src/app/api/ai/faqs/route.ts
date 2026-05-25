import { NextResponse } from "next/server";
import { apiOk } from "@/server/http/api-response";

export async function GET() {
  return NextResponse.json(apiOk({ ready: true, resource: "ai_faqs" }));
}
