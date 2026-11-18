import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfile, getSession } from "@/lib/auth";

export default async function LandingPage() {
  const user = await getSession();
  if (user) {
    const profile = await getProfile(user.id);
    redirect(profile ? "/hsr" : "/onboard");
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-5 pb-14">
      <header className="flex items-center justify-between py-6">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#2ed3b0] to-[#1b7fd6] text-[15px] font-black text-[#04201a]">
            CW
          </span>
          <div className="leading-tight">
            <div className="text-[15px] font-bold">CityWalk</div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-muted">HSR Layout pilot</div>
          </div>
        </div>
        <Link href="/login" className="btn btn-ghost">
          Sign in
        </Link>
      </header>

      <section className="mt-10 grid gap-10 lg:mt-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-white/5 px-3 py-1 text-[12px] font-semibold text-muted">
            <span className="size-1.5 rounded-full bg-brand" />
            Bengaluru · HSR Layout · working pilot
          </p>
          <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-5xl lg:text-6xl">
            A neighbourhood you can <span className="brand-text">check before you go</span>.
          </h1>
          <p className="mt-5 max-w-xl text-pretty text-[15px] leading-relaxed text-muted sm:text-base">
            Find places, jobs, PGs and people around 27th Main. Every listing shows where the information came from and
            how fresh it is. Requests are drafted, not sent automatically, and people only appear when they opt in.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/login" className="btn px-5 py-3 text-[15px]">
              Sign in with email
            </Link>
            <Link href="#trust" className="btn btn-ghost px-5 py-3 text-[15px]">
              How labels work
            </Link>
          </div>
          <p className="mt-4 text-[12px] text-muted">
            Email one-time code. No password. 18+ only. Pilot data is a mix of OpenStreetMap places and clearly marked
            demo listings.
          </p>
        </div>

        <div className="card overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted">Near 27th Main</span>
            <span className="chip chip-ok">● Active</span>
          </div>
          <div className="space-y-3 p-4">
            {[
              { name: "Nest Comfort PG", meta: "Double sharing · from ₹8,500 · 3 beds free", state: "Active · confirmed today" },
              { name: "Lumen Labs", meta: "2 open roles · Frontend, Product Design", state: "Active · confirmed 2 days ago" },
              { name: "Green Leaf Stay", meta: "Double sharing · price listed", state: "Claimed · availability unconfirmed" },
              { name: "Lakme Beauty Parlour", meta: "Mapped from OpenStreetMap", state: "Mapped · not on CityWalk" },
            ].map((row) => (
              <div key={row.name} className="rounded-xl border border-line bg-black/20 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">{row.name}</div>
                    <div className="mt-0.5 text-[12px] text-muted">{row.meta}</div>
                  </div>
                  <span className="text-right text-[11px] font-semibold text-muted">{row.state}</span>
                </div>
              </div>
            ))}
            <p className="px-1 text-[11px] leading-relaxed text-muted">
              Illustration of the listing states using pilot data. Demo names are marked inside the app.
            </p>
          </div>
        </div>
      </section>

      <section id="trust" className="mt-16 grid gap-3 sm:grid-cols-3">
        {[
          {
            title: "Mapped",
            body: "Real public geography from OpenStreetMap. Shows the name and location only. Nothing about the owner, hours or availability is invented.",
          },
          {
            title: "Claimed",
            body: "An owner completed verification, but has not confirmed availability in the last seven days. Beds and vacancies stay hidden.",
          },
          {
            title: "Active",
            body: "The owner confirmed availability recently. Requests can be made with a clear context, and the owner still has to accept.",
          },
        ].map((item) => (
          <div key={item.title} className="card p-5">
            <div className="chip chip-info">{item.title}</div>
            <p className="mt-3 text-[13px] leading-relaxed text-muted">{item.body}</p>
          </div>
        ))}
      </section>

      <section className="mt-14 grid gap-3 md:grid-cols-3">
        <div className="card p-5">
          <h2 className="text-[15px] font-semibold">Work & homes in one place</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            Jobs and PG listings sit on the same map, with distance to the places you care about and the same trust
            labels on every card.
          </p>
        </div>
        <div className="card p-5">
          <h2 className="text-[15px] font-semibold">People appear by choice</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            Discoverability is off when your profile is created. You choose the area, the skills you show and what you
            are open to. Intros need your acceptance.
          </p>
        </div>
        <div className="card p-5">
          <h2 className="text-[15px] font-semibold">Nothing sent for you</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            Applications and visit requests are saved to your outbox first. You review and send. There is no automatic
            outreach and no invented availability.
          </p>
        </div>
      </section>

      <footer className="mt-auto flex flex-col gap-2 border-t border-line pt-6 text-[11px] leading-relaxed text-muted sm:flex-row sm:items-center sm:justify-between">
        <span>© OpenStreetMap contributors (ODbL). Map data is real; demo listings are labelled in the app.</span>
        <span>Working name, not trademark cleared. Not legal or compliance advice.</span>
      </footer>
    </main>
  );
}
