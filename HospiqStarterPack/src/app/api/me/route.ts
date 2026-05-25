import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/server/auth/get-current-account";
import { AppError } from "@/server/http/api-error";
import { apiError, apiOk } from "@/server/http/api-response";

export async function GET() {
  try {
    const account = await getCurrentAccount();
    return NextResponse.json(apiOk(account));
  } catch (error) {
    const status = error instanceof AppError ? error.status : 401;
    const code = error instanceof AppError ? error.code : "UNAUTHENTICATED";
    return NextResponse.json(
      apiError(error instanceof Error ? error.message : "Unknown error", code),
      { status },
    );
  }
}
