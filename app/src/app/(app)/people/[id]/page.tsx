import Link from "next/link";
import { notFound } from "next/navigation";
import { RequestButton } from "@/components/request-button";
import { requireProfile } from "@/lib/auth";
import { timeAgo } from "@/lib/format";
import { getArea, getPerson } from "@/lib/places";
import { getOpenRequestToPerson } from "@/lib/requests";

export default async function PersonPage(props: PageProps<"/people/[id]">) {
  const { id } = await props.params;
  const { user } = await requireProfile();
  const person = await getPerson(id, user.id);
  if (!person) notFound();

  const [area, existing] = await Promise.all([
    getArea(person.areaId),
    id === user.id ? Promise.resolve(null) : getOpenRequestToPerson(user.id, id),
  ]);
  const initials = person.displayName
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("");

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mt-5 flex items-center gap-2 text-[12px] text-muted">
        <Link href="/hsr" className="hover:text-ink">
          {area?.name ?? "Area"}
        </Link>
        <span>/</span>
        <span className="text-ink">{person.displayName}</span>
      </div>

      <header className="mt-5 flex items-start gap-4">
        <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#1e3b34] to-[#11211d] text-xl font-bold text-brand">
          {initials}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{person.displayName}</h1>
            {person.isDemo ? <span className="chip chip-demo">Demo profile</span> : null}
          </div>
          <p className="mt-0.5 text-[14px] text-muted">{person.headline}</p>
          <p className="mt-1 text-[11px] text-muted">
            {area ? `${area.name} · ${area.city}` : "Area hidden"} · profile updated {timeAgo(person.updatedAt)}
          </p>
        </div>
      </header>

      {person.bio ? <p className="mt-5 text-[14px] leading-relaxed text-muted">{person.bio}</p> : null}

      {person.skills.length ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {person.skills.map((skill) => (
            <span key={skill} className="chip">
              {skill}
            </span>
          ))}
        </div>
      ) : null}

      {person.openTo ? (
        <div className="card mt-5 p-4">
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.1em] text-muted">Open to</h2>
          <p className="mt-1 text-[14px]">{person.openTo}</p>
        </div>
      ) : null}

      <section className="card mt-5 p-5">
        {id === user.id ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[13px] text-muted">This is your public profile.</p>
            <Link href="/settings" className="btn btn-sm">
              Edit profile
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <h2 className="text-[15px] font-semibold">Ask for an intro</h2>
              <p className="mt-1 text-[12px] leading-relaxed text-muted">
                Send a short note. They can accept or decline. Your email and phone are never shown, and nothing is sent
                until you confirm.
              </p>
            </div>
            <RequestButton kind="intro" toUserId={id} label={`Request intro with ${person.displayName.split(" ")[0]}`} existing={existing} />
          </div>
        )}
      </section>

      <div className="mt-5 rounded-xl border border-line bg-black/20 p-4 text-[11px] leading-relaxed text-muted">
        <b className="text-ink">What is shared:</b> your profile name, headline and the note you write. Not shared:
        email, phone, exact location, or whether you opened this page. Accepting a request shares a response note so you
        can agree on a next step; a full chat thread is not built yet.
      </div>
    </div>
  );
}
