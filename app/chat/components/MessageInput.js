'use client';

export default function MessageInput({
  value,
  onChange,
  onSubmit,
  disabled,
  isSending,
}) {
  function handleSubmit(event) {
    event.preventDefault();
    if (!disabled && value.trim()) {
      onSubmit();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 border-t border-white/60 bg-[rgba(248,250,255,0.95)] px-4 py-3 sm:flex-row sm:items-center sm:px-5 sm:py-4"
    >
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Write a message…"
        className="w-full flex-1 rounded-full border border-[rgba(17,28,68,0.08)] bg-white/90 px-4 py-3 text-sm text-[var(--brand-primary)] shadow-inner shadow-[rgba(17,28,68,0.04)] outline-none transition focus:border-[var(--brand-secondary)] focus:ring-2 focus:ring-[rgba(31,61,122,0.2)] sm:px-5"
        disabled={disabled}
      />
      <button
        type="submit"
        className="w-full rounded-full bg-gradient-to-r from-[var(--brand-secondary)] to-[var(--brand-primary)] px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.22em] text-white shadow-[0_16px_40px_-24px_rgba(17,28,68,0.8)] transition hover:scale-[1.01] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-6"
        disabled={disabled || !value.trim()}
      >
        {isSending ? "Sending…" : "Send"}
      </button>
    </form>
  );
}
