import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";
import { requireProfile } from "@/lib/auth";
import { countInbox } from "@/lib/requests";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await requireProfile();
  const inbox = await countInbox(user.id);

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-line bg-[rgba(8,12,11,0.82)] backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 py-3 sm:gap-4 sm:px-5">
          <Link href="/hsr" className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-[#2ed3b0] to-[#1b7fd6] text-[13px] font-black text-[#04201a]">
              CW
            </span>
            <span className="hidden text-[14px] font-bold sm:block">CityWalk</span>
          </Link>

          <nav className="flex items-center gap-0.5 text-[12px] font-semibold sm:gap-1 sm:text-[13px]">
            <Link className="rounded-lg px-2 py-2 text-muted hover:bg-white/5 hover:text-ink sm:px-3" href="/hsr">
              <span className="sm:hidden">HSR</span>
              <span className="hidden sm:inline">HSR Layout</span>
            </Link>
            <Link className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-muted hover:bg-white/5 hover:text-ink sm:gap-2 sm:px-3" href="/inbox">
              Inbox
              {inbox > 0 ? (
                <span className="grid min-w-5 place-items-center rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold text-[#04201a]">
                  {inbox}
                </span>
              ) : null}
            </Link>
            <Link className="rounded-lg px-2 py-2 text-muted hover:bg-white/5 hover:text-ink sm:px-3" href="/walk">
              Walk
            </Link>
            <Link className="rounded-lg px-2 py-2 text-muted hover:bg-white/5 hover:text-ink sm:px-3" href="/settings">
              Settings
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <span className="hidden max-w-[220px] truncate text-[12px] text-muted sm:block">
              {profile.displayName}
              {profile.isDemo ? <span className="ml-2 chip chip-demo">Demo</span> : null}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 pb-16">{children}</main>
    </div>
  );
}
