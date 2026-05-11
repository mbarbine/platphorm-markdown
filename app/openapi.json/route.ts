import { NextResponse } from "next/server"
import { openApiSpec } from "@/lib/api/openapi"

export async function GET() {
  return NextResponse.json(openApiSpec, {
    headers: { "Cache-Control": "public, max-age=3600" },
  })
}
