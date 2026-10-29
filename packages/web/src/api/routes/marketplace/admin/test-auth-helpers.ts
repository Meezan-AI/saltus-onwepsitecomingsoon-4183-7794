// Test-only helper — builds the fake "logged in as" Headers that the mocked
// `auth.api.getSession` (see each *.test.ts's `vi.mock("../../../auth", ...)`)
// reads to decide who the request is from, so `adminOnly`/`requirePermission`
// run their real logic against a real (test) session user, not a mock bypass.
export function sessionHeaders(user: { id: string; role: string }) {
  return new Headers({ "x-test-session": JSON.stringify({ user }) });
}
