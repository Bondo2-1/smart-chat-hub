import pool from '@/db/index.js';

export async function GET() {
  try {
    const result = await pool.query('SELECT NOW() AS time');
    return Response.json({ connected: true, serverTime: result.rows[0].time });
  } catch (err) {
    console.error('DB error:', err);
    return Response.json({ connected: false, error: err.message }, { status: 500 });
  }
}
