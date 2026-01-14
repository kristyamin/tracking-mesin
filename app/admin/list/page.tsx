"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function ListMesinPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Ambil data saat halaman dibuka
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    // Ambil semua data, urutkan dari yang terbaru (created_at desc)
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) alert("Gagal ambil data: " + error.message);
    else setProjects(data || []);
    setLoading(false);
  };

  // --- FUNGSI HAPUS SAMPAI KE AKAR (FOTO + LOG + DATA) ---
  const handleDelete = async (id_pesanan: string) => {
    if (!confirm(`⚠️ PERINGATAN KERAS!\n\nYakin hapus mesin ID: ${id_pesanan}?\nFoto dan History juga akan dihapus permanen.`)) return;
    
    try {
      // 1. AMBIL DATA DULU (Untuk cari nama fotonya)
      const { data: projectData, error: fetchError } = await supabase
        .from("projects")
        .select("foto_url")
        .eq("id_pesanan", id_pesanan)
        .single();

      if (fetchError) throw fetchError;

      // 2. HAPUS FOTO DI STORAGE (Jika ada)
      if (projectData?.foto_url) {
        // Trik mengambil nama file dari URL lengkap
        // Contoh: .../mesin-images/ID-123.jpg -> Kita ambil "ID-123.jpg"
        const fileName = projectData.foto_url.split("/").pop();
        
        if (fileName) {
          const { error: storageError } = await supabase.storage
            .from("mesin-images")
            .remove([fileName]);
          
          if (storageError) console.error("Gagal hapus foto:", storageError);
        }
      }

      // 3. HAPUS LOG HISTORY (Supaya bersih total)
      await supabase.from("project_logs").delete().eq("id_pesanan", id_pesanan);

      // 4. HAPUS DATA UTAMA
      const { error: deleteError } = await supabase
        .from("projects")
        .delete()
        .eq("id_pesanan", id_pesanan);

      if (deleteError) throw deleteError;

      alert("✅ BERSIH! Data, Foto, dan History berhasil dihapus.");
      
      // Refresh list agar data yang dihapus hilang dari layar
      fetchProjects();

    } catch (err: any) {
      alert("Gagal menghapus: " + err.message);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Header & Tombol Kembali */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-black text-slate-800 uppercase">📋 Daftar Mesin</h1>
          <button 
            onClick={() => router.push("/admin")} 
            className="bg-white text-slate-600 font-bold py-2 px-4 rounded-xl shadow border border-slate-200 hover:bg-slate-50 transition"
          >
            ⬅️ Kembali ke Admin
          </button>
        </div>

        {/* Loading State */}
        {loading && <p className="text-center font-bold text-slate-400 animate-pulse">Sedang memuat data...</p>}

        {/* Kosong State */}
        {!loading && projects.length === 0 && (
          <div className="text-center p-10 bg-white rounded-2xl shadow">
            <p className="text-slate-400 font-bold">Belum ada data mesin.</p>
          </div>
        )}

        {/* List Card */}
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((item) => (
            <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition relative">
              
              {/* Badge Status di Pojok */}
              <div className={`absolute top-4 right-4 text-xs font-bold px-2 py-1 rounded-lg ${item.progress === 100 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {item.progress}% - {item.status_pengiriman || "Proses"}
              </div>

              <h2 className="text-lg font-black text-slate-800 mb-1">{item.nama_mesin}</h2>
              <p className="text-xs font-bold text-blue-600 mb-4 bg-blue-50 inline-block px-2 py-1 rounded">ID: {item.id_pesanan}</p>
              
              <div className="space-y-2 text-sm text-slate-600 font-medium">
                <p>👤 Cust: <span className="font-bold text-slate-800">{item.customer}</span></p>
                <p>🔧 Mekanik: <span className="font-bold text-slate-800">{item.mekanik || "-"}</span></p>
                <p>📅 Update: <span className="text-xs text-slate-400">{new Date(item.last_updated || item.created_at).toLocaleDateString()}</span></p>
              </div>

              {/* Tombol Hapus Kecil */}
              <button 
                onClick={() => handleDelete(item.id_pesanan)}
                className="mt-4 text-xs font-bold text-red-400 hover:text-red-600 border border-red-100 hover:bg-red-50 hover:border-red-200 px-3 py-2 rounded-lg transition w-full text-center"
              >
                🗑️ Hapus Permanen
              </button>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}