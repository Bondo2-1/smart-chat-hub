import pool from "@/db/index.js";
import bcrypt from "bcrypt";

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return Response.json({ error: "Missing fields" }, { status: 400 });
    }

    // Check if email exists
    const existing = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (existing.rows.length > 0) {
      return Response.json(
        { error: "Email already taken" },
        { status: 409 }
      );
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Insert user
    const result = await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email",
      [name, email, hashed]
    );

    return Response.json({ user: result.rows[0], message: "User registered" });
  } catch (err) {
    console.error("Register error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
