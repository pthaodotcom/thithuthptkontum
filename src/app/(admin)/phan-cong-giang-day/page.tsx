import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PhanCongGiangDayPage() {
  redirect("/tai-khoan?loai=GiaoVien&tab=phan-cong");
}
