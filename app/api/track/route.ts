import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { order_id } = body; // Mencari berdasarkan ID Pesanan

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("order_id", order_id);

    if (error) throw error;

    return NextResponse.json({ data });
    
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 });
  }
}
// fix