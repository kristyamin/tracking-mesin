import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 1. TAMBAHAN BARU: Tangkap "scheduled_date" dari Frontend
    const { id, action, mechanic_name, mechanic_nik, assigned_at, completed_at, scheduled_date } = body;

    let updateData: any = {};

    if (action === 'assign') {
      updateData = {
        status: 'In Progress', // Status diubah, tapi di Frontend nanti difilter jadi 'Antrian'
        mechanic_name: mechanic_name,
        mechanic_nik: mechanic_nik,
        // 2. TAMBAHAN BARU: Simpan Tanggal Jadwal
        scheduled_date: scheduled_date ? new Date(scheduled_date).toISOString() : null,
        assigned_at: new Date().toISOString(),
      };
    } else if (action === 'complete') {
      updateData = {
        status: 'Done',
        completed_at: new Date().toISOString(),
      };
    } else if (action === 'edit_time') {
      // 3. TAMBAHAN BARU: Update Tanggal Jadwal, Waktu Selesai, dan Edit Mekanik!
      updateData = {
        scheduled_date: scheduled_date ? new Date(scheduled_date).toISOString() : null,
        completed_at: completed_at ? new Date(completed_at).toISOString() : null,
        mechanic_name: mechanic_name,
        mechanic_nik: mechanic_nik,
      };
    }

    const { error } = await supabase
      .from('service_requests') // Pastikan nama tabel ini sesuai dengan database kamu
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true, message: "Berhasil diupdate!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}