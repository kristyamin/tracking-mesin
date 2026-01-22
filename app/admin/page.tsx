"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const MACHINE_CATEGORIES = [
  {
    id: "MAKING",
    title: "MAKING MACHINE",
    types: ["S-7500", "S-7000", "S-6000E", "S-6000", "S-5000", "S-4000", "FM 400"],
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

  // --- 1. SECURITY CHECK ---
  useEffect(() => {
    const role = sessionStorage.getItem("user_role"); 
    if (role !== "admin") {
      router.push("/"); 
    }
  }, []);

  // --- 2. LOGIKA TAHUN & FILTER DATABASE ---
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [selectedDbCategory, setSelectedDbCategory] = useState<string | null>(null); 
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; 

  const currentYearDB = new Date().getFullYear();
  const yearsDB = [];
  for (let i = 0; i < 5; i++) {
      yearsDB.push((currentYearDB + i).toString());
  }

  const refInputFile = useRef<HTMLInputElement>(null);
  const refUpdateFile = useRef<HTMLInputElement>(null);
  const refBossFile = useRef<HTMLInputElement>(null);

  // --- DEFINISI STATE AWAL (BIAR BISA DI-RESET) ---
  const initialFormInput = {
    id: "", kategori: "MAKING", tipe: MACHINE_CATEGORIES[0].types[0], nama_manual: "",
    customer: "", mekanik: "", estimasi: "", spesifikasi: "", foto: null as File | null,
  };

  const initialFormUpdate = {
    id_cari: "", progress: 0, status: "Dalam Proses", db_id: 0, 
    order_id_edit: "", customer_edit: "", nama_manual_edit: "", estimasi_edit: "",
    spesifikasi_edit: "", deskripsi: "", foto: null as File | null, data_found: false 
  };

  const initialFormBoss = {
    id_cari: "", db_id: 0, progress: 0, laporan: "", riwayat: "", foto: null as File | null, data_found: false
  };

  const [formInput, setFormInput] = useState(initialFormInput);
  const [formUpdate, setFormUpdate] = useState(initialFormUpdate);
  const [formBoss, setFormBoss] = useState(initialFormBoss);
  
  const [multipleResults, setMultipleResults] = useState<any[]>([]);
  const [multipleResultsBoss, setMultipleResultsBoss] = useState<any[]>([]);
  const [listData, setListData] = useState<any[]>([]);

  // --- FUNGSI GLOBAL REFRESH / RESET ---
  const handleGlobalReset = () => {
      if(!confirm("Bersihkan semua form dan kembali ke awal?")) return;
      
      // 1. Reset Semua Form
      setFormInput(initialFormInput);
      setFormUpdate(initialFormUpdate);
      setFormBoss(initialFormBoss);
      
      // 2. Bersihkan Input File
      if (refInputFile.current) refInputFile.current.value = "";
      if (refUpdateFile.current) refUpdateFile.current.value = "";
      if (refBossFile.current) refBossFile.current.value = "";

      // 3. Reset Navigasi Tab 4 & Pindah ke Tab 1
      setSelectedDbCategory(null);
      setMultipleResults([]);
      setMultipleResultsBoss([]);
      setActiveTab("input");
      
      alert("✅ Panel Admin berhasil di-refresh!");
  };

  useEffect(() => { setCurrentPage(1); }, [filterYear, selectedDbCategory]);

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

  // --- LOGIC CRUD ---
  const handleInputBaru = async () => {
    if (!formInput.id || !formInput.tipe) return alert("⚠️ Wajib isi ID & Tipe Mesin!");
    setLoading(true);
    try {
      let fotoUrl = null;
      if (formInput.foto) fotoUrl = await uploadToSupabase(formInput.foto, formInput.id);
      const { error } = await supabase.from("orders").insert({
        order_id: formInput.id, machine_category: formInput.kategori, machine_type: formInput.tipe,
        machine_name: formInput.nama_manual, customer_name: formInput.customer, mechanic_name: formInput.mekanik,    
        status: "0%", public_status: "0%", delivery_status: "Proses", estimation_date: formInput.estimasi || null,
        spesifikasi: formInput.spesifikasi, year: new Date().getFullYear().toString(), foto_url: fotoUrl, public_foto_url: fotoUrl,
      });
      if (error) throw error;
      alert("✅ Mesin Baru Berhasil Didaftarkan!");
      const defaultType = MACHINE_CATEGORIES.find(c => c.id === "MAKING")?.types[0] || "";
      setFormInput({ ...initialFormInput, kategori: "MAKING", tipe: defaultType, nama_manual: defaultType });
      if (refInputFile.current) refInputFile.current.value = ""; 
    } catch (err: any) { alert("Gagal: " + err.message); }
    setLoading(false);
  };

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
    setMultipleResults([]); 
    setFormUpdate({ ...formUpdate, data_found: false });
    const { data, error } = await supabase.from("orders").select("*").eq("order_id", formUpdate.id_cari);
    if (error || !data || data.length === 0) { alert("❌ Data tidak ditemukan!"); } 
    else if (data.length === 1) { loadDataToUpdateForm(data[0]); } 
    else { setMultipleResults(data); }
    setLoading(false);
  };

  const loadDataToUpdateForm = (data: any) => {
      const numProgress = parseInt(data.public_status) || 0;
      setFormUpdate({
        ...formUpdate, data_found: true, db_id: data.id, progress: numProgress,
        status: data.delivery_status || (numProgress >= 100 ? "Siap Dikirim" : "Dalam Proses"),
        order_id_edit: data.order_id, customer_edit: data.customer_name, nama_manual_edit: data.machine_name || data.machine_type,
        estimasi_edit: data.estimation_date || "", spesifikasi_edit: data.spesifikasi || "", deskripsi: data.deskripsi_progress || "" 
      });
      setMultipleResults([]); 
  };

  const handleUpdateCustomer = async () => {
    if (!formUpdate.data_found || !formUpdate.db_id) return alert("Data belum dipilih!");
    setLoading(true);
    try {
      let fotoUrl = null;
      if (formUpdate.foto) fotoUrl = await uploadToSupabase(formUpdate.foto, formUpdate.id_cari);
      const updatePayload: any = {
        order_id: formUpdate.order_id_edit, public_status: `${formUpdate.progress}%`, delivery_status: formUpdate.status,
        customer_name: formUpdate.customer_edit, machine_name: formUpdate.nama_manual_edit, estimation_date: formUpdate.estimasi_edit || null,
        spesifikasi: formUpdate.spesifikasi_edit, deskripsi_progress: formUpdate.deskripsi 
      };
      if (fotoUrl) updatePayload.public_foto_url = fotoUrl;
      const { error } = await supabase.from("orders").update(updatePayload).eq("id", formUpdate.db_id);
      if (error) throw error;
      alert("✅ Update Customer Berhasil!");
      setFormUpdate(initialFormUpdate);
      if (refUpdateFile.current) refUpdateFile.current.value = "";
    } catch (err: any) { alert("Gagal: " + err.message); }
    setLoading(false);
  };

  const cariDataBoss = async () => {
    if (!formBoss.id_cari) return alert("Masukkan ID!");
    setLoading(true);
    setMultipleResultsBoss([]);
    setFormBoss({ ...formBoss, data_found: false });
    const { data } = await supabase.from("orders").select("*").eq("order_id", formBoss.id_cari);
    if (data && data.length > 0) {
        if (data.length === 1) { loadDataToBossForm(data[0]); } else { setMultipleResultsBoss(data); }
    } else { alert("❌ ID Tidak Ditemukan"); }
    setLoading(false);
  };

  const loadDataToBossForm = (data: any) => {
    setFormBoss((prev) => ({ ...prev, data_found: true, db_id: data.id, progress: parseInt(data.status) || 0, riwayat: data.internal_report || "", laporan: "" }));
    setMultipleResultsBoss([]);
  };

  const handleLaporanBoss = async () => {
    if (!formBoss.data_found || !formBoss.laporan) return alert("Pilih Mesin & Isi Laporan!");
    setLoading(true);
    try {
        let fotoUrl = null;
        if (formBoss.foto) fotoUrl = await uploadToSupabase(formBoss.foto, formBoss.id_cari);
        const tanggal = new Date().toLocaleDateString("id-ID");
        const jam = new Date().toLocaleTimeString("id-ID").slice(0, 5);
        const logBaru = `[${tanggal} ${jam}] ${formBoss.laporan}`;
        const finalReport = formBoss.riwayat ? `${formBoss.riwayat}\n\n${logBaru}` : logBaru;
        const payload: any = { status: `${formBoss.progress}%`, internal_report: finalReport };
        if (fotoUrl) payload.foto_url = fotoUrl;
        await supabase.from("orders").update(payload).eq("id", formBoss.db_id);
        alert("✅ Laporan Boss Terkirim!");
        setFormBoss(initialFormBoss);
        if (refBossFile.current) refBossFile.current.value = "";
    } catch (err: any) { alert("Gagal: " + err.message); }
    setLoading(false);
  };

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
      if(!confirm("⚠️ YAKIN HAPUS SELAMANYA?")) return;
      await supabase.from("orders").delete().eq("id", id);
      alert("Data dihapus.");
      fetchListData(); 
  };

  const handlePrint = () => {
    const targetCat = selectedDbCategory || "ALL"; 
    const dataToPrint = listData.filter(item => {
        const itemYear = new Date(item.created_at).getFullYear().toString();
        const matchYear = itemYear === filterYear;
        const matchCat = targetCat === "ALL" ? true : item.machine_category === targetCat;
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
        printWindow.document.write(`<p>Kategori: ${targetCat}</p>`);
        printWindow.document.write('</div>');
        printWindow.document.write('<table>');
        printWindow.document.write('<thead><tr><th>ID Order</th><th>Tipe Mesin</th><th>Nama Customer</th><th>Status Akhir</th></tr></thead>');
        printWindow.document.write('<tbody>');
        
        const sortedPrint = dataToPrint.sort((a, b) => {
             const statusA = parseInt(a.status) || 0;
             const statusB = parseInt(b.status) || 0;
             if (statusA < 100 && statusB >= 100) return -1;
             if (statusA >= 100 && statusB < 100) return 1;
             return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        sortedPrint.forEach(item => {
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

  // --- LOGIC SORTING & PAGINATION ---
  const getFilteredAndSortedData = () => {
      const filtered = listData.filter(item => {
          const itemYear = new Date(item.created_at).getFullYear().toString();
          const matchYear = itemYear === filterYear;
          const matchCat = item.machine_category === selectedDbCategory;
          return matchYear && matchCat;
      });

      const sorted = filtered.sort((a, b) => {
          const statusA = parseInt(a.status) || 0;
          const statusB = parseInt(b.status) || 0;
          if (statusA < 100 && statusB >= 100) return -1;
          if (statusA >= 100 && statusB < 100) return 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      return sorted;
  };

  const allData = getFilteredAndSortedData();
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = allData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(allData.length / itemsPerPage);

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
            {/* TOMBOL REFRESH BARU */}
            <button onClick={handleGlobalReset} className="absolute top-0 right-0 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 text-xs font-bold text-red-500 hover:bg-red-50 transition z-10">
                🔄 Refresh
            </button>
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
              <div className="flex items-center gap-3 mb-6 border-b pb-4"><span className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl">📝</span><h2 className="text-xl font-black text-blue-900 uppercase">Input Mesin Baru</h2></div>
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
              <div className="mt-4"><label className="text-xs font-bold text-blue-600 ml-1 uppercase">Spesifikasi Mesin (Opsional)</label><textarea rows={3} className="w-full p-4 bg-slate-50 border-2 border-blue-100 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition" placeholder="Contoh: Tambahan Conveyor 2M..." value={formInput.spesifikasi} onChange={(e) => setFormInput({...formInput, spesifikasi: e.target.value})} /></div>
              <button onClick={handleInputBaru} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl shadow-lg mt-6 transition disabled:bg-gray-300">{loading ? "MENYIMPAN..." : "SIMPAN DATA MESIN"}</button>
            </div>
          )}

          {activeTab === "update" && (
            <div className="space-y-6 animate-pulse-once">
               <div className="flex items-center gap-3 mb-6 border-b pb-4"><span className="w-10 h-10 bg-yellow-100 text-yellow-700 rounded-full flex items-center justify-center text-xl">📢</span><h2 className="text-xl font-black text-yellow-700 uppercase">Update Customer (Tracking)</h2></div>
              <div className="flex gap-2"><input type="text" className="flex-1 p-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-yellow-400" value={formUpdate.id_cari} onChange={(e) => setFormUpdate({ ...formUpdate, id_cari: e.target.value })} placeholder="Cari ID Pesanan..." /><button onClick={cariDataUpdate} className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold px-6 rounded-xl shadow-md transition">🔍</button></div>
              {multipleResults.length > 0 && (<div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-4 animate-in fade-in"><p className="text-xs font-bold text-slate-500 mb-3 uppercase">🔍 Ditemukan {multipleResults.length} mesin dengan ID "{formUpdate.id_cari}". Pilih satu untuk diedit:</p><div className="space-y-2 max-h-60 overflow-y-auto">{multipleResults.map((item) => (<button key={item.id} onClick={() => loadDataToUpdateForm(item)} className="w-full text-left p-3 bg-white border hover:border-blue-400 rounded-lg shadow-sm flex justify-between items-center transition group"><div><p className="font-bold text-slate-800 text-xs">{item.machine_name || item.machine_type}</p><p className="text-[10px] text-slate-400">Mekanik: {item.mechanic_name || "-"} | Cust: {item.customer_name}</p></div><span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-2 py-1 rounded group-hover:bg-blue-600 group-hover:text-white transition">PILIH</span></button>))}</div></div>)}
              {formUpdate.data_found && (
                  <div className="space-y-6 border-t pt-6 animate-in slide-in-from-bottom duration-300">
                      <div className="bg-purple-50 p-4 rounded-xl border border-purple-200"><label className="text-[10px] font-black text-purple-700 uppercase">📝 EDIT ID ORDER (Hati-hati!)</label><input className="w-full p-2 bg-white border border-purple-300 rounded font-bold text-slate-800" value={formUpdate.order_id_edit} onChange={(e) => setFormUpdate({...formUpdate, order_id_edit: e.target.value})} placeholder="Ganti ID Order di sini..." /><p className="text-[9px] text-purple-500 mt-1 italic">Jika ID diubah, pastikan tidak kembar dengan ID lain.</p></div>
                      <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="text-[10px] font-black text-yellow-800 uppercase">Nama Customer (Edit)</label><input className="w-full p-2 bg-white border border-yellow-300 rounded font-bold text-slate-800" value={formUpdate.customer_edit} onChange={(e) => setFormUpdate({...formUpdate, customer_edit: e.target.value})} /></div><div><label className="text-[10px] font-black text-yellow-800 uppercase">Estimasi Tanggal (Edit)</label><input type="date" className="w-full p-2 bg-white border border-yellow-300 rounded font-bold text-slate-800" value={formUpdate.estimasi_edit} onChange={(e) => setFormUpdate({...formUpdate, estimasi_edit: e.target.value})} /></div></div>
                      <div className="bg-blue-50 p-4 rounded-xl border border-blue-200"><label className="text-[10px] font-black text-blue-800 uppercase">Nama Detail Mesin (Edit)</label><input className="w-full p-2 bg-white border border-blue-300 rounded font-bold text-slate-800" value={formUpdate.nama_manual_edit} onChange={(e) => setFormUpdate({...formUpdate, nama_manual_edit: e.target.value})} /></div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200"><label className="text-[10px] font-black text-slate-500 uppercase">Spesifikasi Mesin (Edit)</label><textarea rows={2} className="w-full p-2 bg-white border border-slate-300 rounded font-bold text-slate-800" value={formUpdate.spesifikasi_edit} onChange={(e) => setFormUpdate({...formUpdate, spesifikasi_edit: e.target.value})} placeholder="Edit Spesifikasi..." /></div>
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100"><label className="text-xs font-bold text-slate-400 mb-4 block uppercase">Geser Progress Customer ({formUpdate.progress}%)</label><input type="range" min="0" max="100" className="w-full accent-yellow-500 h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer" value={formUpdate.progress} onChange={(e) => handleProgressChange(parseInt(e.target.value))} /><p className="text-[10px] text-red-400 mt-2 italic">*Geser progress ini TIDAK AKAN merubah Dashboard Boss</p></div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><label className="text-xs font-bold text-slate-400 ml-1 uppercase">Status</label><select className={`w-full p-4 border-2 rounded-xl font-bold focus:outline-none appearance-none ${formUpdate.progress < 100 ? "bg-gray-100 text-gray-400" : "bg-green-50 text-green-800"}`} value={formUpdate.status} onChange={(e) => setFormUpdate({ ...formUpdate, status: e.target.value })} disabled={formUpdate.progress < 100}>{formUpdate.progress < 100 && <><option value="Dalam Proses">⚙️ Dalam Proses</option><option value="Checking Quality">🔍 Checking Quality</option></>}{formUpdate.progress === 100 && <><option value="Siap Dikirim">📦 Ready to Ship</option><option value="Dalam Perjalanan">🚚 In Transit</option><option value="Selesai">✅ Completed</option></>}</select></div><div><label className="text-xs font-bold text-slate-400 ml-1 uppercase">Upload Foto Public (Cust)</label><input type="file" ref={refUpdateFile} accept="image/*" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-white file:text-yellow-700 file:font-bold border-0" onChange={(e) => e.target.files && setFormUpdate({...formUpdate, foto: e.target.files[0]})} /></div></div>
                      <textarea rows={3} className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:border-yellow-400" placeholder="Pesan untuk CUSTOMER (Akan muncul di Tracking)..." value={formUpdate.deskripsi} onChange={(e) => setFormUpdate({...formUpdate, deskripsi: e.target.value})} />
                      <button onClick={handleUpdateCustomer} disabled={loading} className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-black py-4 rounded-xl shadow-lg transition disabled:bg-gray-300">{loading ? "LOADING..." : "UPDATE DATA CUSTOMER"}</button>
                  </div>
              )}
            </div>
          )}

          {activeTab === "boss" && (
            <div className="space-y-6 animate-pulse-once">
              <div className="flex items-center gap-3 mb-6 border-b pb-4"><span className="w-10 h-10 bg-slate-800 text-white rounded-full flex items-center justify-center text-xl">🕵️</span><h2 className="text-xl font-black text-slate-800 uppercase">Laporan Boss (Internal)</h2></div>
              <div className="flex gap-2"><input type="text" className="flex-1 p-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-slate-400" value={formBoss.id_cari} onChange={(e) => setFormBoss({ ...formBoss, id_cari: e.target.value })} placeholder="Cari ID Project..." /><button onClick={cariDataBoss} className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-6 rounded-xl shadow-md transition">🔍</button></div>
              {multipleResultsBoss.length > 0 && (<div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-4 animate-in fade-in"><p className="text-xs font-bold text-slate-500 mb-3 uppercase">🔍 Ditemukan {multipleResultsBoss.length} mesin. Pilih satu untuk laporan:</p><div className="space-y-2 max-h-60 overflow-y-auto">{multipleResultsBoss.map((item) => (<button key={item.id} onClick={() => loadDataToBossForm(item)} className="w-full text-left p-3 bg-white border hover:border-slate-400 rounded-lg shadow-sm flex justify-between items-center transition group"><div><p className="font-bold text-slate-800 text-xs">{item.machine_name || item.machine_type}</p><p className="text-[10px] text-slate-400">Mekanik: {item.mechanic_name || "-"}</p></div><span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-1 rounded group-hover:bg-slate-800 group-hover:text-white transition">PILIH</span></button>))}</div></div>)}
              {formBoss.data_found && (
                  <div className="space-y-6 border-t pt-6 animate-in slide-in-from-bottom duration-300">
                      <div className="bg-red-50 text-red-600 p-4 rounded-xl font-bold text-xs flex items-center gap-2"><span>⚠️</span> Update ini KHUSUS untuk Dashboard Boss.</div>
                      <div><label className="text-xs font-bold text-slate-400 ml-1 uppercase">Riwayat Laporan Sebelumnya</label><div className="w-full p-4 bg-slate-100 border-2 border-slate-200 rounded-xl text-slate-600 font-mono text-xs whitespace-pre-wrap h-40 overflow-y-auto">{formBoss.riwayat || "(Belum ada riwayat laporan)"}</div></div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><label className="text-xs font-bold text-slate-400 ml-1 uppercase">Progress Aktual (Boss) (%)</label><input type="number" className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-slate-400" value={formBoss.progress || ""} onChange={(e) => setFormBoss({...formBoss, progress: parseInt(e.target.value) || 0})}/></div><div><label className="text-xs font-bold text-slate-400 ml-1 uppercase">Bukti Foto Internal</label><input type="file" ref={refBossFile} accept="image/*" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-white file:text-slate-800 file:font-bold border-0" onChange={(e) => e.target.files && setFormBoss({...formBoss, foto: e.target.files[0]})} /></div></div>
                      <div><label className="text-xs font-bold text-blue-600 ml-1 uppercase">Tulis Update Baru</label><textarea rows={4} className="w-full p-4 bg-white border-2 border-blue-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:border-blue-500 placeholder-slate-300" placeholder="Ketik laporan baru di sini... (Otomatis diberi tanggal & jam)" value={formBoss.laporan} onChange={(e) => setFormBoss({...formBoss, laporan: e.target.value})} /></div>
                      <button onClick={handleLaporanBoss} disabled={loading} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-black py-4 rounded-xl shadow-lg mt-4 transition disabled:bg-gray-400">{loading ? "MENGIRIM..." : "KIRIM UPDATE (+ HISTORY)"}</button>
                  </div>
              )}
            </div>
          )}

          {/* === TAB 4: DATABASE LIST (VERSI CARD 2 PILIHAN + TABEL + PAGINATION) === */}
          {activeTab === "list" && (
            <div className="space-y-6 animate-pulse-once">
                {!selectedDbCategory && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
                        <div onClick={() => setSelectedDbCategory('MAKING')} className="bg-blue-600 p-8 rounded-[2rem] text-white shadow-xl cursor-pointer hover:scale-105 transition-transform group relative overflow-hidden"><div className="absolute -right-10 -bottom-10 opacity-20 text-[10rem]">⚙️</div><h3 className="text-2xl font-black uppercase mb-2">MAKING MACHINE</h3><p className="text-blue-200 font-bold text-sm">Klik untuk melihat list mesin</p><div className="mt-6 flex gap-3"><span className="bg-white/20 px-3 py-1 rounded-lg text-xs font-bold">{listData.filter(i => i.machine_category === 'MAKING' && parseInt(i.status) < 100).length} Active</span><span className="bg-white/20 px-3 py-1 rounded-lg text-xs font-bold">{listData.filter(i => i.machine_category === 'MAKING').length} Total</span></div></div>
                        <div onClick={() => setSelectedDbCategory('PACKING')} className="bg-green-600 p-8 rounded-[2rem] text-white shadow-xl cursor-pointer hover:scale-105 transition-transform group relative overflow-hidden"><div className="absolute -right-10 -bottom-10 opacity-20 text-[10rem]">📦</div><h3 className="text-2xl font-black uppercase mb-2">PACKING MACHINE</h3><p className="text-green-200 font-bold text-sm">Klik untuk melihat list mesin</p><div className="mt-6 flex gap-3"><span className="bg-white/20 px-3 py-1 rounded-lg text-xs font-bold">{listData.filter(i => i.machine_category === 'PACKING' && parseInt(i.status) < 100).length} Active</span><span className="bg-white/20 px-3 py-1 rounded-lg text-xs font-bold">{listData.filter(i => i.machine_category === 'PACKING').length} Total</span></div></div>
                    </div>
                )}
                {selectedDbCategory && (
                    <div className="animate-in slide-in-from-right duration-300">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b pb-4 mb-2">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setSelectedDbCategory(null)} className="w-10 h-10 bg-slate-200 hover:bg-slate-300 rounded-full flex items-center justify-center text-xl transition">←</button>
                                <div><h2 className="text-xl font-black text-slate-800 uppercase">DATABASE {selectedDbCategory}</h2><p className="text-xs font-bold text-slate-400">Tahun {filterYear}</p></div>
                            </div>
                            <div className="flex gap-2 items-center"><button onClick={handlePrint} className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-black transition flex items-center gap-2 shadow-lg hover:shadow-xl active:scale-95" title="Cetak ke PDF"><span>🖨️</span> Print PDF</button><select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="bg-white border-2 border-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs outline-none focus:border-blue-400 cursor-pointer">{yearsDB.map(y => <option key={y} value={y}>Tahun {y}</option>)}</select></div>
                        </div>
                        {loading ? <p className="text-center py-10 font-bold text-slate-400">Sedang memuat data...</p> : (
                            <div>
                                <div className="overflow-x-auto rounded-xl border border-slate-200">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold"><tr><th className="p-4">ID Pesanan</th><th className="p-4">Nama Mesin</th><th className="p-4">Customer</th><th className="p-4">Status</th><th className="p-4 text-center">Aksi</th></tr></thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {currentItems.length === 0 ? (<tr><td colSpan={5} className="p-8 text-center text-slate-400 font-bold">📂 Tidak ada data.</td></tr>) : (currentItems.map((item) => (<tr key={item.id} className={`hover:bg-slate-50 transition ${parseInt(item.status) >= 100 ? 'bg-slate-50/50 opacity-60' : 'bg-white'}`}><td className="p-4 font-bold text-blue-600">{item.order_id}</td><td className="p-4 font-bold text-slate-800">{item.machine_name || item.machine_type}</td><td className="p-4 text-slate-600 font-medium">{item.customer_name}</td><td className="p-4"><span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${parseInt(item.status) >= 100 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-600'}`}>{item.status}</span></td><td className="p-4 text-center"><button onClick={() => handlePermanentDelete(item.id)} className="text-red-500 hover:text-red-700 font-bold text-xs bg-red-50 px-3 py-1 rounded-lg hover:bg-red-100 transition">HAPUS</button></td></tr>)))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="flex justify-between items-center mt-4"><p className="text-xs font-bold text-slate-400">Hal {currentPage} dari {totalPages || 1}</p><div className="flex gap-2"><button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-50 disabled:opacity-50">Prev</button><button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-50 disabled:opacity-50">Next</button></div></div>
                            </div>
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