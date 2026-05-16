import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  console.log("====================================");
  console.log("🔐 API LOGIN: Mencoba Masuk...");
  
  try {
    const body = await request.json();
    // 1. TANGKAP KODE RAHASIA DARI FRONTEND
    const { username, password, portal } = body;
    
    // 2. TENTUKAN TABEL (Pintu Pintar)
    // Kalau dari Gembok Slide 2 (gatepass), cek tabel users_gp. Selain itu cek tabel users.
    const tableName = portal === "gatepass" ? "users_gp" : "users";

    console.log(`👤 Username: ${username} | 🏢 Tabel Jalur: ${tableName}`);

    // 3. Cek username & password di tabel yang sesuai
    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .eq("username", username)
      .eq("password", password)
      .single();

    if (error || !data) {
      console.log(`❌ LOGIN GAGAL: User tidak ditemukan di tabel ${tableName}.`);
      return NextResponse.json({ error: 'Username atau Password salah' }, { status: 401 });
    }

    console.log("✅ USER DITEMUKAN:", data.role);

    // 4. LOGIKA RESET BULANAN
    const lastSeenDate = data.last_seen ? new Date(data.last_seen) : new Date(0);
    const today = new Date();
    const isSameMonth = lastSeenDate.getMonth() === today.getMonth() && lastSeenDate.getFullYear() === today.getFullYear();
    let newCount = isSameMonth ? (data.login_count || 0) + 1 : 1;

    // 5. UPDATE STATS (Pastikan updatenya ke tabel yang bener juga)
    try {
        await supabase.from(tableName).update({
            login_count: newCount,
            last_seen: new Date().toISOString()
        }).eq("id", data.id);
        console.log(`📊 Statistik Login Berhasil Diupdate di ${tableName}.`);
    } catch (updErr) {
        console.log("⚠️ Gagal Update Statistik (tapi login lanjut):", updErr);
    }

    const { password: _, ...safeData } = data; 
    console.log("🚀 LOGIN SUKSES!");
    return NextResponse.json({ data: safeData });
    
  } catch (error: any) {
    console.log("💥 CRITICAL ERROR DI SERVER:", error.message);
    return NextResponse.json({ error: 'Kesalahan Sistem Internal' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "🚀 JALUR TRACKING & GATEPASS SIAP MELUNCUR!" });
}