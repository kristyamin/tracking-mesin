import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { id } = await request.json();
    
    const { error } = await supabase
      .from('service_requests')
      .delete()
      .eq('id', id); // Hapus data yang ID-nya cocok

    if (error) throw error;
    return NextResponse.json({ success: true, message: "Data berhasil dihapus!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}