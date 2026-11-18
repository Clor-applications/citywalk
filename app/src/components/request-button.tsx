"use client";

import Link from "next/link";
import { useState } from "react";
import { REQUEST_STATE_LABEL, requestStateClass } from "@/lib/format";

const DEFAULTS: Record<string, string> = {
  intro: "Hi! I'm reaching out from CityWalk. Would you be open to a short intro chat this week?",
  application: "I'd like to apply for this role. My skills are on my CityWalk profile; happy to share more.",
  pg_visit: "I'd like to schedule a visit. Could you share a couple of times that work this week?",
};

export function RequestButton({
  kind,
  toUserId,
  opportunityId,
  label,
  existing,
}: {
  kind: "intro" | "application" | "pg_visit";
  toUserId?: string;
  opportunityId?: string;
  label: string;
  existing?: { state: string } | null;
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(DEFAULTS[kind] ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  if (existing) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className={requestStateClass(existing.state)}>{REQUEST_STATE_LABEL[existing.state] ?? existing.state}</span>
        <Link className="link text-[12px]" href={existing.state === "sent" ? "/inbox?tab=outbox" : "/inbox"}>
          Track it in your inbox →
        </Link>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="chip chip-info">Sent</span>
        <Link className="link text-[12px]" href="/inbox?tab=outbox">
          Open outbox →
        </Link>
      </div>
    );
  }

  if (!open) {
    return (
      <button className="btn btn-sm" onClick={() => setOpen(true)}>
        {label}
      </button>
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, toUserId, opportunityId, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? "Could not send the request");
      setSent(true);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the request");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-2 rounded-xl border border-line bg-black/25 p-3">
      <label className="label" htmlFor={`msg-${kind}-${opportunityId ?? toUserId ?? "x"}`}>
        Your note
      </label>
      <textarea
        id={`msg-${kind}-${opportunityId ?? toUserId ?? "x"}`}
        className="textarea"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={600}
        required
      />
      <p className="mt-2 text-[11px] leading-relaxed text-muted">
        Only sent when you press send. The other side sees your profile name and this note. Your email is never shown.
      </p>
      {error ? <p className="mt-2 text-[12px] text-[var(--danger)]">{error}</p> : null}
      <div className="mt-3 flex gap-2">
        <button className="btn btn-sm" disabled={busy || !message.trim()}>
          {busy ? "Sending…" : "Confirm and send"}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)} disabled={busy}>
          Cancel
        </button>
      </div>
    </form>
  );
}
