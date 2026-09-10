/** Swagger public tren local/UAT preview; production chi mo khi bat ro rang. */
export function swaggerDangBat() {
  return process.env.VERCEL_ENV !== "production" || process.env.SWAGGER_ENABLED === "true";
}

