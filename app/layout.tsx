import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 1. SETTING METADATA (JUDUL & PWA)
export const metadata: Metadata = {
  title: "Djitoe Mesindo System",
  description: "Sistem Pelacakan Mesin & Internal",
  
  // Panggil file manifest yang sudah kamu buat
  manifest: "/manifest.json",
  
  // Konfigurasi Khusus iPhone (Agar Full Screen & Rapi)
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Djitoe Track",
  },
};

// 2. SETTING VIEWPORT (Agar Terasa Seperti Aplikasi Native)
// Ini dipisah dari metadata di Next.js versi baru
export const viewport: Viewport = {
  themeColor: "#2563eb", // Warna tema browser (Biru Djitoe)
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Mencegah user zoom-in/out (biar fix kayak aplikasi)
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}