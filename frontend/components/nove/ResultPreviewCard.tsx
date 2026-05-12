import Link from "next/link";
import type { ReactNode } from "react";
import { TaskStatusPill } from "./TaskStatusPill";

type Props = {
  href: string;
  title: string;
  status: string;
  imageUrl?: string | null;
  footer?: ReactNode;
};

export function ResultPreviewCard({ href, title, status, imageUrl, footer }: Props) {
  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-2xl border border-white/[0.08] bg-nove-graphite/60 shadow-inner-glow transition duration-300 hover:-translate-y-1 hover:border-teal-400/25 hover:shadow-[0_0_32px_-10px_rgba(94,234,212,0.22)]"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-black/40">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- external URLs
          <img
            src={imageUrl}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-violet-950/40 to-teal-950/30 text-xs text-slate-500">
            Preview
          </div>
        )}
        <div className="absolute right-2 top-2">
          <TaskStatusPill status={status} />
        </div>
      </div>
      <div className="p-4">
        <p className="line-clamp-2 text-sm text-slate-200">{title}</p>
        {footer ? <div className="mt-2 text-xs text-slate-500">{footer}</div> : null}
      </div>
    </Link>
  );
}
