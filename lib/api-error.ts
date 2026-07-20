import { NextResponse } from "next/server";

/** Turns any thrown error (Stripe not configured, Stripe API errors, etc.) into a clean JSON response. */
export function handleApiError(err: unknown) {
  const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
  return NextResponse.json({ error: message }, { status: 500 });
}
