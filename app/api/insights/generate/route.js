import pool from "@/db/index.js";
import { verifyToken } from "@/middleware/auth.js";
import { NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_SUMMARY_MODEL || "gpt-4o-mini";

function buildConversationId(userId, otherUserId) {
  return [String(userId), String(otherUserId)]
    .sort((a, b) => (a > b ? 1 : a < b ? -1 : 0))
    .join(":");
}

function coerceSentiment(value) {
  if (!value) return "neutral";
  const normalized = value.toString().trim().toLowerCase();
  if (["positive", "negative", "neutral", "mixed"].includes(normalized)) {
    return normalized;
  }
  return "neutral";
}

function trimSummaryToFiveWords(summary) {
  if (!summary) return "";
  const words = summary
    .replace(/[^\w\s'-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "";
  const trimmed = words.slice(0, Math.min(5, words.length));
  return trimmed.join(" ");
}

export async function POST(request) {
  const user = verifyToken(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!OPENAI_API_KEY) {
    console.error("Missing OPENAI_API_KEY environment variable.");
    return NextResponse.json(
      { error: "Insights service is not configured." },
      { status: 500 }
    );
  }

  try {
    const { withUserId } = await request.json();

    if (!withUserId) {
      return NextResponse.json(
        { error: "Missing chat partner ID." },
        { status: 400 }
      );
    }

    const conversationId = buildConversationId(user.id, withUserId);

    const existingInsightResult = await pool.query(
      `SELECT id, conversation_id, summary, sentiment
         FROM insights
        WHERE conversation_id = $1
        ORDER BY id DESC
        LIMIT 1`,
      [conversationId]
    );

    if (existingInsightResult.rows.length > 0) {
      const cachedInsight = existingInsightResult.rows[0];
      return NextResponse.json(
        {
          ok: true,
          conversationId,
          summary: cachedInsight.summary || "",
          sentiment: cachedInsight.sentiment || "neutral",
          insight: cachedInsight,
          cached: true,
        },
        { status: 200 }
      );
    }

    const { rows: messages } = await pool.query(
      `SELECT id, sender_id, receiver_id, text, timestamp
       FROM messages
       WHERE (sender_id = $1 AND receiver_id = $2)
          OR (sender_id = $2 AND receiver_id = $1)
       ORDER BY timestamp ASC`,
      [user.id, withUserId]
    );

    if (messages.length === 0) {
      const emptyInsight = { summary: "", sentiment: "neutral" };
      return NextResponse.json(
        {
          ok: true,
          conversationId,
          ...emptyInsight,
        },
        { status: 200 }
      );
    }

    const conversationLines = messages
      .map((message) => {
        const speaker =
          message.sender_id === user.id ? "Current user" : "Chat partner";
        return `${speaker}: ${message.text}`;
      })
      .join("\n");

    const aiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          temperature: 0.4,
          messages: [
            {
              role: "system",
              content:
                "You are an assistant that summarises chat conversations. Reply strictly in JSON with the shape {\"summary\":\"four or five words summarising the first message's theme\",\"sentiment\":\"Positive|Negative|Neutral\"}.",
            },
            {
              role: "user",
              content: `Conversation transcript:\n${conversationLines}`,
            },
          ],
        }),
      }
    );

    if (!aiResponse.ok) {
      const errorPayload = await aiResponse.json().catch(() => ({}));
      console.error("OpenAI API error:", errorPayload);
      return NextResponse.json(
        { error: "Unable to generate insight." },
        { status: 502 }
      );
    }

    const completion = await aiResponse.json();
    const content =
      completion?.choices?.[0]?.message?.content?.trim() || "{}";

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      console.warn("Failed to parse AI response, content:", content);
      parsed = {};
    }

    const summary = trimSummaryToFiveWords(parsed.summary || "");
    const sentiment = coerceSentiment(parsed.sentiment);

    let insertedRow = null;
    try {
      const result = await pool.query(
        `INSERT INTO insights (conversation_id, summary, sentiment)
         VALUES ($1, $2, $3)
         RETURNING id, conversation_id, summary, sentiment`,
        [conversationId, summary, sentiment]
      );
      insertedRow = result.rows[0] || null;
    } catch (dbError) {
      console.error("Failed to store insight:", dbError);
    }

    return NextResponse.json(
      {
        ok: true,
        conversationId,
        summary,
        sentiment,
        insight: insertedRow,
        cached: false,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Insight generation error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

export function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405, headers: { Allow: "POST" } }
  );
}

