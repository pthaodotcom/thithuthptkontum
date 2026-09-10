import { describe, expect, it } from "vitest";

import { swaggerDangBat } from "@/lib/openapi/access";
import { openapiDocument } from "@/lib/openapi/document";

const businessOperations = [
  "GET /api/audit-log",
  "POST /api/auth/dang-nhap",
  "POST /api/auth/dang-xuat",
  "POST /api/auth/doi-mat-khau",
  "GET /api/auth/google/callback",
  "GET /api/auth/google/connect",
  "POST /api/bai-thi/autosave",
  "POST /api/bai-thi/nop-bai",
  "POST /api/bai-thi/vao-thi",
  "POST /api/bai-thi/vi-pham",
  "GET /api/bao-cao/tuy-chon",
  "GET /api/bao-cao/xuat",
  "GET /api/cau-hoi/mau-import",
  "GET /api/cron/kiem-tra-san-sang",
  "GET /api/cron/xu-ly-hang-doi",
  "GET /api/email-preview/{baiLamId}",
  "GET /api/giam-sat",
  "GET /api/giam-sat/realtime-token",
].sort();

describe("OpenAPI document", () => {
  it("mô tả đủ 18 API nghiệp vụ hiện có", () => {
    const operations = Object.entries(openapiDocument.paths)
      .flatMap(([path, methods]) => Object.keys(methods)
        .filter((method) => method !== "parameters")
        .map((method) => `${method.toUpperCase()} ${path}`))
      .filter((operation) => operation !== "GET /api/openapi")
      .sort();

    expect(operations).toEqual(businessOperations);
  });

  it("khai báo đúng hai cơ chế xác thực", () => {
    expect(openapiDocument.openapi).toBe("3.0.3");
    expect(openapiDocument.components.securitySchemes.cookieAuth).toMatchObject({
      type: "apiKey",
      in: "cookie",
      name: "session",
    });
    expect(openapiDocument.components.securitySchemes.cronBearer).toMatchObject({
      type: "http",
      scheme: "bearer",
    });
  });

  it("đánh dấu idempotency-key là bắt buộc cho lưu và nộp bài", () => {
    const autosave = openapiDocument.paths["/api/bai-thi/autosave"].post.parameters;
    const submit = openapiDocument.paths["/api/bai-thi/nop-bai"].post.parameters;

    expect(autosave).toEqual([{ $ref: "#/components/parameters/IdempotencyKey" }]);
    expect(submit).toEqual([{ $ref: "#/components/parameters/IdempotencyKey" }]);
    expect(openapiDocument.components.parameters.IdempotencyKey.required).toBe(true);
  });

  it("không chứa tham chiếu OpenAPI bị thiếu", () => {
    const refs = JSON.stringify(openapiDocument).match(/#\/components\/(?:schemas|parameters)\/[^"}]+/g) ?? [];
    const document = openapiDocument as unknown as Record<string, unknown>;

    for (const ref of new Set(refs)) {
      const value = ref.slice(2).split("/").reduce<unknown>((current, key) => {
        if (!current || typeof current !== "object") return undefined;
        return (current as Record<string, unknown>)[key];
      }, document);
      expect(value, `Không tìm thấy ${ref}`).toBeDefined();
    }
  });

  it("chỉ tự động công khai Swagger ở local và UAT preview", () => {
    const current = process.env.VERCEL_ENV;
    const enabled = process.env.SWAGGER_ENABLED;
    try {
      process.env.VERCEL_ENV = "preview";
      delete process.env.SWAGGER_ENABLED;
      expect(swaggerDangBat()).toBe(true);

      process.env.VERCEL_ENV = "production";
      expect(swaggerDangBat()).toBe(false);

      process.env.SWAGGER_ENABLED = "true";
      expect(swaggerDangBat()).toBe(true);
    } finally {
      if (current === undefined) delete process.env.VERCEL_ENV;
      else process.env.VERCEL_ENV = current;
      if (enabled === undefined) delete process.env.SWAGGER_ENABLED;
      else process.env.SWAGGER_ENABLED = enabled;
    }
  });
});
