"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { MapView } from "./map-view";
import type { PlaceSummary } from "@/lib/places";
import { KIND_LABEL, KIND_ORDER, distanceLabel, trustChipClass } from "@/lib/format";

const PAGE = 36;

export function AreaExplorer({
  places,
  center,
}: {
  places: PlaceSummary[];
  center: { lat: number; lng: number };
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"list" | "map">("list");
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("all");
  const [trust, setTrust] = useState("all");
  const [limit, setLimit] = useState(PAGE);

  const counts = useMemo(() => {
    const byKind = new Map<string, number>();
    for (const place of places) byKind.set(place.kind, (byKind.get(place.kind) ?? 0) + 1);
    return byKind;
  }, [places]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return places.filter((place) => {
      if (kind !== "all" && place.kind !== kind) return false;
      if (trust !== "all" && place.trust !== trust) return false;
      if (!needle) return true;
      return (
        place.name.toLowerCase().includes(needle) ||
        place.category.toLowerCase().includes(needle) ||
        place.description.toLowerCase().includes(needle)
      );
    });
  }, [places, q, kind, trust]);

  const visible = filtered.slice(0, limit);

  return (
    <section className="card mt-8 overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center">
        <div className="flex rounded-xl border border-line bg-black/25 p-1">
          <button
            className={`rounded-lg px-3.5 py-1.5 text-[13px] font-semibold ${
              tab === "list" ? "bg-white/10 text-ink" : "text-muted hover:text-ink"
            }`}
            onClick={() => setTab("list")}
            aria-pressed={tab === "list"}
          >
            List
          </button>
          <button
            className={`rounded-lg px-3.5 py-1.5 text-[13px] font-semibold ${
              tab === "map" ? "bg-white/10 text-ink" : "text-muted hover:text-ink"
            }`}
            onClick={() => setTab("map")}
            aria-pressed={tab === "map"}
          >
            Map
          </button>
        </div>
        <input
          className="input sm:max-w-sm"
          placeholder="Search places, categories…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setLimit(PAGE);
          }}
        />
        <div className="ml-auto flex items-center gap-2 text-[12px] text-muted">
          <span>{filtered.length} places</span>
          <select className="select w-auto py-1.5" value={trust} onChange={(e) => setTrust(e.target.value)}>
            <option value="all">All states</option>
            <option value="active">Active</option>
            <option value="claimed">Claimed</option>
            <option value="mapped">Mapped</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-line px-4 py-3">
        <button
          className={`chip ${kind === "all" ? "chip-ok" : ""}`}
          onClick={() => {
            setKind("all");
            setLimit(PAGE);
          }}
        >
          All ({places.length})
        </button>
        {KIND_ORDER.filter((k) => counts.get(k)).map((k) => (
          <button
            key={k}
            className={`chip ${kind === k ? "chip-ok" : ""}`}
            onClick={() => {
              setKind(k);
              setLimit(PAGE);
            }}
          >
            {KIND_LABEL[k] ?? k} ({counts.get(k)})
          </button>
        ))}
      </div>

      {tab === "map" ? (
        <div className="p-4">
          <MapView places={filtered} center={center} onOpen={(slug) => router.push(`/places/${slug}`)} />
          <p className="mt-3 text-[11px] text-muted">
            Dot colour: teal = active supply, amber = claimed with unconfirmed availability, grey = mapped OSM place.
            This map is a discovery aid, not a surveyed or navigable map. Tiles © OpenFreeMap, data © OpenStreetMap
            contributors.
          </p>
        </div>
      ) : (
        <div className="p-4">
          {visible.length === 0 ? (
            <p className="py-10 text-center text-[13px] text-muted">Nothing matches those filters.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {visible.map((place) => (
                <PlaceCard key={place.id} place={place} />
              ))}
            </div>
          )}

          {filtered.length > visible.length ? (
            <div className="mt-4 flex justify-center">
              <button className="btn btn-ghost" onClick={() => setLimit((n) => n + PAGE)}>
                Show more ({filtered.length - visible.length} left)
              </button>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}

function PlaceCard({ place }: { place: PlaceSummary }) {
  return (
    <Link
      href={`/places/${place.slug}`}
      className="group rounded-xl border border-line bg-black/20 p-4 transition hover:border-[rgba(46,211,176,0.35)] hover:bg-white/[0.04]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-[14px] font-semibold">{place.name}</span>
            {place.isDemo ? <span className="chip chip-demo">Demo</span> : null}
          </div>
          <div className="mt-1 text-[12px] text-muted">
            {place.category} · {KIND_LABEL[place.kind] ?? place.kind} · {distanceLabel(place.distanceM)} away
          </div>
        </div>
        <span className={trustChipClass(place.trust)}>● {place.trust}</span>
      </div>

      {place.description ? (
        <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-muted">{place.description}</p>
      ) : null}

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {place.openSupply > 0 ? <span className="chip">{place.openSupply} open listing{place.openSupply > 1 ? "s" : ""}</span> : null}
        {place.trust === "mapped" ? <span className="chip">Real place · OSM</span> : null}
      </div>
    </Link>
  );
}
