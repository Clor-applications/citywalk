import Link from "next/link";
import { notFound } from "next/navigation";
import { RequestButton } from "@/components/request-button";
import { getSession } from "@/lib/auth";
import { KIND_LABEL, money, payLabel, timeAgo, trustChipClass } from "@/lib/format";
import { getMyOpenRequestsForPlace, getPlace } from "@/lib/places";
import { TRUST_COPY } from "@/lib/trust";

type PgMeta = { sharing?: string; rent?: number; deposit?: number; bedsFree?: number | null; amenities?: string[] };
type EventMeta = { time?: string; going?: number };

export default async function PlacePage(props: PageProps<"/places/[slug]">) {
  const { slug } = await props.params;
  const user = await getSession();
  const place = await getPlace(slug);
  if (!place) notFound();

  const myRequests = user ? await getMyOpenRequestsForPlace(place.id, user.id) : [];
  const byOpportunity = new Map(myRequests.filter((r) => r.opportunityId).map((r) => [r.opportunityId!, r]));
  const hasOwner = Boolean(place.claimedByUserId);
  const isOwner = Boolean(user && place.claimedByUserId === user.id);
  const jobs = place.opportunities.filter((o) => o.kind === "job");
  const pgs = place.opportunities.filter((o) => o.kind === "pg");
  const events = place.opportunities.filter((o) => o.kind === "event");
  const rooms = (place.metadata as { rooms?: { name: string; price: number; left: number }[] }).rooms;
  const menu = (place.metadata as { menu?: { item: string; price: number }[] }).menu;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mt-5 flex items-center gap-2 text-[12px] text-muted">
        <Link href="/hsr" className="hover:text-ink">
          HSR Layout
        </Link>
        <span>/</span>
        <span className="text-ink">{place.name}</span>
      </div>

      <header className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
              {KIND_LABEL[place.kind] ?? place.kind} · {place.category}
            </span>
            {place.isDemo ? <span className="chip chip-demo">Demo listing · fictional</span> : null}
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{place.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={trustChipClass(place.trust)}>● {TRUST_COPY[place.trust].label}</span>
            {place.trust !== "mapped" ? <span className="chip">confirmed {timeAgo(place.lastConfirmedAt)}</span> : null}
            {place.source === "openstreetmap" ? <span className="chip">Real place · OSM</span> : null}
          </div>
        </div>
      </header>

      <div className="mt-4 rounded-xl border border-line bg-black/20 p-3 text-[12px] leading-relaxed text-muted">
        <b className="text-ink">{TRUST_COPY[place.trust].label}:</b> {TRUST_COPY[place.trust].detail}
      </div>

      {place.description ? (
        <p className="mt-5 max-w-2xl text-[14px] leading-relaxed text-muted">{place.description}</p>
      ) : place.kind === "osm" ? (
        <p className="mt-5 max-w-2xl text-[14px] leading-relaxed text-muted">
          This place exists in OpenStreetMap. It has not joined CityWalk, so no hours, menu, jobs, contact details or
          availability are shown, and nothing here is endorsed by the owner.
        </p>
      ) : null}

      {place.kind === "osm" ? (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button className="btn btn-ghost" disabled title="Owner claim verification is the next milestone">
            Claim this place
          </button>
          <span className="text-[11px] text-muted">Ownership verification (documents + phone/GST) is not built yet.</span>
        </div>
      ) : null}

      {jobs.length ? (
        <section className="mt-8">
          <h2 className="text-[15px] font-semibold">Open roles ({jobs.length})</h2>
          <div className="mt-3 space-y-3">
            {jobs.map((job) => (
              <article key={job.id} className="card p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-[15px] font-semibold">{job.title}</h3>
                      {job.isDemo ? <span className="chip chip-demo">Demo</span> : null}
                    </div>
                    <p className="mt-1 text-[13px] leading-relaxed text-muted">{job.description}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="chip">{payLabel(job)}</span>
                      {place.trust !== "active" ? <span className="chip chip-warn">Availability unconfirmed</span> : null}
                    </div>
                  </div>
                  <div className="sm:pt-1">
                    {isOwner ? (
                      <Link href="/inbox" className="chip chip-info">
                        You manage this · see requests
                      </Link>
                    ) : hasOwner ? (
                      <RequestButton
                        kind="application"
                        opportunityId={job.id}
                        label="Apply"
                        existing={byOpportunity.get(job.id) ?? null}
                      />
                    ) : (
                      <span className="chip chip-warn">Owner not claimed · requests off</span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {pgs.length ? (
        <section className="mt-8">
          <h2 className="text-[15px] font-semibold">PG listings</h2>
          <div className="mt-3 space-y-3">
            {pgs.map((listing) => {
              const meta = listing.metadata as PgMeta;
              const beds = place.trust === "active" ? meta.bedsFree : null;
              return (
                <article key={listing.id} className="card p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[15px] font-semibold">{listing.title}</h3>
                        {listing.isDemo ? <span className="chip chip-demo">Demo</span> : null}
                      </div>
                      <p className="mt-1 text-[13px] leading-relaxed text-muted">{listing.description}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="chip">
                          {money(meta.rent ?? listing.payMin)}
                          <span className="opacity-60">/month</span>
                        </span>
                        {meta.deposit ? <span className="chip">Deposit {money(meta.deposit)}</span> : null}
                        {beds == null ? (
                          <span className="chip chip-warn">Availability not confirmed</span>
                        ) : beds > 0 ? (
                          <span className="chip chip-ok">{beds} bed{beds > 1 ? "s" : ""} free</span>
                        ) : (
                          <span className="chip chip-warn">Full</span>
                        )}
                      </div>
                      {meta.amenities?.length ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {meta.amenities.map((amenity) => (
                            <span key={amenity} className="chip">
                              {amenity}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <div className="sm:pt-1">
                      {isOwner ? (
                        <Link href="/inbox" className="chip chip-info">
                          You manage this · see requests
                        </Link>
                      ) : hasOwner ? (
                        <RequestButton
                          kind="pg_visit"
                          opportunityId={listing.id}
                          label="Request visit"
                          existing={byOpportunity.get(listing.id) ?? null}
                        />
                      ) : (
                        <span className="chip chip-warn">Owner not claimed · requests off</span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-muted">
            Visit requests reach the owner as a note. Contact details are not shared here; agree on a time in the
            response.
          </p>
        </section>
      ) : null}

      {events.length ? (
        <section className="mt-8">
          <h2 className="text-[15px] font-semibold">Events</h2>
          <div className="mt-3 space-y-3">
            {events.map((event) => {
              const meta = event.metadata as EventMeta;
              return (
                <article key={event.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-[15px] font-semibold">{event.title}</h3>
                      {event.isDemo ? <span className="chip chip-demo">Demo</span> : null}
                    </div>
                    <p className="mt-1 text-[13px] text-muted">{event.description}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {meta.time ? <span className="chip">{meta.time}</span> : null}
                      {meta.going != null ? <span className="chip">{meta.going} going</span> : null}
                    </div>
                  </div>
                  <span className="chip">RSVP arrives with event flows</span>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {rooms?.length ? (
        <section className="mt-8">
          <h2 className="text-[15px] font-semibold">Rooms</h2>
          <div className="mt-3 space-y-2">
            {rooms.map((room) => (
              <div key={room.name} className="card flex items-center justify-between p-3 text-[13px]">
                <span>{room.name}</span>
                <span className="flex items-center gap-3">
                  <span className="text-muted">{money(room.price)}/night</span>
                  <span className={room.left ? "chip chip-ok" : "chip chip-warn"}>
                    {room.left ? `${room.left} left` : "Sold out"}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {menu?.length ? (
        <section className="mt-8">
          <h2 className="text-[15px] font-semibold">Menu (owner-supplied)</h2>
          <div className="mt-3 space-y-2">
            {menu.map((item) => (
              <div key={item.item} className="card flex items-center justify-between p-3 text-[13px]">
                <span>{item.item}</span>
                <span className="text-muted">{money(item.price)}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-8 grid gap-3 sm:grid-cols-2">
        <div className="card p-4">
          <h2 className="text-[13px] font-semibold">Where this came from</h2>
          <p className="mt-2 text-[12px] leading-relaxed text-muted">
            {place.source === "openstreetmap"
              ? `Name and point from OpenStreetMap (${place.sourceLicence}). Geometry is not surveyed for navigation.`
              : "Fictional demo listing created for the pilot. Not a real business, owner or availability record."}
          </p>
          {place.attribution ? <p className="mt-2 text-[11px] text-muted">{place.attribution}</p> : null}
        </div>
        <div className="card p-4">
          <h2 className="text-[13px] font-semibold">Location</h2>
          <p className="mt-2 text-[12px] leading-relaxed text-muted">
            Area only: {place.lat.toFixed(5)}, {place.lng.toFixed(5)}
            {place.osmId ? ` · OSM node ${place.osmId}` : ""}
          </p>
          <p className="mt-2 text-[11px] text-muted">
            No private addresses, live presence or exact user locations are stored or displayed.
          </p>
        </div>
      </section>
    </div>
  );
}
