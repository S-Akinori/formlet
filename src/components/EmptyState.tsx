import Link from "next/link";
import { FilePlus } from "@phosphor-icons/react/dist/ssr";

type EmptyStateProps = {
  title: string;
  body: string;
  href?: string;
  action?: string;
};

export function EmptyState({ title, body, href, action }: EmptyStateProps) {
  return (
    <div className="panel flex min-h-72 flex-col items-start justify-center gap-4 p-8">
      <div className="flex h-11 w-11 items-center justify-center rounded-md border border-line bg-paper">
        <FilePlus className="h-5 w-5 text-accent" weight="bold" />
      </div>
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900">{title}</h2>
        <p className="mt-1 max-w-xl text-sm leading-6 text-zinc-600">{body}</p>
      </div>
      {href && action ? (
        <Link className="button" href={href}>
          {action}
        </Link>
      ) : null}
    </div>
  );
}
