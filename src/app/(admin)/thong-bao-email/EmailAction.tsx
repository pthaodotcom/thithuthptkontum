"use client";

import { useActionState } from "react";
import { LoaderCircle, Mail } from "lucide-react";
import { guiLaiBaoCao, type ReportActionState } from "../bao-cao-hoc-sinh/actions";
import EmailPreview from "./EmailPreview";

export default function EmailAction({ baiLamId, disabled, sent }: { baiLamId: string; disabled: boolean; sent: boolean }) {
  const [state, action, pending] = useActionState<ReportActionState, FormData>(guiLaiBaoCao, null);
  const label = sent ? "Gửi lại báo cáo cho phụ huynh" : "Gửi báo cáo cho phụ huynh";
  return <div className="space-y-1.5"><div className="flex gap-2"><EmailPreview baiLamId={baiLamId} /><form action={action}><input type="hidden" name="baiLamId" value={baiLamId} /><button disabled={disabled || pending} aria-label={label} className="group relative inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-border transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50">{pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}<span role="tooltip" className="pointer-events-none absolute -top-10 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-950 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">{sent ? "Gửi lại email" : "Gửi email"}</span></button></form></div>{state && <p role="status" className={`max-w-52 text-xs ${state.ok ? "text-emerald-700" : "text-amber-700"}`}>{state.message}</p>}</div>;
}
