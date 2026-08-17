"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ContactRound,
  LoaderCircle,
  LockKeyhole,
  PencilLine,
  Save,
  UserRound,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { capNhatThongTinCaNhan, type ThongTinCaNhanInput } from "./actions";

type FieldName = keyof ThongTinCaNhanInput;
type FieldErrors = Partial<Record<FieldName, string>>;

type Props = {
  initialData: ThongTinCaNhanInput;
  laHocSinh: boolean;
  sdtZaloPhuHuynh?: string;
  emailPhuHuynh?: string;
};

const ngayHienTai = new Date().toISOString().slice(0, 10);

function laNgayHopLe(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parts = value.split("-").map(Number);
  const nam = parts[0];
  const thang = parts[1];
  const ngay = parts[2];
  if (nam === undefined || thang === undefined || ngay === undefined) return false;
  const parsed = new Date(Date.UTC(nam, thang - 1, ngay));
  return parsed.getUTCFullYear() === nam && parsed.getUTCMonth() === thang - 1 && parsed.getUTCDate() === ngay;
}

function validateField(name: FieldName, value: string | number) {
  const text = String(value).trim();
  if (name === "ho_ten") {
    if (!text) return "Họ và tên không được để trống";
    if (text.length > 100) return "Họ và tên tối đa 100 ký tự";
  }
  if (name === "ngay_sinh" && text) {
    if (!laNgayHopLe(text) || text < "1900-01-01" || text > ngayHienTai) {
      return "Ngày sinh không hợp lệ hoặc nằm ngoài khoảng cho phép";
    }
  }
  if (name === "email_ca_nhan") {
    if (text && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
      return "Email cá nhân không hợp lệ";
    }
  }
  if (name === "so_dien_thoai") {
    const soDienThoai = text.replace(/[\s.-]/g, "");
    if (soDienThoai && !/^\+?[0-9]{9,15}$/.test(soDienThoai)) {
      return "Số điện thoại phải có từ 9 đến 15 chữ số";
    }
  }
  if (name === "dia_chi" && text.length > 255) return "Địa chỉ tối đa 255 ký tự";
  return "";
}

export function ChinhSuaThongTinCaNhan({
  initialData,
  laHocSinh,
  sdtZaloPhuHuynh = "",
  emailPhuHuynh = "",
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<ThongTinCaNhanInput>(initialData);
  const [errors, setErrors] = useState<FieldErrors>({});

  const moBieuMau = () => {
    setForm(initialData);
    setErrors({});
    setOpen(true);
  };

  const setField = (name: FieldName, value: string | number) => {
    setForm((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const focusField = (name?: FieldName) => {
    if (name) requestAnimationFrame(() => document.getElementById(name)?.focus());
  };

  const validate = () => {
    const fields: FieldName[] = [
      "ho_ten",
      "ngay_sinh",
      "gioi_tinh",
      "email_ca_nhan",
      "so_dien_thoai",
      "dia_chi",
    ];
    const nextErrors = fields.reduce<FieldErrors>((result, field) => {
      const error = validateField(field, form[field]);
      if (error) result[field] = error;
      return result;
    }, {});
    setErrors(nextErrors);
    focusField(fields.find((field) => nextErrors[field]));
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const result = await capNhatThongTinCaNhan(form);
    setLoading(false);

    if (!result.success) {
      if (result.field) {
        setErrors((current) => ({ ...current, [result.field!]: result.error }));
        focusField(result.field);
      }
      toast.error(result.error);
      return;
    }

    setOpen(false);
    toast.success("Đã cập nhật hồ sơ cá nhân");
    router.refresh();
  };

  const blurField = (name: FieldName) => {
    const error = validateField(name, form[name]);
    setErrors((current) => ({ ...current, [name]: error || undefined }));
  };
  const errorId = (name: FieldName) => `${name}-error`;
  const helperId = (name: FieldName) => `${name}-helper`;
  const daThayDoi = JSON.stringify(form) !== JSON.stringify(initialData);

  return (
    <>
      <Button type="button" variant="outline" className="min-h-11 cursor-pointer" onClick={moBieuMau}>
        <PencilLine aria-hidden="true" />
        Chỉnh sửa hồ sơ
      </Button>

      <Dialog open={open} onOpenChange={(value) => !loading && setOpen(value)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader className="pr-10">
            <DialogTitle>Chỉnh sửa hồ sơ cá nhân</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin cá nhân và liên hệ. Mã đăng nhập, vai trò, lớp, môn và phân công do nhà trường quản lý.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-5" onSubmit={submit} noValidate>
            <fieldset className="space-y-4 rounded-xl border border-border p-4">
              <legend className="px-2 text-sm font-bold text-foreground">
                <span className="inline-flex items-center gap-2">
                  <UserRound className="h-4 w-4 text-primary" aria-hidden="true" />
                  Thông tin cơ bản
                </span>
              </legend>

              <div className="space-y-2">
                <Label htmlFor="ho_ten">Họ và tên</Label>
                <Input
                  id="ho_ten"
                  name="ho_ten"
                  autoComplete="name"
                  maxLength={100}
                  className="min-h-11 text-base sm:text-sm"
                  value={form.ho_ten}
                  aria-invalid={Boolean(errors.ho_ten)}
                  aria-describedby={errors.ho_ten ? errorId("ho_ten") : undefined}
                  onChange={(event) => setField("ho_ten", event.target.value)}
                  onBlur={() => blurField("ho_ten")}
                />
                {errors.ho_ten && <p id={errorId("ho_ten")} role="alert" className="text-sm text-destructive">{errors.ho_ten}</p>}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ngay_sinh">Ngày sinh</Label>
                  <Input
                    id="ngay_sinh"
                    name="ngay_sinh"
                    type="date"
                    min="1900-01-01"
                    max={ngayHienTai}
                    autoComplete="bday"
                    className="min-h-11 text-base sm:text-sm"
                    value={form.ngay_sinh}
                    aria-invalid={Boolean(errors.ngay_sinh)}
                    aria-describedby={errors.ngay_sinh ? errorId("ngay_sinh") : helperId("ngay_sinh")}
                    onChange={(event) => setField("ngay_sinh", event.target.value)}
                    onBlur={() => blurField("ngay_sinh")}
                  />
                  {errors.ngay_sinh ? (
                    <p id={errorId("ngay_sinh")} role="alert" className="text-sm text-destructive">{errors.ngay_sinh}</p>
                  ) : (
                    <p id={helperId("ngay_sinh")} className="text-xs leading-5 text-muted-foreground">
                      {!form.ngay_sinh && form.nam_sinh ? `Hệ thống hiện chỉ có năm sinh ${form.nam_sinh}.` : "Dùng để hoàn thiện hồ sơ cá nhân."}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gioi_tinh">Giới tính</Label>
                  <select
                    id="gioi_tinh"
                    name="gioi_tinh"
                    className="min-h-11 w-full rounded-lg border border-input bg-background px-3 text-base text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 sm:text-sm"
                    value={form.gioi_tinh}
                    onChange={(event) => setField("gioi_tinh", event.target.value)}
                  >
                    <option value="">Chưa cập nhật</option>
                    <option value="Nam">Nam</option>
                    <option value="Nu">Nữ</option>
                    <option value="Khac">Khác</option>
                  </select>
                </div>
              </div>
            </fieldset>

            <fieldset className="space-y-4 rounded-xl border border-border p-4">
              <legend className="px-2 text-sm font-bold text-foreground">
                <span className="inline-flex items-center gap-2">
                  <ContactRound className="h-4 w-4 text-accent" aria-hidden="true" />
                  Thông tin liên hệ
                </span>
              </legend>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email_ca_nhan">Email cá nhân</Label>
                  <Input
                    id="email_ca_nhan"
                    name="email_ca_nhan"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="ten@example.com"
                    maxLength={254}
                    className="min-h-11 text-base sm:text-sm"
                    value={form.email_ca_nhan}
                    aria-invalid={Boolean(errors.email_ca_nhan)}
                    aria-describedby={errors.email_ca_nhan ? errorId("email_ca_nhan") : undefined}
                    onChange={(event) => setField("email_ca_nhan", event.target.value)}
                    onBlur={() => blurField("email_ca_nhan")}
                  />
                  {errors.email_ca_nhan && <p id={errorId("email_ca_nhan")} role="alert" className="text-sm text-destructive">{errors.email_ca_nhan}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="so_dien_thoai">Số điện thoại cá nhân</Label>
                  <Input
                    id="so_dien_thoai"
                    name="so_dien_thoai"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="Ví dụ: 0912345678"
                    className="min-h-11 text-base sm:text-sm"
                    value={form.so_dien_thoai}
                    aria-invalid={Boolean(errors.so_dien_thoai)}
                    aria-describedby={errors.so_dien_thoai ? errorId("so_dien_thoai") : undefined}
                    onChange={(event) => setField("so_dien_thoai", event.target.value)}
                    onBlur={() => blurField("so_dien_thoai")}
                  />
                  {errors.so_dien_thoai && <p id={errorId("so_dien_thoai")} role="alert" className="text-sm text-destructive">{errors.so_dien_thoai}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dia_chi">Địa chỉ</Label>
                <textarea
                  id="dia_chi"
                  name="dia_chi"
                  rows={3}
                  maxLength={255}
                  autoComplete="street-address"
                  className="min-h-20 w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 sm:text-sm"
                  placeholder="Nhập địa chỉ liên hệ"
                  value={form.dia_chi}
                  aria-invalid={Boolean(errors.dia_chi)}
                  aria-describedby={errors.dia_chi ? errorId("dia_chi") : helperId("dia_chi")}
                  onChange={(event) => setField("dia_chi", event.target.value)}
                  onBlur={() => blurField("dia_chi")}
                />
                {errors.dia_chi ? (
                  <p id={errorId("dia_chi")} role="alert" className="text-sm text-destructive">{errors.dia_chi}</p>
                ) : (
                  <p id={helperId("dia_chi")} className="text-right text-xs text-muted-foreground">{String(form.dia_chi).length}/255 ký tự</p>
                )}
              </div>
            </fieldset>

            {laHocSinh && (
              <fieldset className="space-y-4 rounded-xl border border-border p-4">
                <legend className="px-2 text-sm font-bold text-foreground">
                  <span className="inline-flex items-center gap-2">
                    <UsersRound className="h-4 w-4 text-accent" aria-hidden="true" />
                    Liên hệ phụ huynh
                  </span>
                </legend>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="sdt_zalo_phu_huynh">SĐT Zalo phụ huynh</Label>
                    <div className="relative">
                      <Input
                        id="sdt_zalo_phu_huynh"
                        type="tel"
                        readOnly
                        aria-readonly="true"
                        className="min-h-11 bg-muted/70 pr-10 text-base text-muted-foreground sm:text-sm"
                        value={sdtZaloPhuHuynh || "Chưa cập nhật"}
                      />
                      <LockKeyhole className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <p className="text-xs leading-5 text-muted-foreground">
                      Học sinh không được tự sửa. Vui lòng liên hệ quản trị viên khi cần thay đổi.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email_phu_huynh">Email phụ huynh</Label>
                    <div className="relative">
                      <Input
                        id="email_phu_huynh"
                        type="email"
                        readOnly
                        aria-readonly="true"
                        className="min-h-11 bg-muted/70 pr-10 text-base text-muted-foreground sm:text-sm"
                        value={emailPhuHuynh || "Chưa cập nhật"}
                      />
                      <LockKeyhole className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <p className="text-xs leading-5 text-muted-foreground">
                      Học sinh không được tự sửa. Vui lòng liên hệ quản trị viên khi cần thay đổi.
                    </p>
                  </div>
                </div>
              </fieldset>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" className="min-h-11 cursor-pointer" disabled={loading} onClick={() => setOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" className="min-h-11 cursor-pointer" disabled={loading || !daThayDoi}>
                {loading ? <LoaderCircle className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Save aria-hidden="true" />}
                {loading ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
