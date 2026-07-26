import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get("refresh_token")?.value;

  if (!refreshToken) {
    return NextResponse.json({ detail: "No session." }, { status: 401 });
  }

  const djangoRes = await fetch(`${API_URL}/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: refreshToken }),
  });

  const data = await djangoRes.json();

  if (!djangoRes.ok) {
    const response = NextResponse.json(data, { status: djangoRes.status });
    response.cookies.delete("refresh_token");
    return response;
  }

  const response = NextResponse.json({ access: data.access });

  // ROTATE_REFRESH_TOKENS is on in the backend, so a new refresh token
  // comes back with every call — store the rotated one.
  if (data.refresh) {
    response.cookies.set("refresh_token", data.refresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  return response;
}
