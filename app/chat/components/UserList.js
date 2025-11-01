'use client';

export default function UserList({
  users,
  activeUserId,
  onSelectUser,
  isLoading,
  errorMessage,
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/60 px-5 py-5">
        <h2 className="text-lg font-semibold text-[var(--brand-primary)]">
          Direct messages
        </h2>
        <p className="mt-1 text-xs text-[rgba(17,28,68,0.6)]">
          Choose a teammate to open a conversation.
        </p>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-5">
        {isLoading ? (
          <p className="px-2 text-sm text-[rgba(17,28,68,0.55)]">
            Loading teammates…
          </p>
        ) : errorMessage ? (
          <p className="px-2 text-sm text-[rgba(200,40,40,0.75)]">
            {errorMessage}
          </p>
        ) : users.length === 0 ? (
          <p className="px-2 text-sm text-[rgba(17,28,68,0.55)]">
            No teammates yet. Invite someone to start chatting.
          </p>
        ) : (
          users.map((user) => {
            const title = user.name || user.email || "Unknown user";
            const subtitle =
              user.name && user.email && user.name !== user.email
                ? user.email
                : "";
            const isActive = activeUserId === user.id;

            return (
              <button
                key={user.id}
                type="button"
                onClick={() => onSelectUser(user)}
                className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)] ${
                  isActive
                    ? "border border-[rgba(17,28,68,0.12)] bg-white shadow-[0_20px_40px_-28px_rgba(17,28,68,0.6)]"
                    : "border border-transparent bg-transparent hover:border-[rgba(17,28,68,0.1)] hover:bg-white/70"
                }`}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(244,165,28,0.18)] text-sm font-semibold text-[var(--brand-accent)] transition group-hover:scale-105">
                  {title.charAt(0).toUpperCase()}
                </span>

                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium text-[var(--brand-primary)]">
                    {title}
                  </span>
                  {subtitle && (
                    <span className="truncate text-xs text-[rgba(17,28,68,0.55)]">
                      {subtitle}
                    </span>
                  )}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
