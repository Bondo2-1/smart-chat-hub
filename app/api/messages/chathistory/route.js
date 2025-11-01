import pool from "@/db/index.js";
import { verifyToken } from "@/middleware/auth.js";

export async function POST(req) {
  const user = verifyToken(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { withUserId } = await req.json();
    if (!withUserId)
      return Response.json({ error: "Missing chat partner ID" }, { status: 400 });

    const result = await pool.query(
      `SELECT * FROM messages
       WHERE (sender_id = $1 AND receiver_id = $2)
          OR (sender_id = $2 AND receiver_id = $1)
       ORDER BY timestamp ASC`,
      [user.id, withUserId]
    );

    return Response.json({ messages: result.rows });
  } catch (err) {
    console.error("Fetch messages error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
