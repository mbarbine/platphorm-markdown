import { NextResponse } from "next/server"

export const PLATPHORM_API_KEY_HEADER = "x-platphorm-api-key"

export type AuthBoundary = "public" | "public-safe" | "future-protected" | "protected"

export interface AuthPolicy {
  enforcementEnabled: boolean
  acceptedHeaders: string[]
  publicSafeByDefault: boolean
  futureProtectedActions: string[]
}

export function isApiKeyEnforcementEnabled(): boolean {
  return process.env.PLATPHORM_REQUIRE_API_KEY === "true"
}

export function getAuthPolicy(): AuthPolicy {
  return {
    enforcementEnabled: isApiKeyEnforcementEnabled(),
    acceptedHeaders: ["Authorization: Bearer $PLATPHORM_API_KEY", "X-PlatPhorm-API-Key: $PLATPHORM_API_KEY"],
    publicSafeByDefault: true,
    futureProtectedActions: [
      "server-side PDF and PNG exports",
      "AI enhancement calls",
      "webhook mutation",
      "document persistence",
      "sync jobs",
      "registry mutation",
      "trusted-domain mutation",
      "administrative reporting",
    ],
  }
}

function extractPresentedKey(request: Request): string | null {
  const bearer = request.headers.get("authorization")
  if (bearer?.startsWith("Bearer ")) return bearer.slice("Bearer ".length).trim()
  return request.headers.get(PLATPHORM_API_KEY_HEADER)
}

export function hasValidPlatphormApiKey(request: Request): boolean {
  const configuredKey = process.env.PLATPHORM_API_KEY
  if (!configuredKey) return false
  const presentedKey = extractPresentedKey(request)
  return presentedKey === configuredKey
}

export function requirePlatphormApiKey(request: Request, action: string): NextResponse | null {
  if (!isApiKeyEnforcementEnabled()) return null
  if (hasValidPlatphormApiKey(request)) return null

  return NextResponse.json(
    {
      ok: false,
      success: false,
      error: {
        code: "AUTH_REQUIRED",
        message: `${action} requires PLATPHORM_API_KEY when enforcement is enabled.`,
        details: {
          acceptedHeaders: ["Authorization", "X-PlatPhorm-API-Key"],
        },
      },
    },
    { status: 401 },
  )
}
