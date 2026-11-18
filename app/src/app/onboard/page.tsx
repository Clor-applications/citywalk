import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { areas } from "@/db/schema";
import { ProfileForm } from "@/components/profile-form";
import { getProfile, requireUser } from "@/lib/auth";

export default async function OnboardPage() {
  const user = await requireUser("/onboard");
  const existing = await getProfile(user.id);
  if (existing) redirect("/hsr");

  const areaRows = await db.select({ id: areas.id, name: areas.name, city: areas.city }).from(areas);

  return (
    <main className="mx-auto w-full max-w-3xl px-5 pb-16">
      <header className="flex items-center justify-between py-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#2ed3b0] to-[#1b7fd6] text-[15px] font-black text-[#04201a]">
            CW
          </span>
          <span className="text-[15px] font-bold">CityWalk</span>
        </Link>
        <span className="chip">Signed in as {user.email}</span>
      </header>

      <div className="mt-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">Step 2 of 2</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Set up your profile</h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted">
          This is what people in the area can see if you choose to be discoverable. Your profile starts hidden. You can
          change every field later from Settings.
        </p>
      </div>

      <div className="card mt-6 p-5 sm:p-6">
        <ProfileForm areas={areaRows} mode="create" />
      </div>
    </main>
  );
}
