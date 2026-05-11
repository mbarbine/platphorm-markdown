import { apiSuccess } from "@/lib/api/utils"
import { getModelStatus } from "@/lib/model/markdown-model"

export async function GET() {
  return apiSuccess(getModelStatus())
}
