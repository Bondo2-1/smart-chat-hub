import pool from "@/db/index.js";
import { verifyToken } from "@/middleware/auth.js";

export async function POST(req) {
  const user = verifyToken(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { receiver_id, text } = await req.json();

    if (!receiver_id || !text)
      return Response.json({ error: "Missing fields" }, { status: 400 });

    const result = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, text)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [user.id, receiver_id, text]
    );

    // In a moment we'll broadcast this message via WebSocket
    return Response.json({ message: result.rows[0] });
  } catch (err) {
    console.error("Send message error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
