import Link from "next/link";
import { RequestActions } from "@/components/request-actions";
import { requireProfile } from "@/lib/auth";
import { REQUEST_KIND_LABEL, REQUEST_STATE_LABEL, payLabel, requestStateClass, timeAgo } from "@/lib/format";
import { listInbox, listOutbox, type RequestView } from "@/lib/requests";

export default async function InboxPage(props: PageProps<"/inbox">) {
  const params = await props.searchParams;
  const tab = params.tab === "outbox" ? "outbox" : "inbox";
  const { user } = await requireProfile();
  const [inbox, outbox] = await Promise.all([listInbox(user.id), listOutbox(user.id)]);
  const rows = tab === "inbox" ? inbox : outbox;
  const pendingInbox = inbox.filter((r) => r.state === "sent").length;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mt-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">Requests</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Inbox</h1>
        <p className="mt-1 text-[13px] text-muted">
          Introductions, applications and visit requests. Nothing is sent until you confirm it.
        </p>
      </div>

      <div className="mt-5 flex gap-1 rounded-xl border border-line bg-black/25 p-1">
        <Link
          href="/inbox"
          className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-[13px] font-semibold ${
            tab === "inbox" ? "bg-white/10 text-ink" : "text-muted hover:text-ink"
          }`}
        >
          Received
          {pendingInbox ? (
            <span className="grid min-w-5 place-items-center rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold text-[#04201a]">
              {pendingInbox}
            </span>
          ) : null}
        </Link>
        <Link
          href="/inbox?tab=outbox"
          className={`rounded-lg px-3.5 py-2 text-[13px] font-semibold ${
            tab === "outbox" ? "bg-white/10 text-ink" : "text-muted hover:text-ink"
          }`}
        >
          Sent ({outbox.length})
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="card mt-4 p-8 text-center">
          <p className="text-[14px] font-semibold">{tab === "inbox" ? "No requests yet" : "You have not sent anything"}</p>
          <p className="mx-auto mt-1 max-w-md text-[12px] leading-relaxed text-muted">
            {tab === "inbox"
              ? "When someone asks for an intro, applies to a demo listing or requests a PG visit, it lands here."
              : "Open a place in HSR Layout to apply to a role or request a visit, or open a person's profile to ask for an intro."}
          </p>
          <Link href="/hsr" className="btn btn-sm mt-4">
            Explore HSR Layout
          </Link>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {rows.map((request) => (
            <RequestCard key={request.id} request={request} role={tab} />
          ))}
        </div>
      )}

      <p className="mt-5 text-[11px] leading-relaxed text-muted">
        Quota: 20 open requests per rolling 24 hours. Responses are final; a declined or withdrawn request cannot be
        reopened. Demo listings route to seeded demo owners only.
      </p>
    </div>
  );
}

function RequestCard({ request, role }: { request: RequestView; role: "inbox" | "outbox" }) {
  const target = request.counterpart;

  return (
    <article className="card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted">
          {REQUEST_KIND_LABEL[request.kind] ?? request.kind}
        </span>
        <span className={requestStateClass(request.state)}>{REQUEST_STATE_LABEL[request.state] ?? request.state}</span>
        <span className="ml-auto text-[11px] text-muted">{timeAgo(request.createdAt)}</span>
      </div>

      <div className="mt-2 flex flex-wrap items-baseline gap-x-2 text-[14px]">
        {request.place ? (
          <Link href={`/places/${request.place.slug}`} className="font-semibold hover:text-brand">
            {request.place.name}
          </Link>
        ) : target ? (
          <Link href={`/people/${target.id}`} className="font-semibold hover:text-brand">
            {target.name}
          </Link>
        ) : (
          <span className="font-semibold">CityWalk request</span>
        )}
        {request.place?.isDemo ? <span className="chip chip-demo">Demo</span> : null}
        {target ? (
          <span className="text-[12px] text-muted">
            {role === "inbox" ? "from" : "to"} {target.name}
            {target.isDemo ? " (demo)" : ""}
          </span>
        ) : request.kind !== "intro" ? (
          <span className="text-[12px] text-muted">listing has no claimed owner — delivered to the demo queue</span>
        ) : null}
      </div>

      {request.opportunity ? (
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-muted">
          <span>{request.opportunity.title}</span>
          <span className="chip">{payLabel(request.opportunity)}</span>
        </div>
      ) : null}

      <blockquote className="mt-3 border-l-2 border-line pl-3 text-[13px] leading-relaxed text-muted">
        {request.message}
      </blockquote>

      {request.responseNote ? (
        <div className="mt-3 rounded-lg bg-[rgba(46,211,176,0.07)] p-3 text-[12px] leading-relaxed">
          <b className="text-brand">Response:</b> {request.responseNote}
        </div>
      ) : null}

      {request.state === "sent" ? <RequestActions id={request.id} role={role} /> : null}
    </article>
  );
}
