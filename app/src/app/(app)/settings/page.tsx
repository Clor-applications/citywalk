import { db } from "@/db";
import { areas } from "@/db/schema";
import { ProfileForm } from "@/components/profile-form";
import { requireProfile } from "@/lib/auth";

export default async function SettingsPage() {
  const { user, profile } = await requireProfile();
  const areaRows = await db.select({ id: areas.id, name: areas.name, city: areas.city }).from(areas);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mt-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">Account</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-[13px] text-muted">Change what others see, or turn discoverability off entirely.</p>
      </div>

      <section className="card mt-5 p-5">
        <h2 className="text-[15px] font-semibold">Profile</h2>
        <div className="mt-4">
          <ProfileForm
            areas={areaRows}
            mode="edit"
            initial={{
              displayName: profile.displayName,
              headline: profile.headline,
              bio: profile.bio,
              skills: profile.skills,
              openTo: profile.openTo,
              areaId: profile.areaId,
              discoverable: profile.discoverable,
            }}
          />
        </div>
      </section>

      <section className="card mt-4 p-5">
        <h2 className="text-[15px] font-semibold">Sign-in</h2>
        <dl className="mt-3 grid gap-2 text-[13px] sm:grid-cols-2">
          <div>
            <dt className="text-[11px] uppercase tracking-[0.1em] text-muted">Email</dt>
            <dd className="mt-0.5 break-all">{user.email}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-[0.1em] text-muted">Role</dt>
            <dd className="mt-0.5">{user.role}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-[0.1em] text-muted">Consent recorded</dt>
            <dd className="mt-0.5">{profile.consentVersion}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-[0.1em] text-muted">Visibility</dt>
            <dd className="mt-0.5">{profile.discoverable ? "Listed in the area directory" : "Hidden from people search"}</dd>
          </div>
        </dl>
        <p className="mt-3 text-[11px] leading-relaxed text-muted">
          Passwords are not stored. Sign-in uses a six-digit email code that expires after 10 minutes. Sessions last 30
          days and can be ended by signing out.
        </p>
      </section>

      <section className="card mt-4 p-5">
        <h2 className="text-[15px] font-semibold">Privacy and data</h2>
        <ul className="mt-3 space-y-2 text-[12px] leading-relaxed text-muted">
          <li>
            <b className="text-ink">Shared:</b> name, headline, bio, skills, open-to, area, and the notes you send in a
            request — only while your profile is discoverable.
          </li>
          <li>
            <b className="text-ink">Not stored:</b> passwords, home addresses, live location, contact lists, or browsing
            history beyond a session cookie.
          </li>
          <li>
            <b className="text-ink">Not built yet:</b> self-serve data export and account deletion. Until they ship,
            these are handled manually before any public launch.
          </li>
        </ul>
      </section>

      {profile.isDemo ? (
        <p className="mt-4 rounded-xl border border-[rgba(255,201,112,0.25)] bg-[rgba(255,201,112,0.06)] p-3 text-[12px] leading-relaxed">
          You are signed in as a seeded demo profile. Requests sent to demo people and demo places are not seen by real
          businesses.
        </p>
      ) : null}
    </div>
  );
}
