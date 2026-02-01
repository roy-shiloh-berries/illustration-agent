import { NextRequest, NextResponse } from "next/server";

/**
 * Minimal auth: read user id from header (e.g. X-User-Id) for development.
 * Replace with real auth (session, JWT) in production.
 */
export function getUserId(request: NextRequest): string | null {
  return request.headers.get("x-user-id") ?? null;
}

export function requireAuth(
  request: NextRequest,
  handler: (userId: string, request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const userId = getUserId(request);
  if (!userId) {
    return Promise.resolve(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    );
  }
  return handler(userId, request);
}
