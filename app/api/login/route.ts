import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  console.log("====================================");
  console.log("🔐 API LOGIN: Mencoba Masuk...");
  
  try {
    const body = await request.json();
    const { username, password } = body;
    console.log("👤 Username:", username);

    // 1. Cek username & password
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .eq("password", password)
      .single();

    if (error || !data) {
      console.log("❌ LOGIN GAGAL: User tidak ditemukan atau salah password.");
      return NextResponse.json({ error: 'Username atau Password salah' }, { status: 401 });
    }

    console.log("✅ USER DITEMUKAN:", data.role);

    // 2. LOGIKA RESET BULANAN
    const lastSeenDate = data.last_seen ? new Date(data.last_seen) : new Date(0);
    const today = new Date();
    const isSameMonth = lastSeenDate.getMonth() === today.getMonth() && lastSeenDate.getFullYear() === today.getFullYear();
    let newCount = isSameMonth ? (data.login_count || 0) + 1 : 1;

    // 3. UPDATE STATS (Jika ini error, login tetap harus jalan)
    try {
        await supabase.from("users").update({
            login_count: newCount,
            last_seen: new Date().toISOString()
        }).eq("id", data.id);
        console.log("📊 Statistik Login Berhasil Diupdate.");
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
  return NextResponse.json({ status: "🚀 JALUR TRACKING SIAP MELUNCUR!" });
}