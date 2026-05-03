import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { EmptyState } from "@/components/EmptyState";
import { getCurrentPlan, getRetentionStart } from "@/lib/billing/plans";

export default async function SubmissionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  const plan = await getCurrentPlan(supabase, user.id);
  const retentionStart = getRetentionStart(plan);
  let submissionsQuery = supabase
    .from("submissions")
    .select("id, sender_email, sender_name, status, created_at")
    .eq("form_id", id)
    .order("created_at", { ascending: false });

  if (retentionStart) {
    submissionsQuery = submissionsQuery.gte("created_at", retentionStart);
  }

  const [{ data: form }, { data: submissions }] = await Promise.all([
    supabase.from("forms").select("id, name").eq("id", id).eq("user_id", user.id).maybeSingle(),
    submissionsQuery,
  ]);

  if (!form) notFound();

  return (
    <div className="grid gap-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent">Submissions</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">{form.name}</h1>
        {retentionStart ? <p className="mt-2 text-sm text-zinc-600">Freeプランでは直近90日分を表示します。</p> : null}
      </div>
      {submissions?.length ? (
        <div className="panel overflow-hidden">
          <div className="divide-y divide-line">
            {submissions.map((submission) => (
              <Link key={submission.id} href={`/dashboard/forms/${id}/submissions/${submission.id}`} className="grid gap-3 px-5 py-4 transition hover:bg-paper sm:grid-cols-[1fr_160px_24px] sm:items-center">
                <span>
                  <span className="block text-sm font-semibold text-zinc-950">{submission.sender_name || submission.sender_email || "Unknown sender"}</span>
                  <span className="mt-1 block text-xs text-zinc-500">{submission.sender_email}</span>
                </span>
                <span className="text-xs text-zinc-500">{new Date(submission.created_at).toLocaleString("ja-JP")}</span>
                <ArrowRight className="hidden h-4 w-4 text-zinc-400 sm:block" weight="bold" />
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState title="問い合わせはまだありません" body="フォーム送信URLにPOSTされると、ここに受信データが表示されます。" />
      )}
    </div>
  );
}
