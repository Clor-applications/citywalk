"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Action = "accept" | "decline" | "withdraw";

export function RequestActions({ id, role }: { id: string; role: "inbox" | "outbox" }) {
  const router = useRouter();
  const [action, setAction] = useState<Action | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(target: Action, withNote: string) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: target, note: withNote.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? "Could not update this request");
      setAction(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update this request");
    } finally {
      setBusy(false);
    }
  }

  if (action) {
    const title =
      action === "accept" ? "Accept and reply" : action === "decline" ? "Decline with a note" : "Withdraw this request";
    return (
      <form
        className="mt-3 rounded-xl border border-line bg-black/25 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit(action, note);
        }}
      >
        <p className="text-[12px] font-semibold">{title}</p>
        {action !== "withdraw" ? (
          <>
            <textarea
              className="textarea mt-2"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={300}
              placeholder="Optional note — e.g. a time or place to meet."
            />
            <p className="mt-1 text-[11px] text-muted">
              A response note is the only thing shared. It is visible to the other person in this request.
            </p>
          </>
        ) : (
          <p className="mt-1 text-[11px] text-muted">Withdrawing closes the request for both of you. This cannot be undone.</p>
        )}
        {error ? <p className="mt-2 text-[12px] text-[var(--danger)]">{error}</p> : null}
        <div className="mt-3 flex gap-2">
          <button className="btn btn-sm" disabled={busy}>
            {busy ? "Saving…" : action === "accept" ? "Confirm accept" : action === "decline" ? "Confirm decline" : "Confirm withdraw"}
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAction(null)} disabled={busy}>
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {role === "inbox" ? (
        <>
          <button className="btn btn-sm" onClick={() => setAction("accept")}>
            Accept
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setAction("decline")}>
            Decline
          </button>
        </>
      ) : (
        <button className="btn btn-ghost btn-sm" onClick={() => setAction("withdraw")}>
          Withdraw
        </button>
      )}
    </div>
  );
}
