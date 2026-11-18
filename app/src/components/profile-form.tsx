"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Area = { id: string; name: string; city: string };

type Initial = {
  displayName: string;
  headline: string;
  bio: string;
  skills: string[];
  openTo: string;
  areaId: string;
  discoverable: boolean;
};

export function ProfileForm({
  areas,
  initial,
  mode,
}: {
  areas: Area[];
  initial?: Initial;
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initial?.displayName ?? "");
  const [headline, setHeadline] = useState(initial?.headline ?? "");
  const [bio, setBio] = useState(initial?.bio ?? "");
  const [skills, setSkills] = useState(initial?.skills.join(", ") ?? "");
  const [openTo, setOpenTo] = useState(initial?.openTo ?? "");
  const [areaId, setAreaId] = useState(initial?.areaId ?? areas[0]?.id ?? "hsr");
  const [discoverable, setDiscoverable] = useState(initial?.discoverable ?? false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          displayName,
          headline,
          bio,
          skills: skills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          openTo,
          areaId,
          discoverable,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.details?.fieldErrors ? "Check the highlighted fields" : (data?.error?.message ?? "Could not save"));
      if (mode === "create") {
        router.push("/hsr");
        router.refresh();
        return;
      }
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="displayName">
            Name
          </label>
          <input
            id="displayName"
            className="input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            required
            minLength={2}
            maxLength={80}
          />
        </div>
        <div>
          <label className="label" htmlFor="headline">
            Role or headline
          </label>
          <input
            id="headline"
            className="input"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="e.g. Frontend engineer · 4 years"
            required
            minLength={3}
            maxLength={120}
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="bio">
          Short bio <span className="normal-case tracking-normal">(optional)</span>
        </label>
        <textarea
          id="bio"
          className="textarea"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={600}
          placeholder="What you do, what you are looking for, how you prefer to be contacted."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="skills">
            Skills <span className="normal-case tracking-normal">(comma separated)</span>
          </label>
          <input
            id="skills"
            className="input"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="React, TypeScript, Hiring"
          />
        </div>
        <div>
          <label className="label" htmlFor="openTo">
            Open to
          </label>
          <input
            id="openTo"
            className="input"
            value={openTo}
            onChange={(e) => setOpenTo(e.target.value)}
            placeholder="e.g. Mentoring juniors · 30 min chats"
            maxLength={140}
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="area">
          Area
        </label>
        <select id="area" className="select" value={areaId} onChange={(e) => setAreaId(e.target.value)}>
          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name} · {area.city}
            </option>
          ))}
        </select>
        <p className="mt-1 text-[11px] text-muted">Only the area is shown. We never ask for or display a home address.</p>
      </div>

      <div className="rounded-xl border border-line bg-black/20 p-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            className="mt-0.5 size-4 accent-[var(--brand)]"
            checked={discoverable}
            onChange={(e) => setDiscoverable(e.target.checked)}
          />
          <span>
            <span className="block text-[14px] font-semibold">Let other signed-in people in this area find me</span>
            <span className="block text-[12px] leading-relaxed text-muted">
              Off by default. When on, your name, headline, skills and “open to” show in the area directory. No email,
              phone number or exact location is shown. You can switch this off at any time.
            </span>
          </span>
        </label>
      </div>

      {error ? <p className="text-[13px] text-[var(--danger)]">{error}</p> : null}
      {saved ? <p className="text-[13px] text-brand">Saved.</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <button className="btn px-5" disabled={busy}>
          {busy ? "Saving…" : mode === "create" ? "Save and start exploring" : "Save changes"}
        </button>
        <span className="text-[11px] text-muted">Consent version 2026-11 is recorded with your profile.</span>
      </div>
    </form>
  );
}
