import { apiSuccess } from "@/lib/api/utils"
import { buildHealth } from "@/lib/platform/health"

export async function GET() {
  return apiSuccess(buildHealth())
}
