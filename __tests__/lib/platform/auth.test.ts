jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((body: unknown, init?: { status?: number }) => ({
      body,
      status: init?.status || 200,
    })),
  },
}))

import { getAuthPolicy, isApiKeyEnforcementEnabled } from "@/lib/platform/auth"

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
})
