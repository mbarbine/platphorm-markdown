import { apiError } from "@/lib/api/utils"

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params
  return apiError("SHARE_NOT_PERSISTED", "Server-side share IDs are not implemented in Phase 1. Use bounded /editor?content= share URLs instead.", 404, {
    id: params.id,
    storageMode: "url_only",
  })
}
