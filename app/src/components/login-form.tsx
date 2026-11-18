"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function requestCode(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/request-code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? "Could not send the code");
      setDevCode(data.devCode);
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the code");
    } finally {
      setBusy(false);
    }
  }

  async function verify(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, code, next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? "Could not sign you in");
      router.replace(data.next ?? "/hsr");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign you in");
      setBusy(false);
    }
  }

  return (
    <div className="card w-full max-w-md p-6 sm:p-7">
      <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">Sign in</div>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        {step === "email" ? "One code, no password" : "Check your email"}
      </h1>
      <p className="mt-2 text-[13px] leading-relaxed text-muted">
        {step === "email"
          ? "We email a 6-digit code. It expires in 10 minutes. By continuing you confirm you are 18 or older."
          : `Enter the code sent to ${email}. Check spam if it is not there in a minute.`}
      </p>

      {step === "email" ? (
        <form onSubmit={requestCode} className="mt-6 space-y-3">
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className="input"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          {error ? <p className="text-[13px] text-[var(--danger)]">{error}</p> : null}
          <button className="btn w-full" disabled={busy}>
            {busy ? "Sending…" : "Email me a code"}
          </button>
        </form>
      ) : (
        <form onSubmit={verify} className="mt-6 space-y-3">
          <div>
            <label className="label" htmlFor="code">
              6-digit code
            </label>
            <input
              id="code"
              className="input font-mono text-lg tracking-[0.35em]"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
            />
          </div>
          {devCode ? (
            <div className="rounded-xl border border-[rgba(255,201,112,0.3)] bg-[rgba(255,201,112,0.08)] p-3 text-[13px]">
              <b className="text-[var(--warn)]">Dev transport:</b> code is <span className="font-mono">{devCode}</span>{" "}
              (also printed in the server log).
            </div>
          ) : null}
          {error ? <p className="text-[13px] text-[var(--danger)]">{error}</p> : null}
          <button className="btn w-full" disabled={busy || code.length !== 6}>
            {busy ? "Checking…" : "Sign in"}
          </button>
          <button
            type="button"
            className="btn btn-ghost w-full"
            onClick={() => {
              setStep("email");
              setCode("");
              setDevCode(undefined);
              setError("");
            }}
          >
            Use a different email
          </button>
        </form>
      )}
    </div>
  );
}
