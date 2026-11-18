import Link from "next/link";
import { AreaExplorer } from "@/components/area-explorer";
import { requireProfile } from "@/lib/auth";
import { getArea, listPeople, listPlaces } from "@/lib/places";

const AREA_ID = "hsr";

export default async function AreaPage() {
  await requireProfile();
  const [area, places, people] = await Promise.all([getArea(AREA_ID), listPlaces(AREA_ID), listPeople(AREA_ID)]);
  if (!area) return <p className="py-16 text-center text-muted">Area not seeded. Run pnpm db:seed.</p>;

  const counts = {
    active: places.filter((p) => p.trust === "active").length,
    claimed: places.filter((p) => p.trust === "claimed").length,
    mapped: places.filter((p) => p.trust === "mapped").length,
  };

  return (
    <div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">Area</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {area.name} <span className="text-lg font-medium text-muted">· {area.city}</span>
          </h1>
          <p className="mt-1 text-[13px] text-muted">
            27th Main pilot · {places.length} places · {people.length} opted-in people
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/walk"
            className="rounded-xl border border-[rgba(46,211,176,0.35)] bg-[rgba(46,211,176,0.10)] px-3.5 py-2 text-[13px] font-semibold text-brand transition hover:bg-[rgba(46,211,176,0.18)]"
          >
            Enter 3D walk →
          </Link>
          <span className="chip chip-ok">{counts.active} active</span>
          <span className="chip chip-warn">{counts.claimed} claimed</span>
          <span className="chip">{counts.mapped} mapped</span>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-[rgba(255,201,112,0.25)] bg-[rgba(255,201,112,0.06)] p-3 text-[12px] leading-relaxed">
        <b className="text-[var(--warn)]">Pilot data:</b> places sourced from OpenStreetMap are real geometry and names.
        Listings marked <span className="chip chip-demo">Demo</span> are fictional and clearly labelled. Availability is
        never inferred, and incoming requests are seeds for the demo owners.
      </div>

      {people.length ? (
        <section className="mt-8">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-[15px] font-semibold">People open to a conversation</h2>
            <span className="text-[11px] text-muted">Discoverable by choice · area only</span>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {people.map((person) => (
              <Link
                key={person.id}
                href={`/people/${person.id}`}
                className="group rounded-xl border border-line bg-black/20 p-4 transition hover:border-[rgba(46,211,176,0.35)] hover:bg-white/[0.04]"
              >
                <div className="flex items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#1e3b34] to-[#11211d] text-[13px] font-bold text-brand">
                    {person.displayName
                      .split(" ")
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join("")}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[14px] font-semibold">{person.displayName}</span>
                      {person.isDemo ? <span className="chip chip-demo">Demo</span> : null}
                    </div>
                    <div className="truncate text-[12px] text-muted">{person.headline}</div>
                  </div>
                </div>
                {person.openTo ? <div className="mt-2 line-clamp-1 text-[12px] text-muted">Open to: {person.openTo}</div> : null}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <AreaExplorer places={places} center={{ lat: area.lat, lng: area.lng }} />

      <p className="mt-4 text-[11px] leading-relaxed text-muted">
        Map tiles © OpenFreeMap, data © OpenStreetMap contributors (ODbL). Distances are straight-line from the area
        centre, not walking routes.
      </p>
    </div>
  );
}
