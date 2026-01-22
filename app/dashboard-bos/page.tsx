"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

// --- KONFIGURASI KARTU MESIN ---
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

export default function DashboardBos() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  // === 1. SATPAM (CEK AKSES) ===
  useEffect(() => {
    const role = sessionStorage.getItem("user_role");
    if (role !== "boss") {
        router.push("/"); 
    }
  }, []);
  
  // === 2. STATE DATA ===
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState<string | null>(null); 
  const [activeOrder, setActiveOrder] = useState<any>(null); 

  // === 3. STATE FILTER & SEARCH ===
  const currentYearReal = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYearReal.toString());
  const [searchTerm, setSearchTerm] = useState(""); 

  // Generate Tahun (Tahun ini + 4 tahun ke depan)
  const years = [];
  for (let i = 0; i < 5; i++) {
      years.push((currentYearReal + i).toString());
  }

  // === 4. FETCH DATA ===
  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (!error && data) setOrders(data);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  // === FUNGSI RESET / REFRESH TOTAL ===
  const handleRefresh = () => {
      setSearchTerm("");
      setSelectedYear(currentYearReal.toString());
      setSelectedType(null);
      fetchOrders();
  };

  // === 5. LOGIC FILTER UTAMA ===
  const filteredData = orders.filter((item) => {
    const date = new Date(item.created_at);
    const isYearMatch = date.getFullYear().toString() === selectedYear;

    const term = searchTerm.toLowerCase();
    const isTextMatch = (
        item.order_id.toLowerCase().includes(term) ||
        item.customer_name.toLowerCase().includes(term) ||
        (item.mechanic_name && item.mechanic_name.toLowerCase().includes(term))
    );

    let isStatusDone = false;
    if (term === 'selesai') {
        if (parseInt(item.status) >= 100) isStatusDone = true;
    }

    return isYearMatch && (isTextMatch || isStatusDone);
  });

  const filteredListByType = filteredData.filter((item) => item.machine_type === selectedType);

  // === 6. LOGIC GROUPING ===
  const groupedOrders: { [key: string]: any[] } = {};
  
  filteredListByType.forEach(item => {
     if (!groupedOrders[item.order_id]) {
         groupedOrders[item.order_id] = [];
     }
     groupedOrders[item.order_id].push(item);
  });

  // === 7. LOGIC SORTING GROUP (PERBAIKAN UTAMA DI SINI) ===
  // Kita urutkan KUNCI GROUP (Order ID) berdasarkan status isinya
  const sortedGroupKeys = Object.keys(groupedOrders).sort((a, b) => {
      const itemsA = groupedOrders[a];
      const itemsB = groupedOrders[b];

      // Cek apakah Order A isinya SUDAH 100% SEMUA?
      const isAllDoneA = itemsA.every((item) => (parseInt(item.status) || 0) >= 100);
      // Cek apakah Order B isinya SUDAH 100% SEMUA?
      const isAllDoneB = itemsB.every((item) => (parseInt(item.status) || 0) >= 100);

      // PRIORITAS 1: Yang BELUM selesai (Active) ditaruh di ATAS
      if (!isAllDoneA && isAllDoneB) return -1; // A naik (karena masih aktif)
      if (isAllDoneA && !isAllDoneB) return 1;  // B naik (karena masih aktif)

      // PRIORITAS 2: Jika statusnya sama (sama-sama aktif atau sama-sama selesai), urutkan Tanggal Terbaru
      const dateA = new Date(itemsA[0].created_at).getTime();
      const dateB = new Date(itemsB[0].created_at).getTime();
      return dateB - dateA; // Newest First
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 relative">
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        
        {/* === HEADER & FILTER === */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            <div className="text-center md:text-left">
              <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight">Monitoring Produksi</h1>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">PT DJITOE MESINDO</p>
            </div>
            
            <div className="flex gap-2">
               <button onClick={handleRefresh} className="bg-blue-50 text-blue-600 px-4 py-2 rounded-full font-bold text-xs uppercase hover:bg-blue-100 transition-colors">
                   🔄 Refresh
               </button>
               {selectedType ? (
                   <button onClick={() => setSelectedType(null)} className="bg-slate-100 text-slate-600 px-4 py-2 rounded-full font-bold text-xs uppercase hover:bg-slate-200 transition-colors">← Kembali</button>
               ) : (
                   <button onClick={() => router.push("/")} className="bg-slate-100 text-slate-600 px-4 py-2 rounded-full font-bold text-xs uppercase hover:bg-slate-200 transition-colors">
                       🏠 Home
                   </button>
               )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-end items-center gap-3">
            <div className="relative w-full md:w-64">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                <input 
                    type="text" 
                    placeholder="Cari ID / Cust / 'Selesai'..." 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl border border-slate-200 font-bold text-slate-700 text-xs focus:outline-none focus:border-blue-500 transition shadow-inner"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="w-full md:w-auto">
                <select value={selectedYear} onChange={(e)=>setSelectedYear(e.target.value)} className="w-full p-3 bg-slate-100 rounded-xl font-bold text-sm outline-none text-center md:text-right cursor-pointer border border-slate-200">
                    {years.map(y => <option key={y} value={y}>Tahun {y}</option>)}
                </select>
            </div>
          </div>
        </div>

        {/* === VIEW 1: KARTU KATEGORI === */}
        {!selectedType && (
            <div className="space-y-8 animate-in fade-in duration-500">
                {searchTerm && (
                    <div className="text-center mb-4">
                        <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold">
                            🔍 Menampilkan hasil pencarian: "{searchTerm}"
                        </span>
                    </div>
                )}

                {MACHINE_CATEGORIES.map((cat) => (
                    <div key={cat.id}>
                        <div className="flex items-center mb-4">
                            <div className="h-1 w-10 bg-slate-300 rounded-full mr-3"></div>
                            <span className="text-sm font-black text-slate-400 tracking-widest uppercase">{cat.title}</span>
                            <div className="h-px bg-slate-200 flex-1 ml-4"></div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {cat.types.map((type) => {
                                const count = filteredData.filter(o => o.machine_type === type).length;
                                return (
                                    <button key={type} onClick={() => setSelectedType(type)}
                                        className={`p-5 rounded-[1.5rem] text-left transition-all border shadow-sm hover:scale-[1.02] active:scale-95
                                            ${count > 0 ? 'bg-white border-blue-200 shadow-blue-100 ring-2 ring-blue-50' : 'bg-slate-50 border-slate-100 opacity-80'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase ${count > 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'}`}>
                                                {count > 0 ? `${count} Unit` : '0 Unit'}
                                            </span>
                                            {count > 0 && <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>}
                                        </div>
                                        <h3 className={`font-black uppercase text-sm ${count > 0 ? 'text-slate-800' : 'text-slate-400'}`}>{type}</h3>
                                        <p className="text-[10px] text-slate-400 font-bold mt-1">{count > 0 ? "Klik untuk detail →" : "Tidak ada data"}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* === VIEW 2: LIST ORDER (GROUPING + SORTING SUPER SMART) === */}
        {selectedType && (
             <div className="space-y-6 animate-in slide-in-from-right duration-300">
                <div className="flex items-center gap-2 mb-2">
                    <span className="bg-slate-800 text-white px-3 py-1 rounded-lg text-xs font-bold uppercase">{selectedType}</span>
                    <span className="text-slate-400 text-xs font-bold">List Order Tahun {selectedYear}</span>
                </div>

                {sortedGroupKeys.length === 0 ? (
                    <div className="text-center p-20 text-slate-400 font-bold border-2 border-dashed rounded-[2rem] bg-white">
                        📂 Tidak ada data ditemukan.
                    </div>
                ) : (
                    sortedGroupKeys.map((orderId) => {
                        const itemsRaw = groupedOrders[orderId];
                        
                        // Sorting INTERNAL (Per Mesin di dalam Kartu)
                        const itemsSorted = itemsRaw.sort((a: any, b: any) => {
                            const statA = parseInt(a.status) || 0;
                            const statB = parseInt(b.status) || 0;
                            if (statA < 100 && statB >= 100) return -1;
                            if (statA >= 100 && statB < 100) return 1;
                            return 0;
                        });

                        const firstItem = itemsSorted[0];
                        // Cek apakah SATU GROUP ini sudah selesai semua?
                        const isGroupFullDone = itemsSorted.every((i: any) => (parseInt(i.status) || 0) >= 100);
                        
                        return (
                            <div key={orderId} className={`bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden transition-all
                                ${isGroupFullDone ? 'opacity-60 grayscale-[0.5] hover:opacity-100 hover:grayscale-0' : ''}`}>
                                
                                {/* HEADER GROUP */}
                                <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-black text-slate-800 uppercase text-lg leading-none">{firstItem.customer_name}</h3>
                                        <p className="text-blue-600 font-bold text-xs mt-1">ID: {orderId}</p>
                                    </div>
                                    <div className="text-xs font-bold text-slate-400 bg-white px-3 py-1 rounded-lg border">
                                        {new Date(firstItem.created_at).toLocaleDateString("id-ID", { day: '2-digit', month: 'short' })}
                                    </div>
                                </div>

                                {/* LIST MESIN */}
                                <div className="p-2">
                                    {itemsSorted.map((item: any, index: number) => {
                                        const isDone = parseInt(item.status) >= 100;
                                        return (
                                            <div key={item.id} onClick={() => setActiveOrder(item)} 
                                                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors group mb-1 last:mb-0 border border-transparent 
                                                ${isDone ? 'bg-slate-50/50 hover:bg-slate-100' : 'hover:bg-blue-50 hover:border-blue-100'}`}>
                                                
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black 
                                                        ${isDone ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-500'}`}>
                                                        {isDone ? '✓' : index + 1}
                                                    </div>
                                                    <div>
                                                        <p className={`text-xs font-black uppercase ${isDone ? 'text-slate-400' : 'text-slate-700'}`}>
                                                            {item.machine_name || item.machine_type}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Mekanik: {item.mechanic_name || "-"}</p>
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${isDone ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-600'}`}>
                                                        {item.status}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })
                )}
             </div>
        )}

      </div>

      {/* === MODAL DETAIL === */}
      {activeOrder && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="p-4 flex justify-between items-center border-b sticky top-0 bg-white z-10 shadow-sm">
            <button onClick={() => setActiveOrder(null)} className="font-black text-slate-400 hover:text-slate-900 flex items-center gap-2"><span className="text-2xl">←</span> KEMBALI</button>
            <div className="text-center">
               <p className="text-[10px] font-black text-slate-400 uppercase">Detail Produksi</p>
               <p className="font-black text-blue-600">{activeOrder.order_id}</p>
            </div>
            <div className="w-10"></div>
          </div>

          <div className="flex-1 overflow-y-auto pb-20 bg-slate-50">
            {/* FOTO HEADER */}
            <div className="w-full h-64 bg-slate-200 relative">
               <img src={activeOrder.foto_url || "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800"} className="w-full h-full object-cover" alt="Foto Mesin" />
               <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent flex items-end p-6">
                  <div>
                    <h2 className="text-white text-2xl font-black uppercase italic">{activeOrder.machine_name || activeOrder.machine_type}</h2>
                    <p className="text-slate-300 font-bold">{activeOrder.customer_name}</p>
                  </div>
               </div>
            </div>

            {/* DETAIL TEKNIS */}
            <div className="p-6 max-w-3xl mx-auto -mt-6 relative z-10">
               <div className="bg-white p-6 rounded-[2rem] shadow-lg mb-6 grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase">Mekanik</label>
                    <p className="font-bold text-slate-800">{activeOrder.mechanic_name || "-"}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase">Estimasi Selesai</label>
                    <p className="font-bold text-slate-800">
                        {activeOrder.estimation_date 
                            ? new Date(activeOrder.estimation_date).toLocaleDateString("id-ID", { dateStyle: 'long' })
                            : "Belum Ditentukan"}
                    </p>
                  </div>
               </div>

               {/* SPESIFIKASI MESIN */}
               <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 shadow-sm mb-6">
                   <h3 className="font-black text-blue-600 uppercase text-sm mb-2 flex items-center gap-2">
                       ⚙️ Spesifikasi Mesin
                   </h3>
                   <p className="text-slate-700 text-sm font-medium leading-relaxed whitespace-pre-wrap">
                       {activeOrder.spesifikasi || "Belum ada data spesifikasi."}
                   </p>
               </div>

               {/* LAPORAN INTERNAL */}
               <div className="space-y-6">
                  <h3 className="font-black text-slate-800 uppercase text-sm pl-2 border-l-4 border-yellow-500">Laporan Internal</h3>
                  <div className="relative border-l-2 border-slate-200 ml-4 space-y-8 pb-4">
                      <div className="relative pl-8 group">
                          <div className="absolute -left-[9px] top-1 w-4 h-4 bg-yellow-400 border-4 border-yellow-100 rounded-full shadow-sm"></div>
                          <div className="bg-yellow-50 p-6 rounded-2xl shadow-sm border border-yellow-200">
                            <div className="flex justify-between items-center mb-4 border-b border-yellow-200 pb-2">
                                <span className="text-[10px] font-black text-yellow-800 uppercase tracking-widest">
                                    Last Update: {new Date(activeOrder.created_at).toLocaleDateString("id-ID")}
                                </span>
                                <span className="bg-white text-yellow-800 px-3 py-1 rounded-lg text-[10px] font-black border border-yellow-200">
                                    {activeOrder.status}
                                </span>
                            </div>
                            {activeOrder.internal_report ? (
                                <p className="text-slate-800 font-bold leading-relaxed text-sm whitespace-pre-wrap">
                                   {activeOrder.internal_report}
                                </p>
                            ) : (
                                <div className="text-center py-4 text-slate-400 italic text-xs">
                                    Belum ada laporan internal dari Admin.
                                </div>
                            )}
                          </div>
                      </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}