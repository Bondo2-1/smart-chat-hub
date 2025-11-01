"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

const MODES = {
  login: {
    key: "login",
    title: "Welcome back",
    subtitle: "Sign in to continue the conversation.",
    action: "Sign in",
  },
  register: {
    key: "register",
    title: "Create your workspace",
    subtitle: "Start collaborating with your team in minutes.",
    action: "Create account",
  },
};

const initialFormState = {
  name: "",
  email: "",
  password: "",
};

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState(MODES.login.key);
  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const copy = useMemo(() => MODES[mode], [mode]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.replace("/chat");
      return;
    }

    if (window.location.hash.replace("#", "") === MODES.register.key) {
      setMode(MODES.register.key);
    }
  }, [router]);

  const toggleMode = (nextMode) => {
    setMode(nextMode);
    setError("");
    setSuccess("");
    setFormData((prev) => ({
      ...prev,
      password: "",
      ...(nextMode === MODES.register.key ? {} : { name: prev.name }),
    }));
  };

  const handleChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const payload =
      mode === MODES.login.key
        ? {
            email: formData.email.trim(),
            password: formData.password,
          }
        : {
            name: formData.name.trim(),
            email: formData.email.trim(),
            password: formData.password,
          };

    try {
      const endpoint =
        mode === MODES.login.key ? "/auth/login" : "/auth/register";
      const response = await apiRequest(endpoint, "POST", payload);

      if (!response?.ok) {
        setError(
          response?.error ||
            "We couldn’t process your request. Please try again."
        );
        return;
      }

      if (mode === MODES.login.key) {
        localStorage.setItem("token", response.token);
        localStorage.setItem("user", JSON.stringify(response.user));
        router.push("/chat");
        return;
      }

      setSuccess("Account created successfully. You can sign in now.");
      setMode(MODES.login.key);
      setFormData({
        name: "",
        email: payload.email,
        password: "",
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unexpected error. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative isolate mx-auto w-full max-w-5xl overflow-hidden rounded-[26px] bg-white/85 px-5 py-12 shadow-[0_40px_120px_-55px_rgba(15,23,42,0.58)] backdrop-blur-sm sm:rounded-[32px] sm:px-8 sm:py-14 lg:rounded-[36px] lg:px-12 lg:py-16">
      <div className="pointer-events-none absolute -top-32 -left-24 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_top,var(--brand-accent),rgba(255,255,255,0))] opacity-60" />
      <div className="pointer-events-none absolute -bottom-24 -right-10 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_bottom,var(--brand-secondary),rgba(255,255,255,0))] opacity-70" />

      <div className="grid items-center gap-10 sm:gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <div className="relative z-10 space-y-8 text-center lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full bg-[rgba(17,28,68,0.08)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[rgba(17,28,68,0.7)]">
            Powered by Smart Chat Hub
          </span>

          <div className="space-y-6">
            <h1 className="text-3xl font-bold leading-tight text-[var(--brand-primary)] sm:text-4xl lg:text-5xl">
              Connected conversations. Seamless customer journeys.
            </h1>
            <p className="mx-auto max-w-xl text-base leading-7 text-[rgba(17,28,68,0.72)] sm:text-lg lg:mx-0">
              Smart Chat Hub brings every channel, teammate, and customer into a
              single modern workspace inspired by the fluid experience of
              V.CONNECT. Build stronger relationships without the busywork.
            </p>
          </div>

          <div className="grid gap-4 sm:gap-5 sm:grid-cols-2">
            {[
              "Unified inbox with live presence indicators",
              "AI-powered insights tailored to your conversations",
              "Secure infrastructure backed by enterprise-grade encryption",
              "Deploy in minutes with no-code onboarding flows",
            ].map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-2xl border border-white/60 bg-white/70 p-4 shadow-[0_22px_48px_-36px_rgba(17,28,68,0.4)]"
              >
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--brand-accent)]" />
                <p className="text-sm font-medium leading-6 text-[rgba(17,28,68,0.8)]">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 rounded-[24px] border border-white/60 bg-white/95 p-6 shadow-[0_45px_100px_-60px_rgba(17,28,68,0.5)] sm:rounded-[28px] sm:p-8 lg:rounded-[32px] lg:p-10">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-semibold text-[var(--brand-primary)]">
                {copy.title}
              </h2>
              <p className="mt-1.5 text-sm text-[rgba(17,28,68,0.6)]">
                {copy.subtitle}
              </p>
            </div>
          </div>

          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:gap-0 rounded-full bg-[rgba(17,28,68,0.06)] p-1">
            {Object.values(MODES).map((modeOption) => {
              const isActive = modeOption.key === mode;
              return (
                <button
                  key={modeOption.key}
                  type="button"
                  onClick={() => toggleMode(modeOption.key)}
                  className={`flex-1 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                    isActive
                      ? "bg-[var(--brand-primary)] text-white shadow-[0_16px_32px_-20px_rgba(17,28,68,0.7)]"
                      : "text-[rgba(17,28,68,0.6)] hover:text-[var(--brand-primary)]"
                  }`}
                  disabled={loading}
                >
                  {modeOption.key === MODES.login.key
                    ? "Sign in"
                    : "Create account"}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === MODES.register.key && (
              <div>
                <label
                  htmlFor="name"
                  className="text-xs font-semibold uppercase tracking-[0.22em] text-[rgba(17,28,68,0.55)]"
                >
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange("name")}
                  className="mt-2 w-full rounded-xl border border-[rgba(17,28,68,0.12)] bg-white px-4 py-3 text-sm text-[var(--brand-primary)] shadow-sm shadow-[rgba(17,28,68,0.05)] outline-none transition focus:border-[var(--brand-secondary)] focus:ring-2 focus:ring-[rgba(31,61,122,0.2)]"
                  placeholder="Alex Morgan"
                  autoComplete="name"
                  required
                />
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="text-xs font-semibold uppercase tracking-[0.22em] text-[rgba(17,28,68,0.55)]"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleChange("email")}
                className="mt-2 w-full rounded-xl border border-[rgba(17,28,68,0.12)] bg-white px-4 py-3 text-sm text-[var(--brand-primary)] shadow-sm shadow-[rgba(17,28,68,0.05)] outline-none transition focus:border-[var(--brand-secondary)] focus:ring-2 focus:ring-[rgba(31,61,122,0.2)]"
                placeholder="you@company.com"
                autoComplete={mode === MODES.login.key ? "email" : "email"}
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="text-xs font-semibold uppercase tracking-[0.22em] text-[rgba(17,28,68,0.55)]"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={handleChange("password")}
                className="mt-2 w-full rounded-xl border border-[rgba(17,28,68,0.12)] bg-white px-4 py-3 text-sm text-[var(--brand-primary)] shadow-sm shadow-[rgba(17,28,68,0.05)] outline-none transition focus:border-[var(--brand-secondary)] focus:ring-2 focus:ring-[rgba(31,61,122,0.2)]"
                placeholder="Enter your password"
                autoComplete={
                  mode === MODES.login.key
                    ? "current-password"
                    : "new-password"
                }
                required
              />
            </div>

            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}

            {success && (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {success}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-2xl bg-gradient-to-r from-[var(--brand-secondary)] via-[var(--brand-primary)] to-[#0d1327] px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-[0_18px_42px_-18px_rgba(17,28,68,0.7)] transition hover:scale-[1.01] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)] disabled:cursor-not-allowed disabled:opacity-70"
              disabled={loading}
            >
              {loading ? "Please wait…" : copy.action}
            </button>
          </form>

          <p className="mt-6 text-center text-xs font-medium uppercase tracking-[0.3em] text-[rgba(17,28,68,0.5)]">
            {mode === MODES.login.key ? (
              <button
                type="button"
                onClick={() => toggleMode(MODES.register.key)}
                className="text-[var(--brand-accent)] underline-offset-4 hover:underline"
              >
                Need an account? Create one
              </button>
            ) : (
              <button
                type="button"
                onClick={() => toggleMode(MODES.login.key)}
                className="text-[var(--brand-accent)] underline-offset-4 hover:underline"
              >
                Already onboard? Sign in
              </button>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
