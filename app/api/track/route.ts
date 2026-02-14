import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // 1. Cek username & password ke database secara aman di Server
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .eq("password", password)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Username atau Password salah' }, { status: 401 });
    }

    // 2. LOGIKA RESET BULANAN (Dipindah ke server biar aman)
    const lastSeenDate = data.last_seen ? new Date(data.last_seen) : new Date(0);
    const today = new Date();
    
    const isSameMonth = lastSeenDate.getMonth() === today.getMonth() && lastSeenDate.getFullYear() === today.getFullYear();
    
    let newCount;
    if (isSameMonth) {
        newCount = (data.login_count || 0) + 1;
    } else {
        newCount = 1;
    }

    // Update ke Database
    await supabase.from("users").update({
        login_count: newCount,
        last_seen: new Date().toISOString()
    }).eq("id", data.id);

    // 3. Kembalikan data (Kita buang passwordnya biar nggak bocor ke depan)
    const { password: _, ...safeData } = data; 
    
    return NextResponse.json({ data: safeData });
    
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}