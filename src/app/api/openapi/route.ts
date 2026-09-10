import { swaggerDangBat } from "@/lib/openapi/access";
import { openapiDocument } from "@/lib/openapi/document";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!swaggerDangBat()) {
    return Response.json({ code: "KHONG_TIM_THAY", message: "Không tìm thấy tài liệu API." }, {
      status: 404,
    });
  }

  return Response.json(openapiDocument, {
    headers: { "Cache-Control": "public, max-age=300" },
  });
}
