import pool from "@/db/index.js";
import { verifyToken } from "@/middleware/auth.js";

export async function GET(request) {
  const currentUser = verifyToken(request);
  if (!currentUser) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await pool.query(
      "SELECT id, name, email FROM users WHERE id <> $1 ORDER BY name ASC",
      [currentUser.id]
    );

    return Response.json({ users: result.rows });
  } catch (error) {
    console.error("Fetch users error:", error);
    return Response.json(
      { error: "Failed to load users. Please try again later." },
      { status: 500 }
    );
  }
}
