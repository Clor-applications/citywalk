import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getProfile, getSession } from "@/lib/auth";

export default async function LoginPage(props: PageProps<"/login">) {
  const user = await getSession();
  if (user) {
    const profile = await getProfile(user.id);
    redirect(profile ? "/hsr" : "/onboard");
  }
  const { next } = await props.searchParams;
  const nextPath = typeof next === "string" && next.startsWith("/") ? next : undefined;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-5">
      <header className="flex items-center justify-between py-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#2ed3b0] to-[#1b7fd6] text-[15px] font-black text-[#04201a]">
            CW
          </span>
          <span className="text-[15px] font-bold">CityWalk</span>
        </Link>
        <Link href="/" className="text-[13px] font-semibold text-muted hover:text-ink">
          Back
        </Link>
      </header>
      <div className="flex flex-1 items-center justify-center py-10">
        <LoginForm next={nextPath} />
      </div>
      <footer className="border-t border-line py-5 text-[11px] text-muted">
        Transactional email only. We do not send marketing without a separate opt-in.
      </footer>
    </main>
  );
}
