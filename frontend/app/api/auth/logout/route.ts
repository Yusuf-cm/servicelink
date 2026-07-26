import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get("refresh_token")?.value;
  const accessToken = request.headers.get("authorization");

  if (refreshToken) {
    await fetch(`${API_URL}/auth/logout/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: accessToken } : {}),
      },
      body: JSON.stringify({ refresh: refreshToken }),
    }).catch(() => {
      // best-effort — clear the cookie locally regardless
    });
  }

  const response = NextResponse.json({ detail: "Logged out." });
  response.cookies.delete("refresh_token");
  return response;
}
