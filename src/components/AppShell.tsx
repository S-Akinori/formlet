import Link from "next/link";
import { redirect } from "next/navigation";
import {
  EnvelopeSimple,
  GearSix,
  House,
  CreditCard,
  SignOut,
  SquaresFour,
} from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/app/actions";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: House },
  { href: "/dashboard/forms", label: "Forms", icon: SquaresFour },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings/smtp", label: "SMTP", icon: GearSix },
];

export async function AppShell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  return (
    <div className="min-h-[100dvh]">
      <header className="border-b border-line bg-paper/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-ink text-white">
              <EnvelopeSimple className="h-5 w-5" weight="bold" />
            </span>
            <span>
              <span className="block text-sm font-semibold leading-tight tracking-tight">Formlet</span>
              <span className="block text-xs text-zinc-500">{user.email}</span>
            </span>
          </Link>
          <form action={signOutAction}>
            <button className="button-secondary" type="submit">
              <SignOut className="h-4 w-4" weight="bold" />
              Logout
            </button>
          </form>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[220px_1fr] lg:px-8">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <nav className="grid gap-1">
            {nav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-white hover:text-zinc-950"
                >
                  <Icon className="h-4 w-4" weight="bold" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
