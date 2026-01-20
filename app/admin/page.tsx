"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const MACHINE_CATEGORIES = [
  {
    id: "MAKING",
    title: "MAKING MACHINE",
    types: ["S-7500", "S-7000", "S-6000E", "S-6000", "S-5000", "S-4000"],
  },
  {
    id: "PACKING",
    title: "PACKING MACHINE",
    types: [
      "HLP 225", "HLP 150", "STAMPER HS-250", "STAMPER F-TYPE",
      "STAMPER M-TYPE", "WRAPPER M-TYPE", "WRAPPER C-TYPE",
      "BOXER M-TYPE", "OVER-WRAPPER", "NAKED OVER-WRAPPER"
    ],
  },
];

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("input");
  const [loading, setLoading] = useState(false);

  // --- 1. SECURITY CHECK (SATPAM) ---
  useEffect(() => {
    const role = sessionStorage.getItem("user_role"); 
    if (role !== "admin") {
      router.push("/"); 
    }
  }, []);

  // --- 2. LOGIKA TAHUN & FILTER ---
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [filterCategory, setFilterCategory] = useState("ALL"); 

  const currentYearDB = new Date().getFullYear();
  const yearsDB = [];
  for (let i = 0; i < 5; i++) {
      yearsDB.push((currentYearDB + i).toString());
  }

  const refInputFile = useRef<HTMLInputElement>(null);
  const refUpdateFile = useRef<HTMLInputElement>(null);
  const refBossFile = useRef<HTMLInputElement>(null);

  // --- STATE 1: INPUT BARU ---
  const [formInput, setFormInput] = useState({
    id: "",
    kategori: "MAKING", 
    tipe: MACHINE_CATEGORIES[0].types[0],
    nama_manual: "",
    customer: "",
    mekanik: "",       
    estimasi: "",       
    foto: null as File | null,
  });

  // --- STATE 2: UPDATE CUSTOMER (ADA TAMBAHAN ORDER_ID_EDIT) ---
  const [formUpdate, setFormUpdate] = useState({
    id_cari: "",
    progress: 0,
    status: "Dalam Proses",
    // Field Edit
    order_id_edit: "", // <--- INI TAMBAHAN BARU (UNTUK GANTI ID)
    customer_edit: "", 
    nama_manual_edit: "",
    estimasi_edit: "",
    deskripsi: "",
    foto: null as File | null,
    data_found: false 
  });

  // --- STATE 3: LAPORAN BOSS ---
  const [formBoss, setFormBoss] = useState({
    id_cari: "",
    progress: 0,
    laporan: "",
    riwayat: "",
    foto: null as File | null,
    data_found: false
  });

  const [listData, setListData] = useState<any[]>([]);

  useEffect(() => {
    const categoryData = MACHINE_CATEGORIES.find(c => c.id === formInput.kategori);
    if (categoryData) {
        const newType = categoryData.types[0];
        setFormInput(prev => ({ ...prev, tipe: newType, nama_manual: newType }));
    }
  }, [formInput.kategori]);

  const handleTypeChange = (e: any) => {
      const selectedType = e.target.value;
      setFormInput(prev => ({ ...prev, tipe: selectedType, nama_manual: selectedType }));
  };

  const uploadToSupabase = async (file: File, idPesanan: string) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${idPesanan}-${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from("mesin-images").upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage.from("mesin-images").getPublicUrl(fileName);
    return data.publicUrl;
  };

  // ==========================================
  // 1. INPUT BARU
  // ==========================================
  const handleInputBaru = async () => {
    if (!formInput.id || !formInput.tipe) return alert("⚠️ Wajib isi ID & Tipe Mesin!");
    setLoading(true);

    try {
      const { data: existing } = await supabase.from("orders").select("id").eq("order_id", formInput.id).single();
      if (existing) { alert("❌ ID Pesanan SUDAH ADA."); setLoading(false); return; }

      let fotoUrl = null;
      if (formInput.foto) fotoUrl = await uploadToSupabase(formInput.foto, formInput.id);

      const { error } = await supabase.from("orders").insert({
        order_id: formInput.id,
        machine_category: formInput.kategori,
        machine_type: formInput.tipe,
        machine_name: formInput.nama_manual,
        customer_name: formInput.customer,
        mechanic_name: formInput.mekanik,    
        status: "0%",                       
        public_status: "0%", 
        delivery_status: "Proses",
        estimation_date: formInput.estimasi || null,
        year: new Date().getFullYear().toString(),
        foto_url: fotoUrl,
        public_foto_url: fotoUrl,
      });

      if (error) throw error;

      alert("✅ Mesin Baru Berhasil Didaftarkan!");
      const defaultType = MACHINE_CATEGORIES.find(c => c.id === "MAKING")?.types[0] || "";
      setFormInput({ id: "", kategori: "MAKING", tipe: defaultType, nama_manual: defaultType, customer: "", mekanik: "", estimasi: "", foto: null });
      if (refInputFile.current) refInputFile.current.value = ""; 

    } catch (err: any) {
      alert("Gagal: " + err.message);
    }
    setLoading(false);
  };

  // ==========================================
  // 2. UPDATE CUSTOMER (LOGIC GANTI ID)
  // ==========================================
  const handleProgressChange = (val: number) => {
    let statusOtomatis = formUpdate.status;
    if (val < 75) statusOtomatis = "Dalam Proses";
    else if (val < 100) statusOtomatis = "Checking Quality";
    else if (val === 100 && (formUpdate.status === "Dalam Proses" || formUpdate.status === "Checking Quality")) {
        statusOtomatis = "Siap Dikirim";
    }
    setFormUpdate({ ...formUpdate, progress: val, status: statusOtomatis });
  };

  const cariDataUpdate = async () => {
    if (!formUpdate.id_cari) return alert("Masukkan ID dulu!");
    setLoading(true);
    
    const { data, error } = await supabase.from("orders").select("*").eq("order_id", formUpdate.id_cari).single();

    if (error || !data) {
      alert("❌ Data tidak ditemukan!");
      setFormUpdate({ ...formUpdate, data_found: false });
    } else {
      const numProgress = parseInt(data.public_status) || 0;
      setFormUpdate({
        ...formUpdate,
        data_found: true,
        progress: numProgress,
        status: data.delivery_status || (numProgress >= 100 ? "Siap Dikirim" : "Dalam Proses"),
        order_id_edit: data.order_id, // ISI INPUT GANTI ID DENGAN ID LAMA
        customer_edit: data.customer_name,     
        nama_manual_edit: data.machine_name || data.machine_type,
        estimasi_edit: data.estimation_date || "",
        deskripsi: data.deskripsi_progress || "" 
      });
    }
    setLoading(false);
  };

  const handleUpdateCustomer = async () => {
    if (!formUpdate.id_cari) return alert("Cari ID dulu!");
    setLoading(true);

    try {
      // CEK JIKA ADMIN MENGGANTI ID
      if (formUpdate.order_id_edit !== formUpdate.id_cari) {
          // Cek apakah ID Baru sudah dipakai orang lain?
          const { data: duplicate } = await supabase.from("orders").select("id").eq("order_id", formUpdate.order_id_edit).single();
          if (duplicate) {
              alert("❌ ID BARU SUDAH ADA! Tidak bisa ganti ke ID tersebut.");
              setLoading(false);
              return;
          }
      }

      let fotoUrl = null;
      if (formUpdate.foto) fotoUrl = await uploadToSupabase(formUpdate.foto, formUpdate.id_cari);

      const updatePayload: any = {
        order_id: formUpdate.order_id_edit, // SIMPAN ID BARU (ATAU LAMA)
        public_status: `${formUpdate.progress}%`,
        delivery_status: formUpdate.status,
        customer_name: formUpdate.customer_edit,
        machine_name: formUpdate.nama_manual_edit,
        estimation_date: formUpdate.estimasi_edit || null,
        deskripsi_progress: formUpdate.deskripsi 
      };
      
      if (fotoUrl) updatePayload.public_foto_url = fotoUrl;

      // Update berdasarkan ID LAMA (id_cari)
      const { error } = await supabase.from("orders").update(updatePayload).eq("order_id", formUpdate.id_cari);

      if (error) throw error;
      
      alert("✅ Update Customer Berhasil! (ID & Data tersimpan)");
      
      // Reset form agar tidak bingung
      setFormUpdate({ 
          id_cari: "", 
          order_id_edit: "", 
          progress: 0, 
          status: "Dalam Proses",
          customer_edit: "", 
          nama_manual_edit: "", 
          estimasi_edit: "", 
          deskripsi: "", 
          foto: null, 
          data_found: false 
      });
      
      if (refUpdateFile.current) refUpdateFile.current.value = "";
    } catch (err: any) {
      alert("Gagal: " + err.message);
    }
    setLoading(false);
  };

  // ==========================================
  // 3. LAPORAN BOSS
  // ==========================================
  const cariDataBoss = async () => {
    if (!formBoss.id_cari) return alert("Masukkan ID!");
    setLoading(true);
    const { data } = await supabase.from("orders").select("status, internal_report").eq("order_id", formBoss.id_cari).single();
    if (data) {
        setFormBoss((prev) => ({ 
            ...prev, 
            data_found: true, 
            progress: parseInt(data.status) || 0,
            riwayat: data.internal_report || "",
            laporan: "" 
        }));
    } else {
        alert("❌ ID Tidak Ditemukan");
        setFormBoss((prev) => ({ ...prev, data_found: false }));
    }
    setLoading(false);
  };

  const handleLaporanBoss = async () => {
    if (!formBoss.id_cari || !formBoss.laporan) return alert("Isi ID & Laporan Baru!");
    setLoading(true);
    try {
        let fotoUrl = null;
        if (formBoss.foto) fotoUrl = await uploadToSupabase(formBoss.foto, formBoss.id_cari);
        
        const tanggal = new Date().toLocaleDateString("id-ID");
        const jam = new Date().toLocaleTimeString("id-ID").slice(0, 5);
        const logBaru = `[${tanggal} ${jam}] ${formBoss.laporan}`;
        
        const finalReport = formBoss.riwayat 
            ? `${formBoss.riwayat}\n\n${logBaru}` 
            : logBaru;

        const payload: any = { 
            status: `${formBoss.progress}%`, 
            internal_report: finalReport 
        };
        
        if (fotoUrl) payload.foto_url = fotoUrl;

        await supabase.from("orders").update(payload).eq("order_id", formBoss.id_cari);
        alert("✅ Laporan Boss Terkirim!");
        setFormBoss({ id_cari: "", data_found: false, progress: 0, laporan: "", riwayat: "", foto: null });
        if (refBossFile.current) refBossFile.current.value = "";
    } catch (err: any) {
        alert("Gagal: " + err.message);
    }
    setLoading(false);
  };

  // ==========================================
  // 4. LIST DATA & PRINT
  // ==========================================
  const fetchListData = async () => {
      setLoading(true);
      const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if(data) setListData(data);
      setLoading(false);
  };

  useEffect(() => {
      if(activeTab === "list") fetchListData();
  }, [activeTab]);

  const handlePermanentDelete = async (id: string) => {
      if(!confirm("⚠️ YAKIN HAPUS?")) return;
      await supabase.from("orders").delete().eq("id", id);
      alert("Data dihapus.");
      fetchListData(); 
  };

  const handlePrint = () => {
    const dataToPrint = listData.filter(item => {
        const itemYear = new Date(item.created_at).getFullYear().toString();
        const matchYear = itemYear === filterYear;
        const matchCat = filterCategory === "ALL" ? true : item.machine_category === filterCategory;
        return matchYear && matchCat;
    });

    if (dataToPrint.length === 0) return alert("Tidak ada data untuk diprint!");

    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
        printWindow.document.write('<html><head><title>Cetak Laporan</title>');
        printWindow.document.write('<style>body{font-family:sans-serif;} table{width:100%;border-collapse:collapse;margin-top:20px;} th,td{border:1px solid #000;padding:8px;text-align:left;} th{background-color:#eee;} .header{text-align:center;margin-bottom:20px;} .logo{font-size:24px;font-weight:bold;color:#1e3a8a;}</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write('<div class="header">');
        printWindow.document.write('<div class="logo">PT DJITOE MESINDO</div>');
        printWindow.document.write(`<h3>Laporan Produksi Mesin - Tahun ${filterYear}</h3>`);
        printWindow.document.write(`<p>Kategori: ${filterCategory === "ALL" ? "SEMUA KATEGORI" : filterCategory}</p>`);
        printWindow.document.write('</div>');
        printWindow.document.write('<table>');
        printWindow.document.write('<thead><tr><th>ID Order</th><th>Tipe Mesin</th><th>Nama Customer</th><th>Status Akhir</th></tr></thead>');
        printWindow.document.write('<tbody>');
        dataToPrint.forEach(item => {
            printWindow.document.write(`<tr>
                <td>${item.order_id}</td>
                <td>${item.machine_name || item.machine_type}</td>
                <td>${item.customer_name}</td>
                <td>${item.delivery_status || item.status}</td>
            </tr>`);
        });
        printWindow.document.write('</tbody></table>');
        printWindow.document.write('<div style="margin-top:30px; text-align:right;"><p>Dicetak pada: ' + new Date().toLocaleDateString("id-ID") + '</p></div>');
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); }, 500);
    }
  };

  const currentMachineTypes = MACHINE_CATEGORIES.find(cat => cat.id === formInput.kategori)?.types || [];

  return (
    <main className="min-h-screen bg-slate-100 p-6 font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8 relative">
            <button onClick={() => router.push("/")} className="absolute top-0 left-0 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 text-xs font-bold text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition z-10">
                🏠 <span className="hidden sm:inline">Home</span>
            </button>
            <div className="text-center w-full">
                <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Panel Admin</h1>
                <p className="text-slate-500 font-bold text-sm">PT DJITOE MESINDO</p>
            </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-6">
          <button onClick={() => setActiveTab("input")} className={`py-3 rounded-xl font-black text-[10px] sm:text-xs transition-all uppercase tracking-wide border-b-4 ${activeTab === "input" ? "bg-blue-600 text-white border-blue-800" : "bg-white text-slate-400 border-slate-200"}`}>1. Input Baru</button>
          <button onClick={() => setActiveTab("update")} className={`py-3 rounded-xl font-black text-[10px] sm:text-xs transition-all uppercase tracking-wide border-b-4 ${activeTab === "update" ? "bg-yellow-400 text-slate-900 border-yellow-600" : "bg-white text-slate-400 border-slate-200"}`}>2. Update Cust</button>
          <button onClick={() => setActiveTab("boss")} className={`py-3 rounded-xl font-black text-[10px] sm:text-xs transition-all uppercase tracking-wide border-b-4 ${activeTab === "boss" ? "bg-slate-800 text-white border-black" : "bg-white text-slate-400 border-slate-200"}`}>3. Laporan Boss</button>
          <button onClick={() => setActiveTab("list")} className={`py-3 rounded-xl font-black text-[10px] sm:text-xs transition-all uppercase tracking-wide border-b-4 ${activeTab === "list" ? "bg-red-500 text-white border-red-700" : "bg-white text-slate-400 border-slate-200"}`}>4. Database List</button>
        </div>

        <div className="bg-white rounded-[2rem] shadow-xl p-6 sm:p-10 border border-slate-200 min-h-[500px]">
          
          {/* TAB 1: INPUT */}
          {activeTab === "input" && (
            <div className="space-y-6 animate-pulse-once">
              <div className="flex items-center gap-3 mb-6 border-b pb-4">
                <span className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl">📝</span>
                <h2 className="text-xl font-black text-blue-900 uppercase">Input Mesin Baru</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div><label className="text-xs font-bold text-slate-400 ml-1 uppercase">Kategori Mesin *</label><select className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition cursor-pointer" value={formInput.kategori} onChange={(e) => setFormInput({ ...formInput, kategori: e.target.value })}>{MACHINE_CATEGORIES.map((cat) => (<option key={cat.id} value={cat.id}>{cat.title}</option>))}</select></div>
                    <div><label className="text-xs font-bold text-slate-400 ml-1 uppercase">Tipe Mesin</label><select className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition cursor-pointer" value={formInput.tipe} onChange={handleTypeChange}>{currentMachineTypes.map((t) => (<option key={t} value={t}>{t}</option>))}</select></div>
                    <div><label className="text-xs font-bold text-blue-600 ml-1 uppercase">Nama Detail Mesin (Manual) *</label><input className="w-full p-4 bg-blue-50 border-2 border-blue-100 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-blue-500 transition" value={formInput.nama_manual} onChange={(e) => setFormInput({ ...formInput, nama_manual: e.target.value })} placeholder="Contoh: S-7500 + KDF..." /></div>
                    <div><label className="text-xs font-bold text-slate-400 ml-1 uppercase">ID Pesanan *</label><input className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition" value={formInput.id} onChange={(e) => setFormInput({ ...formInput, id: e.target.value })} placeholder="Contoh: 2026-001" /></div>
                </div>
                <div className="space-y-4">
                    <div><label className="text-xs font-bold text-slate-400 ml-1 uppercase">Customer *</label><input className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition" value={formInput.customer} onChange={(e) => setFormInput({ ...formInput, customer: e.target.value })} placeholder="PT..." /></div>
                    <div><label className="text-xs font-bold text-slate-400 ml-1 uppercase">Estimasi Selesai (Manual)</label><input type="date" className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition" value={formInput.estimasi} onChange={(e) => setFormInput({ ...formInput, estimasi: e.target.value })} /></div>
                    <div><label className="text-xs font-bold text-slate-400 ml-1 uppercase">Mekanik</label><input className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition" value={formInput.mekanik} onChange={(e) => setFormInput({ ...formInput, mekanik: e.target.value })} placeholder="Nama Mekanik" /></div>
                    <div><label className="text-xs font-bold text-slate-400 ml-1 uppercase">Upload Foto Awal</label><input type="file" ref={refInputFile} accept="image/*" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-blue-50 file:text-blue-700 file:font-bold border rounded-xl" onChange={(e) => e.target.files && setFormInput({...formInput, foto: e.target.files[0]})} /></div>
                </div>
              </div>
              <button onClick={handleInputBaru} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl shadow-lg mt-6 transition disabled:bg-gray-300">{loading ? "MENYIMPAN..." : "SIMPAN DATA MESIN"}</button>
            </div>
          )}

          {/* === TAB 2: UPDATE CUSTOMER (ADA EDIT ID) === */}
          {activeTab === "update" && (
            <div className="space-y-6 animate-pulse-once">
               <div className="flex items-center gap-3 mb-6 border-b pb-4">
                <span className="w-10 h-10 bg-yellow-100 text-yellow-700 rounded-full flex items-center justify-center text-xl">📢</span>
                <h2 className="text-xl font-black text-yellow-700 uppercase">Update Customer (Tracking)</h2>
              </div>

              <div className="flex gap-2">
                <input type="text" className="flex-1 p-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-yellow-400"
                   value={formUpdate.id_cari} onChange={(e) => setFormUpdate({ ...formUpdate, id_cari: e.target.value })} placeholder="Cari ID Pesanan..." />
                <button onClick={cariDataUpdate} className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold px-6 rounded-xl shadow-md transition">🔍</button>
              </div>

              {formUpdate.data_found && (
                  <div className="space-y-6 border-t pt-6">
                      
                      {/* --- AREA SPESIAL EDIT ID --- */}
                      <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                          <label className="text-[10px] font-black text-purple-700 uppercase">📝 EDIT ID ORDER (Hati-hati!)</label>
                          <input className="w-full p-2 bg-white border border-purple-300 rounded font-bold text-slate-800" 
                            value={formUpdate.order_id_edit} 
                            onChange={(e) => setFormUpdate({...formUpdate, order_id_edit: e.target.value})} 
                            placeholder="Ganti ID Order di sini..."
                          />
                          <p className="text-[9px] text-purple-500 mt-1 italic">Jika ID diubah, pastikan tidak kembar dengan ID lain.</p>
                      </div>
                      {/* --------------------------- */}

                      <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div><label className="text-[10px] font-black text-yellow-800 uppercase">Nama Customer (Edit)</label><input className="w-full p-2 bg-white border border-yellow-300 rounded font-bold text-slate-800" value={formUpdate.customer_edit} onChange={(e) => setFormUpdate({...formUpdate, customer_edit: e.target.value})} /></div>
                          <div><label className="text-[10px] font-black text-yellow-800 uppercase">Estimasi Tanggal (Edit)</label><input type="date" className="w-full p-2 bg-white border border-yellow-300 rounded font-bold text-slate-800" value={formUpdate.estimasi_edit} onChange={(e) => setFormUpdate({...formUpdate, estimasi_edit: e.target.value})} /></div>
                      </div>

                      <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                          <label className="text-[10px] font-black text-blue-800 uppercase">Nama Detail Mesin (Edit)</label>
                          <input className="w-full p-2 bg-white border border-blue-300 rounded font-bold text-slate-800" value={formUpdate.nama_manual_edit} onChange={(e) => setFormUpdate({...formUpdate, nama_manual_edit: e.target.value})} />
                      </div>

                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                          <label className="text-xs font-bold text-slate-400 mb-4 block uppercase">Geser Progress Customer ({formUpdate.progress}%)</label>
                          <input type="range" min="0" max="100" className="w-full accent-yellow-500 h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer" value={formUpdate.progress} onChange={(e) => handleProgressChange(parseInt(e.target.value))} />
                          <p className="text-[10px] text-red-400 mt-2 italic">*Geser progress ini TIDAK AKAN merubah Dashboard Boss</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                           <label className="text-xs font-bold text-slate-400 ml-1 uppercase">Status</label>
                           <select className={`w-full p-4 border-2 rounded-xl font-bold focus:outline-none appearance-none ${formUpdate.progress < 100 ? "bg-gray-100 text-gray-400" : "bg-green-50 text-green-800"}`}
                             value={formUpdate.status} onChange={(e) => setFormUpdate({ ...formUpdate, status: e.target.value })} disabled={formUpdate.progress < 100}>
                             {formUpdate.progress < 100 && <><option value="Dalam Proses">⚙️ Dalam Proses</option><option value="Checking Quality">🔍 Checking Quality</option></>}
                             {formUpdate.progress === 100 && <><option value="Siap Dikirim">📦 Ready to Ship</option><option value="Dalam Perjalanan">🚚 In Transit</option><option value="Selesai">✅ Completed</option></>}
                           </select>
                          </div>
                          <div><label className="text-xs font-bold text-slate-400 ml-1 uppercase">Upload Foto Public (Cust)</label><input type="file" ref={refUpdateFile} accept="image/*" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-white file:text-yellow-700 file:font-bold border-0" onChange={(e) => e.target.files && setFormUpdate({...formUpdate, foto: e.target.files[0]})} /></div>
                      </div>

                      <textarea rows={3} className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:border-yellow-400" placeholder="Pesan untuk CUSTOMER (Akan muncul di Tracking)..." value={formUpdate.deskripsi} onChange={(e) => setFormUpdate({...formUpdate, deskripsi: e.target.value})} />
                      <button onClick={handleUpdateCustomer} disabled={loading} className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-black py-4 rounded-xl shadow-lg transition disabled:bg-gray-300">{loading ? "LOADING..." : "UPDATE DATA CUSTOMER"}</button>
                  </div>
              )}
            </div>
          )}

          {/* === TAB 3: LAPORAN BOSS (INTERNAL) === */}
          {activeTab === "boss" && (
            <div className="space-y-6 animate-pulse-once">
              <div className="flex items-center gap-3 mb-6 border-b pb-4">
                <span className="w-10 h-10 bg-slate-800 text-white rounded-full flex items-center justify-center text-xl">🕵️</span>
                <h2 className="text-xl font-black text-slate-800 uppercase">Laporan Boss (Internal)</h2>
              </div>
              <div className="flex gap-2">
                <input type="text" className="flex-1 p-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-slate-400" value={formBoss.id_cari} onChange={(e) => setFormBoss({ ...formBoss, id_cari: e.target.value })} placeholder="Cari ID Project..." />
                <button onClick={cariDataBoss} className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-6 rounded-xl shadow-md transition">🔍</button>
              </div>
              {formBoss.data_found && (
                  <div className="space-y-6 border-t pt-6">
                      <div className="bg-red-50 text-red-600 p-4 rounded-xl font-bold text-xs flex items-center gap-2"><span>⚠️</span> Update ini KHUSUS untuk Dashboard Boss.</div>
                      
                      {/* RIWAYAT (HISTORY) */}
                      <div>
                          <label className="text-xs font-bold text-slate-400 ml-1 uppercase">Riwayat Laporan Sebelumnya</label>
                          <div className="w-full p-4 bg-slate-100 border-2 border-slate-200 rounded-xl text-slate-600 font-mono text-xs whitespace-pre-wrap h-40 overflow-y-auto">
                              {formBoss.riwayat || "(Belum ada riwayat laporan)"}
                          </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div><label className="text-xs font-bold text-slate-400 ml-1 uppercase">Progress Aktual (Boss) (%)</label><input type="number" className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-slate-400" value={formBoss.progress || ""} onChange={(e) => setFormBoss({...formBoss, progress: parseInt(e.target.value) || 0})}/></div>
                          <div><label className="text-xs font-bold text-slate-400 ml-1 uppercase">Bukti Foto Internal</label><input type="file" ref={refBossFile} accept="image/*" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-white file:text-slate-800 file:font-bold border-0" onChange={(e) => e.target.files && setFormBoss({...formBoss, foto: e.target.files[0]})} /></div>
                      </div>
                      
                      <div>
                          <label className="text-xs font-bold text-blue-600 ml-1 uppercase">Tulis Update Baru</label>
                          <textarea rows={4} className="w-full p-4 bg-white border-2 border-blue-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:border-blue-500 placeholder-slate-300" 
                              placeholder="Ketik laporan baru di sini... (Otomatis diberi tanggal & jam)" value={formBoss.laporan} onChange={(e) => setFormBoss({...formBoss, laporan: e.target.value})} />
                      </div>

                      <button onClick={handleLaporanBoss} disabled={loading} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-black py-4 rounded-xl shadow-lg mt-4 transition disabled:bg-gray-400">{loading ? "MENGIRIM..." : "KIRIM UPDATE (+ HISTORY)"}</button>
                  </div>
              )}
            </div>
          )}

          {/* === TAB 4: DATABASE LIST (VERSI FILTER & PRINT) === */}
          {activeTab === "list" && (
            <div className="space-y-6 animate-pulse-once">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b pb-4 mb-2">
                    <div className="flex items-center gap-3">
                        <span className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xl">🗄️</span>
                        <h2 className="text-xl font-black text-red-700 uppercase">Database Mesin</h2>
                    </div>
                    
                    <div className="flex gap-2 items-center">
                        <button onClick={handlePrint} className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-black transition flex items-center gap-2 shadow-lg hover:shadow-xl active:scale-95" title="Cetak ke PDF"><span>🖨️</span> Print PDF</button>
                        <div className="h-6 w-px bg-slate-300 mx-2"></div>
                        <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="bg-white border-2 border-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs outline-none focus:border-red-400 cursor-pointer">{yearsDB.map(y => <option key={y} value={y}>Tahun {y}</option>)}</select>
                        <div className="bg-slate-100 p-1 rounded-xl flex">
                            <button onClick={() => setFilterCategory("ALL")} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${filterCategory === "ALL" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>SEMUA</button>
                            <button onClick={() => setFilterCategory("MAKING")} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${filterCategory === "MAKING" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-blue-500"}`}>MAKING</button>
                            <button onClick={() => setFilterCategory("PACKING")} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${filterCategory === "PACKING" ? "bg-white text-green-600 shadow-sm" : "text-slate-400 hover:text-green-500"}`}>PACKING</button>
                        </div>
                    </div>
                </div>

                {loading ? <p className="text-center py-10 font-bold text-slate-400">Sedang memuat data...</p> : (
                    <div className="space-y-3">
                        {listData.filter(item => {
                            const itemYear = new Date(item.created_at).getFullYear().toString();
                            const matchYear = itemYear === filterYear;
                            const matchCat = filterCategory === "ALL" ? true : item.machine_category === filterCategory;
                            return matchYear && matchCat;
                        }).length === 0 ? (
                            <div className="text-center p-10 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 text-sm font-bold">📂 Tidak ada data untuk Tahun {filterYear} kategori {filterCategory}.</div>
                        ) : (
                            listData.filter(item => {
                                const itemYear = new Date(item.created_at).getFullYear().toString();
                                const matchYear = itemYear === filterYear;
                                const matchCat = filterCategory === "ALL" ? true : item.machine_category === filterCategory;
                                return matchYear && matchCat;
                            }).map((item) => (
                                <div key={item.id} className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4 hover:shadow-md transition group">
                                    <div className="flex-1">
                                        <div className="flex gap-2 mb-1">
                                            <span className={`text-[10px] font-black px-2 py-1 rounded ${item.machine_category === 'MAKING' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{item.machine_category}</span>
                                            <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded">{item.order_id}</span>
                                        </div>
                                        <h3 className="font-bold text-slate-800">{item.machine_name || item.machine_type}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] text-slate-400 font-bold">{item.customer_name}</span>
                                            <span className="text-[10px] text-slate-300">•</span>
                                            <span className={`text-[10px] font-bold ${parseInt(item.status) >= 100 ? 'text-green-500' : 'text-blue-500'}`}>Boss: {item.status}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => handlePermanentDelete(item.id)} className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-4 py-2 rounded-lg text-xs font-bold transition uppercase opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0">Hapus</button>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
          )}

        </div>
      </div>
    </main>
  );
}