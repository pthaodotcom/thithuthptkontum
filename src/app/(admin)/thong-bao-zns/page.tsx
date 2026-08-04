/** Redirect tương thích cho bookmark cũ trước khi thông báo chuyển sang Gmail. */
import { redirect } from "next/navigation";
export default function ThongBaoZnsPage() { redirect("/thong-bao-email"); }
