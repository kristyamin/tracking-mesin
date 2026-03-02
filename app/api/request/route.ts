import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Mengambil kunci rumah Supabase dari brankas Vercel/env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    // 1. Terima paketan data dari form customer
    const data = await request.json();

    // 2. Masukkan ke laci "service_requests" di Supabase
    const { error } = await supabase
      .from('service_requests')
      .insert([
        {
          customer_name: data.customer_name,
          whatsapp_number: data.whatsapp_number,
          request_type: data.request_type,
          preferred_date: data.preferred_date,
          description: data.description,
          // Catatan: Kolom 'status' dan 'created_at' otomatis diisi sama Supabase!
        }
      ]);

    // 3. Kalau Supabase nolak atau error
    if (error) {
      console.error("❌ Gagal insert ke Supabase:", error);
      return NextResponse.json({ error: "Gagal menyimpan data" }, { status: 500 });
    }

    // 4. Kalau sukses masuk database! 🎉
    return NextResponse.json({ success: true, message: "Request berhasil dikirim!" }, { status: 200 });

  } catch (error: any) {
    // Kalau ada error sistem yang nggak terduga
    console.error("💥 Server error:", error.message);
    return NextResponse.json({ error: "Kesalahan Sistem Internal" }, { status: 500 });
  }
}