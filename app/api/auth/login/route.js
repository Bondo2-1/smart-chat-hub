import pool from "@/db/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password)
      return Response.json({ error: "Missing fields" }, { status: 400 });

    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (user.rows.length === 0)
      return Response.json({ error: "Invalid email or password" }, { status: 401 });

    const match = await bcrypt.compare(password, user.rows[0].password);
    if (!match)
      return Response.json({ error: "Invalid email or password" }, { status: 401 });

    const token = jwt.sign(
      { id: user.rows[0].id, email: user.rows[0].email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return Response.json({ token, user: { id: user.rows[0].id, email: user.rows[0].email } });
  } catch (err) {
    console.error("Login error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
