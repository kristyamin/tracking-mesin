"use client";

import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("input"); // input | update | boss
  const [loading, setLoading] = useState(false);

  // --- REFS (Remote Control untuk mereset Input File) ---
  const refInputFile = useRef<HTMLInputElement>(null);
  const refUpdateFile = useRef<HTMLInputElement>(null);
  const refBossFile = useRef<HTMLInputElement>(null);

  // --- STATE 1: INPUT BARU ---
  const [formInput, setFormInput] = useState({
    id: "",
    nama: "",
    customer: "",
    mekanik: "",
    foto: null as File | null,
  });

  // --- STATE 2: UPDATE CUSTOMER ---
  const [formUpdate, setFormUpdate] = useState({
    id_cari: "",
    progress: 0,
    status: "Dalam Proses",
    deskripsi: "",
    foto: null as File | null,
  });

  // --- STATE 3: LAPORAN BOSS ---
  const [formBoss, setFormBoss] = useState({
    id_cari: "",
    progress: 0,
    laporan: "",
    foto: null as File | null,
  });

  // ==========================================
  // HELPER: UPLOAD KE SUPABASE
  // ==========================================
  const uploadToSupabase = async (file: File, idPesanan: string) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${idPesanan}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Upload
    const { error: uploadError } = await supabase.storage
      .from("mesin-images")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Ambil Link Publik
    const { data } = supabase.storage.from("mesin-images").getPublicUrl(filePath);
    return data.publicUrl;
  };

  // ==========================================
  // 1. LOGIKA INPUT MESIN BARU
  // ==========================================
  const handleInputBaru = async () => {
    if (!formInput.id || !formInput.nama) return alert("⚠️ Wajib isi ID & Nama Mesin!");
    setLoading(true);

    try {
      // Cek ID Kembar
      const { data: existing } = await supabase.from("projects").select("id").eq("id_pesanan", formInput.id).single();
      if (existing) { alert("❌ ID Pesanan SUDAH ADA."); setLoading(false); return; }

      let fotoUrl = null;
      if (formInput.foto) {
        fotoUrl = await uploadToSupabase(formInput.foto, formInput.id);
      }

      const { error } = await supabase.from("projects").insert({
        id_pesanan: formInput.id,
        nama_mesin: formInput.nama,
        customer: formInput.customer,
        mekanik: formInput.mekanik,
        progress: 0,
        status_pengiriman: "Dalam Proses",
        foto_url: fotoUrl,
        last_updated: new Date().toISOString(),
      });

      if (error) throw error;

      alert("✅ Mesin Baru Berhasil Didaftarkan!");
      // Reset Form
      setFormInput({ id: "", nama: "", customer: "", mekanik: "", foto: null });
      if (refInputFile.current) refInputFile.current.value = ""; 

    } catch (err: any) {
      alert("Gagal: " + err.message);
    }
    setLoading(false);
  };

  // ==========================================
  // 2. LOGIKA UPDATE CUSTOMER (DENGAN LOGIKA STATUS BARU)
  // ==========================================
  
  // Fungsi Pintar: Mengatur Status Otomatis saat Slider Digeser
  const handleProgressChange = (val: number) => {
    let statusOtomatis = formUpdate.status;

    // Logika Otomatis saat < 100%
    if (val < 75) statusOtomatis = "Dalam Proses";
    else if (val < 100) statusOtomatis = "Checking Quality";
    
    // Logika saat menyentuh 100% pertama kali (jika sebelumnya status otomatis)
    else if (val === 100 && (formUpdate.status === "Dalam Proses" || formUpdate.status === "Checking Quality")) {
        statusOtomatis = "Siap Dikirim"; // Default awal saat baru mentok 100%
    }

    setFormUpdate({ ...formUpdate, progress: val, status: statusOtomatis });
  };

  const cariDataUpdate = async () => {
    if (!formUpdate.id_cari) return alert("Masukkan ID dulu!");
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id_pesanan", formUpdate.id_cari)
      .single();

    if (error || !data) {
      alert("❌ Data tidak ditemukan!");
    } else {
      setFormUpdate({
        ...formUpdate,
        progress: data.progress,
        status: data.status_pengiriman || "Dalam Proses",
      });
    }
    setLoading(false);
  };

  const handleUpdateCustomer = async () => {
    if (!formUpdate.id_cari) return alert("Cari ID dulu!");
    setLoading(true);

    try {
      let fotoUrl = null;
      if (formUpdate.foto) {
        fotoUrl = await uploadToSupabase(formUpdate.foto, formUpdate.id_cari);
      }

      // Menggunakan status langsung dari pilihan Admin (karena sudah diatur via slider/dropdown)
      const statusFinal = formUpdate.status;

      const updatePayload: any = {
        progress: formUpdate.progress,
        status_pengiriman: statusFinal,
        last_updated: new Date().toISOString(),
      };
  
      if (formUpdate.deskripsi) {
         updatePayload.deskripsi_progress = formUpdate.deskripsi;
      }
      
      if (fotoUrl) updatePayload.foto_url = fotoUrl;

      // Update HANYA Tabel Utama (Projects)
      const { error } = await supabase
        .from("projects")
        .update(updatePayload)
        .eq("id_pesanan", formUpdate.id_cari);

      if (error) throw error;
      
      alert("✅ Data Customer Terupdate!");
      
      setFormUpdate((prev) => ({ ...prev, deskripsi: "", foto: null }));
      if (refUpdateFile.current) refUpdateFile.current.value = "";
    } catch (err: any) {
      alert("Gagal: " + err.message);
    }
    setLoading(false);
  };

  // Hapus Data
  const handleDelete = async () => {
    if (!confirm("⚠️ YAKIN HAPUS PERMANEN? Data & Foto akan hilang.")) return;
    setLoading(true);
    const id = formUpdate.id_cari;

    // Ambil info foto lama untuk dihapus
    const { data } = await supabase.from("projects").select("foto_url").eq("id_pesanan", id).single();
    if (data?.foto_url) {
        const namaFile = data.foto_url.split("/").pop();
        if(namaFile) await supabase.storage.from("mesin-images").remove([namaFile]);
    }

    await supabase.from("project_logs").delete().eq("id_pesanan", id);
    const { error } = await supabase.from("projects").delete().eq("id_pesanan", id);

    if (error) alert("Gagal hapus: " + error.message);
    else {
      alert("✅ Data Terhapus Bersih.");
      setFormUpdate({ id_cari: "", progress: 0, status: "Dalam Proses", deskripsi: "", foto: null });
      if (refUpdateFile.current) refUpdateFile.current.value = "";
    }
    setLoading(false);
  };

  // ==========================================
  // 3. LOGIKA LAPORAN BOSS
  // ==========================================
  const cariDataBoss = async () => {
    if (!formBoss.id_cari) return alert("Masukkan ID!");
    setLoading(true);
    const { data } = await supabase.from("projects").select("progress").eq("id_pesanan", formBoss.id_cari).single();
    if (data) setFormBoss((prev) => ({ ...prev, progress: data.progress }));
    else alert("❌ ID Tidak Ditemukan");
    setLoading(false);
  };

  const handleLaporanBoss = async () => {
    if (!formBoss.id_cari || !formBoss.laporan) return alert("Isi ID & Laporan!");
    setLoading(true);

    try {
      let fotoUrl = null;
      if (formBoss.foto) {
        fotoUrl = await uploadToSupabase(formBoss.foto, formBoss.id_cari);
      }

      // Update Tabel Utama
      const payload: any = { progress: formBoss.progress, last_updated: new Date().toISOString() };
      if (fotoUrl) payload.foto_url = fotoUrl;

      await supabase.from("projects").update(payload).eq("id_pesanan", formBoss.id_cari);

      // Insert ke Log (Hanya di sini log ditambahkan)
      await supabase.from("project_logs").insert({
        id_pesanan: formBoss.id_cari,
        pesan_update: ` ${formBoss.laporan}`,
        progress_log: formBoss.progress,
      });

      alert("✅ Laporan Boss Terkirim!");
      setFormBoss({ id_cari: "", progress: 0, laporan: "", foto: null });
      if (refBossFile.current) refBossFile.current.value = "";
    } catch (err: any) {
      alert("Gagal: " + err.message);
    }
    setLoading(false);
  };

  // ==========================================
  // TAMPILAN (UI)
  // ==========================================
  return (
    <main className="min-h-screen bg-slate-100 p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Header & Menu Utama Button */}
        <div className="flex justify-between items-center mb-8 relative">
            
            {/* Tombol Kiri: LIHAT LIST */}
            <button onClick={() => router.push("/admin/list")} className="absolute top-0 left-0 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 text-xs font-bold text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition z-10 flex items-center gap-1">
                📋 <span className="hidden sm:inline">List Data</span>
            </button>

            {/* Judul Tengah */}
            <div className="text-center w-full">
                <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Panel Admin</h1>
                <p className="text-slate-500 font-bold text-sm">Pusat Kontrol Produksi</p>
            </div>

            {/* Tombol Kanan: HOME */}
            <button onClick={() => router.push("/")} className="absolute top-0 right-0 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 text-xs font-bold text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition z-10">
                🏠 <span className="hidden sm:inline">Home</span>
            </button>
        </div>

        {/* TAB MENU */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button onClick={() => setActiveTab("input")} className={`py-4 rounded-xl font-black text-xs sm:text-sm transition-all uppercase tracking-wide border-b-4 ${activeTab === "input" ? "bg-blue-600 text-white border-blue-800 shadow-lg scale-[1.02]" : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50"}`}>
            1. Input Baru
          </button>
          <button onClick={() => setActiveTab("update")} className={`py-4 rounded-xl font-black text-xs sm:text-sm transition-all uppercase tracking-wide border-b-4 ${activeTab === "update" ? "bg-yellow-400 text-slate-900 border-yellow-600 shadow-lg scale-[1.02]" : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50"}`}>
            2. Update Cust
          </button>
          <button onClick={() => setActiveTab("boss")} className={`py-4 rounded-xl font-black text-xs sm:text-sm transition-all uppercase tracking-wide border-b-4 ${activeTab === "boss" ? "bg-slate-800 text-white border-black shadow-lg scale-[1.02]" : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50"}`}>
            3. Laporan Boss
          </button>
        </div>

        {/* KONTAINER FORM */}
        <div className="bg-white rounded-[2rem] shadow-xl p-6 sm:p-10 border border-slate-200 min-h-[500px]">
          
          {/* === TAB 1: INPUT BARU === */}
          {activeTab === "input" && (
            <div className="space-y-6 animate-pulse-once">
              <div className="flex items-center gap-3 mb-6 border-b pb-4">
                <span className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl">📝</span>
                <h2 className="text-xl font-black text-blue-900 uppercase">Input Mesin Baru</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-400 ml-1 uppercase">ID Pesanan *</label>
                        <input className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition" 
                        value={formInput.id} onChange={(e) => setFormInput({ ...formInput, id: e.target.value })} placeholder="Contoh: 2026-001" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 ml-1 uppercase">Nama Mesin *</label>
                        <input className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition" 
                        value={formInput.nama} onChange={(e) => setFormInput({ ...formInput, nama: e.target.value })} placeholder="Mesin Linting..." />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 ml-1 uppercase">Customer *</label>
                        <input className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition" 
                        value={formInput.customer} onChange={(e) => setFormInput({ ...formInput, customer: e.target.value })} placeholder="PT..." />
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-400 ml-1 uppercase">Mekanik</label>
                        <input className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition" 
                        value={formInput.mekanik} onChange={(e) => setFormInput({ ...formInput, mekanik: e.target.value })} placeholder="Nama Mekanik" />
                    </div>
                    
                    {/* Upload Foto (Dengan Tombol X) */}
                    <div>
                        <label className="text-xs font-bold text-slate-400 ml-1 uppercase">Upload Foto Awal</label>
                        <div className="flex gap-2 items-center bg-blue-50 p-2 rounded-xl border border-blue-100">
                            <input type="file" ref={refInputFile} accept="image/*"
                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-white file:text-blue-600 hover:file:bg-blue-100 transition"
                            onChange={(e) => e.target.files && setFormInput({...formInput, foto: e.target.files[0]})} />
                            
                            {formInput.foto && (
                                <button onClick={() => { setFormInput({...formInput, foto: null}); if(refInputFile.current) refInputFile.current.value=""; }} 
                                className="bg-red-100 text-red-500 rounded-full w-8 h-8 font-bold hover:bg-red-200 flex-shrink-0">✕</button>
                            )}
                        </div>
                        {formInput.foto && <p className="text-xs text-green-600 font-bold mt-2 ml-1">✅ Foto Terpilih: {formInput.foto.name}</p>}
                    </div>
                </div>
              </div>
              
              <button onClick={handleInputBaru} disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl shadow-lg mt-6 transition disabled:bg-gray-300">
                {loading ? "MENYIMPAN..." : "SIMPAN DATA MESIN"}
              </button>
            </div>
          )}

          {/* === TAB 2: UPDATE CUSTOMER === */}
          {activeTab === "update" && (
            <div className="space-y-6 animate-pulse-once">
               <div className="flex items-center gap-3 mb-6 border-b pb-4">
                <span className="w-10 h-10 bg-yellow-100 text-yellow-700 rounded-full flex items-center justify-center text-xl">📢</span>
                <h2 className="text-xl font-black text-yellow-700 uppercase">Update Customer</h2>
              </div>

              {/* Cari ID */}
              <div className="flex gap-2">
                <input type="text" className="flex-1 p-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-yellow-400"
                   value={formUpdate.id_cari} onChange={(e) => setFormUpdate({ ...formUpdate, id_cari: e.target.value })} placeholder="Cari ID Pesanan..." />
                <button onClick={cariDataUpdate} className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold px-6 rounded-xl shadow-md transition">🔍</button>
              </div>

              {/* Progress Slider (DENGAN FUNGSI PINTAR) */}
              <div className="bg-yellow-50 p-6 rounded-2xl border border-yellow-100">
                 <label className="text-xs font-bold text-yellow-700 mb-4 block uppercase">Geser Progress ({formUpdate.progress}%)</label>
                 <input 
                   type="range" 
                   min="0" 
                   max="100" 
                   className="w-full accent-yellow-500 h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                   value={formUpdate.progress} 
                   onChange={(e) => handleProgressChange(parseInt(e.target.value))} 
                 />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* LOGIKA STATUS BARU (TERKUNCI / TERBUKA) */}
                  <div>
                    <label className="text-xs font-bold text-slate-400 ml-1 uppercase">
                      Status {formUpdate.progress < 100 ? "(Otomatis)" : "(Silakan Pilih)"}
                    </label>
                    <select
                      className={`w-full p-4 border-2 rounded-xl font-bold focus:outline-none transition-colors appearance-none
                        ${
                          formUpdate.progress < 100
                            ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed" // Tampilan Terkunci
                            : "bg-green-50 text-green-800 border-green-200 cursor-pointer hover:bg-green-100" // Tampilan Terbuka
                        }
                      `}
                      value={formUpdate.status}
                      onChange={(e) =>
                        setFormUpdate({ ...formUpdate, status: e.target.value })
                      }
                      disabled={formUpdate.progress < 100} // DISABLED jika < 100
                    >
                      {/* Opsi saat masih proses (Dikunci) */}
                      {formUpdate.progress < 100 && (
                        <>
                          <option value="Dalam Proses">⚙️ Dalam Proses</option>
                          <option value="Checking Quality">🔍 Checking Quality</option>
                        </>
                      )}

                      {/* Opsi saat sudah 100% (Terbuka) */}
                      {formUpdate.progress === 100 && (
                        <>
                          <option value="Siap Dikirim">📦 Siap Dikirim</option>
                          <option value="Dalam Perjalanan">🚚 Dalam Perjalanan</option>
                          <option value="Selesai">✅ Selesai</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 ml-1 uppercase">Upload Foto Terbaru</label>
                    <div className="flex gap-2 items-center bg-yellow-50 p-2 rounded-xl border border-yellow-100">
                        <input type="file" ref={refUpdateFile} accept="image/*"
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-white file:text-yellow-700 hover:file:bg-yellow-100 transition"
                        onChange={(e) => e.target.files && setFormUpdate({...formUpdate, foto: e.target.files[0]})} />
                        {formUpdate.foto && (
                            <button onClick={() => { setFormUpdate({...formUpdate, foto: null}); if(refUpdateFile.current) refUpdateFile.current.value=""; }} 
                            className="bg-red-100 text-red-500 rounded-full w-8 h-8 font-bold hover:bg-red-200 flex-shrink-0">✕</button>
                        )}
                    </div>
                  </div>
              </div>

              <textarea rows={3} className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:border-yellow-400" placeholder="Keterangan singkat untuk customer..."
                 value={formUpdate.deskripsi} onChange={(e) => setFormUpdate({...formUpdate, deskripsi: e.target.value})} />

              <div className="flex gap-3 pt-2">
                 <button onClick={handleDelete} className="bg-red-100 text-red-500 font-bold px-6 py-4 rounded-xl hover:bg-red-200 transition">HAPUS</button>
                 <button onClick={handleUpdateCustomer} disabled={loading} className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-black py-4 rounded-xl shadow-lg transition disabled:bg-gray-300">
                    {loading ? "LOADING..." : "UPDATE DATA"}
                 </button>
              </div>
            </div>
          )}

          {/* === TAB 3: LAPORAN BOSS === */}
          {activeTab === "boss" && (
            <div className="space-y-6 animate-pulse-once">
              <div className="flex items-center gap-3 mb-6 border-b pb-4">
                <span className="w-10 h-10 bg-slate-800 text-white rounded-full flex items-center justify-center text-xl">🕵️</span>
                <h2 className="text-xl font-black text-slate-800 uppercase">Laporan Boss</h2>
              </div>

              <div className="flex gap-2">
                <input type="text" className="flex-1 p-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-slate-400"
                   value={formBoss.id_cari} onChange={(e) => setFormBoss({ ...formBoss, id_cari: e.target.value })} placeholder="Cari ID Project..." />
                <button onClick={cariDataBoss} className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-6 rounded-xl shadow-md transition">🔍</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="text-xs font-bold text-slate-400 ml-1 uppercase">Progress Aktual (%)</label>
                    <input 
                      type="number" 
                      className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-slate-400"
                      value={formBoss.progress || ""}
                      onChange={(e) => setFormBoss({...formBoss, progress: e.target.value ? parseInt(e.target.value) : 0})}/>
                 </div>
                 <div>
                    <label className="text-xs font-bold text-slate-400 ml-1 uppercase">Bukti Foto (Opsional)</label>
                    <div className="flex gap-2 items-center bg-slate-100 p-2 rounded-xl border border-slate-200">
                        <input type="file" ref={refBossFile} accept="image/*"
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-white file:text-slate-800 hover:file:bg-slate-200 transition"
                        onChange={(e) => e.target.files && setFormBoss({...formBoss, foto: e.target.files[0]})} />
                        {formBoss.foto && (
                            <button onClick={() => { setFormBoss({...formBoss, foto: null}); if(refBossFile.current) refBossFile.current.value=""; }} 
                            className="bg-red-100 text-red-500 rounded-full w-8 h-8 font-bold hover:bg-red-200 flex-shrink-0">✕</button>
                        )}
                    </div>
                 </div>
              </div>

              <textarea rows={5} className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:border-slate-400" placeholder="Tulis laporan detail internal di sini..."
                 value={formBoss.laporan} onChange={(e) => setFormBoss({...formBoss, laporan: e.target.value})} />

              <button onClick={handleLaporanBoss} disabled={loading} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-black py-4 rounded-xl shadow-lg mt-4 transition disabled:bg-gray-400">
                {loading ? "MENGIRIM..." : "KIRIM LAPORAN KE BOSS"}
              </button>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}