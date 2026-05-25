import { NextRequest, NextResponse } from "next/server";
import { assertDatabaseUrl } from "@/lib/config/env";
import { requireApiUserId } from "@/lib/auth/api-auth";
import { runAssistant } from "@/lib/assistant/engine";
import {
  DEFAULT_SUGGESTED_QUESTIONS,
  ALL_SUGGESTED_QUESTIONS,
} from "@/lib/assistant/suggested-questions";
import { handleApiError, jsonError } from "@/lib/utils/api-utils";
import { validateAssistantBody } from "@/lib/validation/assistant-validation";

export const runtime = "nodejs";

export async function GET() {
  try {
    assertDatabaseUrl();
    const auth = await requireApiUserId();
    if (auth.unauthorized) return auth.unauthorized;

    return NextResponse.json({
      suggestedQuestions: [...DEFAULT_SUGGESTED_QUESTIONS],
      allSuggestedQuestions: [...ALL_SUGGESTED_QUESTIONS],
      provider: process.env.ASSISTANT_PROVIDER ?? "rule-based",
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertDatabaseUrl();
    const auth = await requireApiUserId();
    if (auth.unauthorized) return auth.unauthorized;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonError("Invalid JSON body", 400);
    }

    const validation = validateAssistantBody(body);
    if (!validation.success) {
      return jsonError(validation.error, 400);
    }

    const reply = await runAssistant(auth.userId, validation.data.message);
    return NextResponse.json(reply);
  } catch (error) {
    return handleApiError(error);
  }
}
