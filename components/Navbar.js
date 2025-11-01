'use client';
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const NAV_LINKS = [
  { label: "Home", href: "/login" },
  { label: "Chat", href: "/chat" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthed, setIsAuthed] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const syncAuthState = useCallback(() => {
    setIsAuthed(!!window.localStorage.getItem("token"));
  }, []);

  useEffect(() => {
    const handleStorage = (event) => {
      if (!event || event.key === "token") {
        syncAuthState();
      }
    };

    syncAuthState();
    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", syncAuthState);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", syncAuthState);
    };
  }, [syncAuthState]);

  useEffect(() => {
    syncAuthState();
  }, [pathname, syncAuthState]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname, isAuthed]);

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const closeMenu = () => setIsMenuOpen(false);

  const handleLogout = async () => {
    const token = window.localStorage.getItem("token");
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      window.localStorage.removeItem("token");
      window.localStorage.removeItem("user");
      setIsAuthed(false);
      router.push("/login");
      closeMenu();
    }
  };

  return (
    <header className="relative sticky top-0 z-50 border-b border-white/20 bg-gradient-to-r from-[var(--brand-primary)] via-[var(--brand-secondary)] to-[var(--brand-primary)] text-white/95 shadow-lg backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:h-20 lg:px-8">
        <Link href="/login" className="group flex items-center gap-4">
          <div className="relative h-12 w-12 overflow-hidden rounded-2xl bg-white/15 p-2 ring-2 ring-white/40 shadow-[0_18px_28px_-22px_rgba(0,0,0,0.7)] transition-all duration-300 group-hover:scale-105 group-hover:ring-[var(--brand-accent)]/70">
            <Image
              src="/assets/images.png"
              alt="Smart Chat Hub logo"
              fill
              className="object-contain drop-shadow-[0_10px_18px_rgba(0,0,0,0.35)]"
              sizes="3rem"
              priority
            />
          </div>
          <span className="hidden text-xl font-semibold tracking-wide text-white/90 sm:inline">
            Smart Chat Hub
          </span>
        </Link>

        <button
          type="button"
          onClick={toggleMenu}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-white transition hover:border-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:hidden"
          aria-label="Toggle navigation menu"
          aria-expanded={isMenuOpen}
        >
          <span className="sr-only">Open navigation</span>
          <svg
            className={`h-5 w-5 transition-transform ${isMenuOpen ? "rotate-90" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          </svg>
        </button>

        <nav className="hidden items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-1.5 shadow-inner shadow-black/25 md:flex">
          {NAV_LINKS.map((link) => {
            const isActive =
              pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-[var(--brand-accent)] text-[var(--brand-primary)] shadow-[0_12px_30px_-15px_rgba(244,165,28,0.85)]"
                    : "text-white/80 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {isAuthed ? (
            <>
              <Link
                href="/chat"
                className="hidden rounded-full bg-white/85 px-4 py-2 text-sm font-semibold text-[var(--brand-primary)] shadow-[0_20px_35px_-22px_rgba(17,28,68,0.65)] transition hover:bg-white hover:text-[var(--brand-secondary)] md:inline-flex"
              >
                Open Chat
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-full border border-white/60 px-4 py-2 text-sm font-semibold text-white/85 transition hover:border-white hover:bg-white/10 hover:text-white"
              >
                Logout
              </button>
            </>
          ) : null}
        </div>
      </div>

      <div
        className={`md:hidden ${isMenuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"} absolute inset-x-0 top-[64px] z-40 px-4 pb-4 transition-opacity duration-200 ease-out`}
      >
        <div className="overflow-hidden rounded-3xl border border-white/20 bg-white/95 text-[var(--brand-primary)] shadow-[0_35px_70px_-45px_rgba(17,28,68,0.7)]">
          <div className="flex flex-col divide-y divide-[rgba(17,28,68,0.08)]">
            {NAV_LINKS.map((link) => {
              const isActive =
                pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  className={`px-5 py-4 text-sm font-medium transition ${
                    isActive ? "bg-[var(--brand-accent)]/15 text-[var(--brand-secondary)]" : "hover:bg-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            {isAuthed ? (
              <>
                <Link
                  href="/chat"
                  onClick={closeMenu}
                  className="px-5 py-4 text-sm font-semibold text-[var(--brand-secondary)] transition hover:bg-white"
                >
                  Open Chat
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-5 py-4 text-left text-sm font-semibold text-[var(--brand-primary)] transition hover:bg-white"
                >
                  Logout
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
