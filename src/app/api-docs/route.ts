import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { swaggerDangBat } from "@/lib/openapi/access";

export const dynamic = "force-dynamic";

const html = `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Swagger UI | Thi thử THPT</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      html { box-sizing: border-box; overflow-y: scroll; }
      *, *::before, *::after { box-sizing: inherit; }
      body { margin: 0; background: #f7f8fa; }
      .topbar { display: none; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: "/api/openapi",
        dom_id: "#swagger-ui",
        deepLinking: true,
        displayRequestDuration: true,
        persistAuthorization: false,
        requestInterceptor: function (request) {
          request.credentials = "same-origin";
          return request;
        }
      });
    </script>
  </body>
</html>`;

export async function GET(_request: NextRequest) {
  if (!swaggerDangBat()) {
    return NextResponse.json(
      { code: "KHONG_TIM_THAY", message: "Không tìm thấy tài liệu API." },
      { status: 404 },
    );
  }

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "Content-Security-Policy":
        "default-src 'self'; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; " +
        "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' data: https:; connect-src 'self'",
    },
  });
}
