import type { NextConfig } from "next";
import path from "path";

/**
 * Cau hinh Next.js cho webapp Thi thu THPT.
 * - Khong dat secret o day; moi secret (SUPABASE_JWT_SECRET, GEMINI_API_KEY, ZALO_*)
 *   nam trong bien moi truong server-side, xem .env.example.
 */
const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(__dirname),
  reactStrictMode: true,
  experimental: {
    serverActions: {
      // Bai lam thi co the gui payload lon (nhieu cau hoi Phan I/II/III cung luc)
      // Import cau hoi Excel/Word gioi han 10 MB tai Server Action.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
