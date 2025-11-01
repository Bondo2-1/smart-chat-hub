'use client';
import { useEffect, useMemo, useRef } from "react";

function formatTimestamp(value) {
  if (!value) return "";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function ChatWindow({
  activeUser,
  messages,
  currentUserId,
  isLoading,
  chatError,
  insight,
  insightError,
  isInsightLoading,
  onOpenRoster,
}) {
  const endOfMessagesRef = useRef(null);
  const messagesCount = Array.isArray(messages) ? messages.length : 0;

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const heading = useMemo(() => {
    if (!activeUser) {
      return "Pick a conversation";
    }
    return activeUser.name || activeUser.email || "Conversation";
  }, [activeUser]);

  const summaryInfo = useMemo(() => {
    if (!activeUser) return null;

    if (isInsightLoading) {
      return { text: "Generating AI insight…", tone: "muted" };
    }

    if (insightError) {
      return { text: insightError, tone: "error" };
    }

    if (!insight || !insight.summary) {
      if (messagesCount === 0) {
        return {
          text: "No messages yet. Start the conversation.",
          tone: "muted",
        };
      }
      return { text: "Summary unavailable.", tone: "muted" };
    }

    const sentimentLabel = insight.sentiment
      ? insight.sentiment.charAt(0).toUpperCase() +
        insight.sentiment.slice(1).toLowerCase()
      : "";

    const display =
      sentimentLabel && sentimentLabel.toLowerCase() !== "neutral"
        ? `${insight.summary} • ${sentimentLabel}`
        : insight.summary;

    return { text: display, tone: "highlight" };
  }, [activeUser, insight, insightError, isInsightLoading, messagesCount]);

  const rosterButtonLabel = activeUser ? "Switch teammate" : "Browse teammates";
  const canOpenRoster = typeof onOpenRoster === "function";

  return (
    <div className="flex h-full flex-1 flex-col">
      <header className="border-b border-white/60 bg-[rgba(242,246,255,0.9)] px-6 py-5">
        <div className="flex items-start justify-between gap-3 sm:items-center">
          <div>
            <h2 className="text-xl font-semibold text-[var(--brand-primary)]">
              {heading}
            </h2>
            {!activeUser ? (
              <p className="mt-1 text-sm text-[rgba(17,28,68,0.6)]">
                Choose someone from the list to start chatting.
              </p>
            ) : (
              <>
                <p
                  className={`mt-2 text-sm ${
                    summaryInfo?.tone === "error"
                      ? "text-[rgba(200,40,40,0.8)]"
                      : summaryInfo?.tone === "highlight"
                      ? "text-[var(--brand-secondary)]"
                      : "text-[rgba(17,28,68,0.68)]"
                  }`}
                >
                  {summaryInfo?.text}
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-[rgba(17,28,68,0.45)]">
                  Messages are end-to-end encrypted.
                </p>
              </>
            )}
          </div>
          {canOpenRoster ? (
            <button
              type="button"
              onClick={onOpenRoster}
              className="inline-flex items-center gap-2 rounded-full border border-[rgba(17,28,68,0.18)] bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-secondary)] shadow-[0_14px_32px_-28px_rgba(17,28,68,0.6)] transition hover:border-[var(--brand-secondary)] hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)] lg:hidden"
            >
              {rosterButtonLabel}
            </button>
          ) : null}
        </div>
      </header>

      <div className="relative flex-1 overflow-y-auto bg-gradient-to-b from-[rgba(241,245,255,0.8)] via-white to-[#f5f7ff] px-4 py-8">
        {!activeUser ? (
          <div className="flex h-full items-center justify-center text-center">
            <div className="max-w-sm space-y-2">
              <p className="text-lg font-medium text-[var(--brand-primary)]">
                Start a new conversation
              </p>
              <p className="text-sm text-[rgba(17,28,68,0.6)]">
                Select a teammate from the sidebar to view your chat history and
                send messages.
              </p>
              {canOpenRoster ? (
                <button
                  type="button"
                  onClick={onOpenRoster}
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-[rgba(17,28,68,0.15)] bg-white/95 px-5 py-2 text-sm font-medium text-[var(--brand-primary)] shadow-[0_18px_40px_-34px_rgba(17,28,68,0.6)] transition hover:border-[var(--brand-primary)] hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)]"
                >
                  Browse teammates
                </button>
              ) : null}
            </div>
          </div>
        ) : chatError ? (
          <div className="flex h-full items-center justify-center">
            <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-[rgba(200,40,40,0.8)]">
              {chatError}
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-[rgba(17,28,68,0.55)]">
              Loading conversation…
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <div className="max-w-sm space-y-2">
              <p className="text-lg font-medium text-[var(--brand-primary)]">
                Say hello to {activeUser.name || activeUser.email}
              </p>
              <p className="text-sm text-[rgba(17,28,68,0.6)]">
                This is the beginning of your conversation. Messages you send
                will appear here.
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex h-full max-w-3xl flex-col justify-end space-y-3">
            {messages.map((message) => {
              const isMe = message.sender_id === currentUserId;
              const timestamp = formatTimestamp(message.timestamp);

              return (
                <div
                  key={message.id || `${message.sender_id}-${message.timestamp}`}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-md rounded-2xl px-5 py-3 text-sm shadow-[0_18px_36px_-26px_rgba(17,28,68,0.5)] ${
                      isMe
                        ? "bg-[var(--brand-secondary)] text-white"
                        : "border border-[rgba(17,28,68,0.08)] bg-white/95 text-[var(--brand-primary)]"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">
                      {message.text}
                    </p>
                    {timestamp && (
                      <span
                        className={`mt-1 block text-xs ${
                          isMe
                            ? "text-[rgba(226,234,255,0.8)]"
                            : "text-[rgba(17,28,68,0.45)]"
                        }`}
                      >
                        {timestamp}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            <span ref={endOfMessagesRef} />
          </div>
        )}
      </div>
    </div>
  );
}
