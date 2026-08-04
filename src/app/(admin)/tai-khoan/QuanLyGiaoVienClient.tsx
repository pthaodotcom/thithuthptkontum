"use client";

import { useState, type ComponentProps } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import PhanCongClient from "../phan-cong-giang-day/PhanCongClient";
import TaiKhoanClient from "./TaiKhoanClient";

type TaiKhoanProps = ComponentProps<typeof TaiKhoanClient>;
type PhanCongProps = ComponentProps<typeof PhanCongClient>;

export default function QuanLyGiaoVienClient({
  activeTab,
  taiKhoanProps,
  phanCongProps,
}: {
  activeTab: "danh-sach" | "phan-cong";
  taiKhoanProps: TaiKhoanProps;
  phanCongProps: PhanCongProps;
}) {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState(activeTab);
  const changeTab = (tab: "danh-sach" | "phan-cong") => {
    const url = tab === "phan-cong"
      ? "/tai-khoan?loai=GiaoVien&tab=phan-cong"
      : "/tai-khoan?loai=GiaoVien";
    setSelectedTab(tab);
    router.replace(url, { scroll: false });
  };

  return (
    <div className="space-y-5">
      <div className="flex w-fit gap-1 rounded-xl border border-border bg-muted/40 p-1" role="tablist" aria-label="Quản lý giáo viên">
        <Button
          type="button"
          role="tab"
          aria-selected={selectedTab === "danh-sach"}
          variant={selectedTab === "danh-sach" ? "default" : "ghost"}
          className="min-h-11"
          onClick={() => changeTab("danh-sach")}
        >
          <Users className="mr-2 h-4 w-4" />Danh sách giáo viên
        </Button>
        <Button
          type="button"
          role="tab"
          aria-selected={selectedTab === "phan-cong"}
          variant={selectedTab === "phan-cong" ? "default" : "ghost"}
          className="min-h-11"
          onClick={() => changeTab("phan-cong")}
        >
          <ClipboardList className="mr-2 h-4 w-4" />Phân công giảng dạy
        </Button>
      </div>

      <div role="tabpanel">
        {selectedTab === "phan-cong"
          ? <PhanCongClient {...phanCongProps} />
          : <TaiKhoanClient {...taiKhoanProps} />}
      </div>
    </div>
  );
}
