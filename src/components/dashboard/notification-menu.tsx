"use client";

import { useTransition } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { danhDauTatCaThongBaoDaDoc, danhDauThongBaoDaDoc } from "./notification-actions";

export type ThongBaoItem = {
  id: string;
  tieu_de: string;
  noi_dung: string;
  duong_dan: string | null;
  da_doc: boolean;
  created_at: string;
};

export function NotificationMenu({ items }: { items: ThongBaoItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const unread = items.filter((item) => !item.da_doc).length;
  const openItem = (item: ThongBaoItem) => startTransition(async () => {
    if (!item.da_doc) await danhDauThongBaoDaDoc(item.id);
    router.push(item.duong_dan || "/");
    router.refresh();
  });
  const markAll = () => startTransition(async () => {
    await danhDauTatCaThongBaoDaDoc();
    router.refresh();
  });

  return <details className="group relative">
    <summary className="relative flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-xl border border-border bg-background text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
      <Bell className="h-5 w-5" aria-hidden="true" />
      <span className="sr-only">Thông báo{unread?` — ${unread} chưa đọc`:""}</span>
      {unread>0&&<span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground ring-2 ring-card">{unread>9?"9+":unread}</span>}
    </summary>
    <div className="fixed inset-x-4 top-[69px] z-50 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl lg:absolute lg:inset-x-auto lg:left-0 lg:top-auto lg:mt-2 lg:w-[23rem]">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div><p className="text-sm font-bold">Thông báo</p><p className="text-xs text-muted-foreground">{unread?`${unread} thông báo chưa đọc`:"Bạn đã đọc tất cả"}</p></div>
        {unread>0&&<button type="button" disabled={pending} onClick={markAll} className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-accent hover:bg-accent/10 disabled:opacity-50"><CheckCheck className="h-4 w-4"/>Đọc tất cả</button>}
      </div>
      <div className="max-h-96 overflow-y-auto p-2">
        {items.length?items.map(item=><button key={item.id} type="button" disabled={pending} onClick={()=>openItem(item)} className={`relative block w-full cursor-pointer rounded-xl px-3 py-3 text-left transition-colors hover:bg-muted disabled:opacity-60 ${item.da_doc?"":"bg-accent/5"}`}>
          {!item.da_doc&&<span className="absolute right-3 top-4 h-2 w-2 rounded-full bg-accent" aria-label="Chưa đọc"/>}
          <p className="pr-5 text-sm font-semibold text-foreground">{item.tieu_de}</p>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{item.noi_dung}</p>
          <time className="mt-1.5 block text-[11px] text-muted-foreground/80" dateTime={item.created_at}>{new Intl.DateTimeFormat("vi-VN",{dateStyle:"short",timeStyle:"short"}).format(new Date(item.created_at))}</time>
        </button>):<div className="px-4 py-8 text-center"><Bell className="mx-auto h-7 w-7 text-muted-foreground/40"/><p className="mt-2 text-sm text-muted-foreground">Chưa có thông báo</p></div>}
      </div>
    </div>
  </details>;
}
