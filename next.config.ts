import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',  // <--- WAJIB: Agar bisa jadi aplikasi HP (Offline mode)
  images: {
    unoptimized: true, // <--- WAJIB: Agar gambar Supabase muncul di HP
  },
};

export default nextConfig;