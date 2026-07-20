jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((body: unknown, init?: { status?: number }) => ({
      body,
      status: init?.status || 200,
    })),
  },
}))

import { getAuthPolicy, isApiKeyEnforcementEnabled } from "@/lib/platform/auth"
import { siteConfig } from "@/lib/platphorm/config"

describe("PlatPhorm auth policy", () => {
  const original = process.env.PLATPHORM_REQUIRE_API_KEY

  afterEach(() => {
    process.env.PLATPHORM_REQUIRE_API_KEY = original
  })

  it("keeps public-safe enforcement disabled by default", () => {
    delete process.env.PLATPHORM_REQUIRE_API_KEY
    expect(isApiKeyEnforcementEnabled()).toBe(false)
    expect(getAuthPolicy().publicSafeByDefault).toBe(true)
  })

  it("documents only PLATPHORM_API_KEY headers", () => {
    const policy = getAuthPolicy()
    expect(policy.acceptedHeaders.join(" ")).toContain("PLATPHORM_API_KEY")
    expect(policy.acceptedHeaders.join(" ")).not.toContain("MARKDOWN_API_KEY")
  })

  it("publishes the canonical platform trust boundary", () => {
    expect(siteConfig.trustPolicyLine).toContain(
      "Mutating, administrative, ingestion, replay, fork, remediation, deployment, sync, test-triggering, reporting, and write actions require PLATPHORM_API_KEY.",
    )
  })
})
