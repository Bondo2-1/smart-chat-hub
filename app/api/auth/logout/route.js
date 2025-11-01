import { NextResponse } from "next/server";
import { verifyToken } from "@/middleware/auth";

export async function POST(request) {
  try {
    const decoded = verifyToken(request);

    if (!decoded) {
      return NextResponse.json({ success: true, message: "Already logged out" });
    }

    return NextResponse.json({ success: true, message: "Logout successful" });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405, headers: { Allow: "POST" } }
  );
}
