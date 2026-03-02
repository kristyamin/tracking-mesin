import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  console.log("==== CCTV API MULAI ====");
  console.log("1. Cek Kunci Rahasia:", supabaseServiceKey ? "KUNCI ADA ✅" : "KUNCI KOSONG ❌");
  
  try {
    const { data, error } = await supabase
      .from('service_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("2. ERROR DARI SUPABASE ❌:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("3. DATA DARI SUPABASE ✅:", data);
    console.log("==== CCTV API SELESAI ====");
    
    return NextResponse.json({ data: data }, { status: 200 });

  } catch (error: any) {
    console.error("💥 Server error:", error.message);
    return NextResponse.json({ error: "Kesalahan Sistem" }, { status: 500 });
  }
}