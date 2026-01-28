"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

// --- 1. KAMUS BAHASA (TRANSLATION) ---
const TRANSLATIONS = {
  ID: {
    title: "Monitoring Produksi",
    subtitle: "PT DJITOE MESINDO",
    refresh: "🔄 Refresh",
    back: "← Kembali",
    home: "🏠 Beranda",
    searchPlaceholder: "Cari ID / Cust / 'Selesai'...",
    searchResult: "🔍 Hasil pencarian:",
    active: "Aktif",
    total: "Total",
    clickDetail: "Klik untuk detail →",
    noData: "Tidak ada data",
    listTitle: "Daftar Order Tahun",
    emptyFolder: "📂 Tidak ada data ditemukan.",
    detailTitle: "Detail Produksi",
    mechanic: "Mekanik",
    electrical: "Electrical",
    estimation: "Estimasi Selesai",
    notSet: "Belum Ditentukan",
    specTitle: "⚙️ Spesifikasi Mesin",
    noSpec: "Belum ada data spesifikasi.",
    reportTitle: "Laporan Internal",
    lastUpdate: "TERAKHIR UPDATE:",
    noReport: "Belum ada laporan internal.",
    btnMechanic: "Laporan Mekanik",
    btnElectric: "Laporan Electrical",
  },
  EN: {
    title: "Production Monitoring",
    subtitle: "PT DJITOE MESINDO",
    refresh: "🔄 Refresh",
    back: "← Back",
    home: "🏠 Home",
    searchPlaceholder: "Search ID / Cust / 'Done'...",
    searchResult: "🔍 Search results:",
    active: "Active",
    total: "Total",
    clickDetail: "Click for details →",
    noData: "No data",
    listTitle: "Order List Year",
    emptyFolder: "📂 No data found.",
    detailTitle: "Production Details",
    mechanic: "Mechanic",
    electrical: "Electrical",
    estimation: "Est. Completion",
    notSet: "Not Set",
    specTitle: "⚙️ Machine Specs",
    noSpec: "No specification data available.",
    reportTitle: "Internal Report",
    lastUpdate: "LAST UPDATE:",
    noReport: "No internal report.",
    btnMechanic: "Mechanic Report",
    btnElectric: "Electrical Report",
  }
};

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
  
  // === STATE BAHASA (Default ID) ===
  const [lang, setLang] = useState<"ID" | "EN">("ID"); 
  const t = TRANSLATIONS[lang]; 

  // === SATPAM ===
  useEffect(() => {
    const role = sessionStorage.getItem("user_role");
    if (role !== "boss") router.push("/"); 
  }, []);
  
  // === STATE DATA ===
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState<string | null>(null); 
  const [activeOrder, setActiveOrder] = useState<any>(null); 
  
  // STATE TAB LAPORAN (null = hidden, 'MECHANIC', 'ELECTRIC')
  const [reportTab, setReportTab] = useState<"MECHANIC" | "ELECTRIC" | null>(null);

  // === FILTER & SEARCH ===
  const currentYearReal = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYearReal.toString());
  const [searchTerm, setSearchTerm] = useState(""); 

  const years = [];
  for (let i = 0; i < 5; i++) years.push((currentYearReal + i).toString());

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (!error && data) setOrders(data);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  // Reset tab saat ganti order
  useEffect(() => {
    if (!activeOrder) setReportTab(null);
  }, [activeOrder]);

  const handleRefresh = () => {
      setSearchTerm("");
      setSelectedYear(currentYearReal.toString());
      setSelectedType(null);
      fetchOrders();
  };

  // === LOGIC FILTER ===
  const filteredData = orders.filter((item) => {
    const date = new Date(item.created_at);
    const isYearMatch = date.getFullYear().toString() === selectedYear;

    const term = searchTerm.toLowerCase();
    const isTextMatch = (
        item.order_id.toLowerCase().includes(term) ||
        item.customer_name.toLowerCase().includes(term) ||
        (item.mechanic_name && item.mechanic_name.toLowerCase().includes(term))
    );

    // LOGIC SPESIAL "SELESAI" / "DONE"
    // Syarat: Mekanik 100% DAN Listrik 100%
    let isStatusDone = false;
    if (term === 'selesai' || term === 'done' || term === 'finished') {
        const mechProg = parseInt(item.status) || 0; // Mengambil dari status persen admin
        const elecProg = item.progress_listrik || 0;
        if (mechProg >= 100 && elecProg >= 100) isStatusDone = true;
    }

    return isYearMatch && (isTextMatch || isStatusDone);
  });

  const filteredListByType = filteredData.filter((item) => item.machine_type === selectedType);

  // === GROUPING & SORTING ===
  const groupedOrders: { [key: string]: any[] } = {};
  filteredListByType.forEach(item => {
     if (!groupedOrders[item.order_id]) groupedOrders[item.order_id] = [];
     groupedOrders[item.order_id].push(item);
  });

  const sortedGroupKeys = Object.keys(groupedOrders).sort((a, b) => {
      const itemsA = groupedOrders[a];
      const itemsB = groupedOrders[b];
      // Cek Done jika kedua progress 100
      const isAllDoneA = itemsA.every((item) => (parseInt(item.status)||0) >= 100 && (item.progress_listrik||0) >= 100);
      const isAllDoneB = itemsB.every((item) => (parseInt(item.status)||0) >= 100 && (item.progress_listrik||0) >= 100);

      if (!isAllDoneA && isAllDoneB) return -1; 
      if (isAllDoneA && !isAllDoneB) return 1;  

      const dateA = new Date(itemsA[0].created_at).getTime();
      const dateB = new Date(itemsB[0].created_at).getTime();
      return dateB - dateA; 
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 relative">
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        
        {/* === HEADER & FILTER === */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            <div className="text-center md:text-left">
              <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight">{t.title}</h1>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">{t.subtitle}</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
               <div className="bg-slate-100 p-1 rounded-full flex items-center border border-slate-200">
                   <button onClick={() => setLang("ID")} className={`px-3 py-1 rounded-full text-[10px] font-black transition-all ${lang === 'ID' ? 'bg-white shadow text-slate-900' : 'text-slate-400'}`}>ID 🇮🇩</button>
                   <button onClick={() => setLang("EN")} className={`px-3 py-1 rounded-full text-[10px] font-black transition-all ${lang === 'EN' ? 'bg-white shadow text-slate-900' : 'text-slate-400'}`}>EN 🇬🇧</button>
               </div>
               <button onClick={handleRefresh} className="bg-blue-50 text-blue-600 px-4 py-2 rounded-full font-bold text-xs uppercase hover:bg-blue-100 transition-colors">{t.refresh}</button>
               {selectedType ? (
                   <button onClick={() => setSelectedType(null)} className="bg-slate-100 text-slate-600 px-4 py-2 rounded-full font-bold text-xs uppercase hover:bg-slate-200 transition-colors">{t.back}</button>
               ) : (
                   <button onClick={() => router.push("/")} className="bg-slate-100 text-slate-600 px-4 py-2 rounded-full font-bold text-xs uppercase hover:bg-slate-200 transition-colors">{t.home}</button>
               )}
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-end items-center gap-3">
            <div className="relative w-full md:w-64">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                <input type="text" placeholder={t.searchPlaceholder} 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl border border-slate-200 font-bold text-slate-700 text-xs focus:outline-none focus:border-blue-500 transition shadow-inner"
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="w-full md:w-auto">
                <select value={selectedYear} onChange={(e)=>setSelectedYear(e.target.value)} className="w-full p-3 bg-slate-100 rounded-xl font-bold text-sm outline-none text-center md:text-right cursor-pointer border border-slate-200">
                    {years.map(y => <option key={y} value={y}>{lang === 'ID' ? 'Tahun' : 'Year'} {y}</option>)}
                </select>
            </div>
          </div>
        </div>

        {/* === VIEW 1: KARTU KATEGORI === */}
        {!selectedType && (
            <div className="space-y-8 animate-in fade-in duration-500">
                {searchTerm && (
                    <div className="text-center mb-4">
                        <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold">{t.searchResult} "{searchTerm}"</span>
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
                                                {count > 0 ? `${count} Unit` : `0 Unit`}
                                            </span>
                                            {count > 0 && <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>}
                                        </div>
                                        <h3 className={`font-black uppercase text-sm ${count > 0 ? 'text-slate-800' : 'text-slate-400'}`}>{type}</h3>
                                        <p className="text-[10px] text-slate-400 font-bold mt-1">{count > 0 ? t.clickDetail : t.noData}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* === VIEW 2: LIST ORDER (UPDATE: 2 PIC & 2 PROGRESS) === */}
        {selectedType && (
             <div className="space-y-6 animate-in slide-in-from-right duration-300">
                <div className="flex items-center gap-2 mb-2">
                    <span className="bg-slate-800 text-white px-3 py-1 rounded-lg text-xs font-bold uppercase">{selectedType}</span>
                    <span className="text-slate-400 text-xs font-bold">{t.listTitle} {selectedYear}</span>
                </div>

                {sortedGroupKeys.length === 0 ? (
                    <div className="text-center p-20 text-slate-400 font-bold border-2 border-dashed rounded-[2rem] bg-white">{t.emptyFolder}</div>
                ) : (
                    sortedGroupKeys.map((orderId) => {
                        const itemsRaw = groupedOrders[orderId];
                        const itemsSorted = itemsRaw.sort((a: any, b: any) => {
                            const statA = parseInt(a.status) || 0;
                            const statB = parseInt(b.status) || 0;
                            if (statA < 100 && statB >= 100) return -1;
                            if (statA >= 100 && statB < 100) return 1;
                            return 0;
                        });
                        const firstItem = itemsSorted[0];
                        // Logic Full Done: Mekanik 100% & Listrik 100%
                        const isGroupFullDone = itemsSorted.every((i: any) => (parseInt(i.status) || 0) >= 100 && (i.progress_listrik || 0) >= 100);
                        
                        return (
                            <div key={orderId} className={`bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden transition-all
                                ${isGroupFullDone ? 'opacity-60 grayscale-[0.5] hover:opacity-100 hover:grayscale-0' : ''}`}>
                                
                                <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-black text-slate-800 uppercase text-lg leading-none">{firstItem.customer_name}</h3>
                                        <p className="text-blue-600 font-bold text-xs mt-1">ID: {orderId}</p>
                                    </div>
                                    <div className="text-xs font-bold text-slate-400 bg-white px-3 py-1 rounded-lg border">
                                        {new Date(firstItem.created_at).toLocaleDateString("id-ID", { day: '2-digit', month: 'short' })}
                                    </div>
                                </div>

                                <div className="p-2">
                                    {itemsSorted.map((item: any, index: number) => {
                                        // Done per item
                                        const isDone = (parseInt(item.status) >= 100) && ((item.progress_listrik || 0) >= 100);
                                        return (
                                            <div key={item.id} onClick={() => setActiveOrder(item)} 
                                                className={`flex flex-col md:flex-row items-start md:items-center justify-between p-3 rounded-xl cursor-pointer transition-colors group mb-1 last:mb-0 border border-transparent 
                                                ${isDone ? 'bg-slate-50/50 hover:bg-slate-100' : 'hover:bg-blue-50 hover:border-blue-100'}`}>
                                                
                                                <div className="flex items-center gap-3 w-full md:w-auto">
                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 
                                                        ${isDone ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-500'}`}>
                                                        {isDone ? '✓' : index + 1}
                                                    </div>
                                                    <div>
                                                        <p className={`text-xs font-black uppercase ${isDone ? 'text-slate-400' : 'text-slate-700'}`}>
                                                            {item.machine_name || item.machine_type}
                                                        </p>
                                                        {/* UPDATE: TAMPILKAN MEKANIK & LISTRIK */}
                                                        <div className="flex flex-col gap-0.5 mt-1">
                                                            <p className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                                                <span>🔧</span> {item.mechanic_name || "-"}
                                                            </p>
                                                            <p className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                                                <span>⚡</span> {item.pic_listrik || "-"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* UPDATE: 2 PROGRESS BAR / BADGE */}
                                                <div className="flex gap-2 mt-2 md:mt-0 w-full md:w-auto justify-end">
                                                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase flex items-center gap-1
                                                        ${parseInt(item.status) >= 100 ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'}`}>
                                                        🔧 {item.status || "0%"}
                                                    </span>
                                                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase flex items-center gap-1
                                                        ${(item.progress_listrik || 0) >= 100 ? 'bg-yellow-500 text-white' : 'bg-yellow-100 text-yellow-700'}`}>
                                                        ⚡ {item.progress_listrik || 0}%
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
            <button onClick={() => setActiveOrder(null)} className="font-black text-slate-400 hover:text-slate-900 flex items-center gap-2"><span className="text-2xl">←</span> {t.back}</button>
            <div className="text-center">
               <p className="text-[10px] font-black text-slate-400 uppercase">{t.detailTitle}</p>
               <p className="font-black text-blue-600">{activeOrder.order_id}</p>
            </div>
            <div className="w-10"></div>
          </div>

          <div className="flex-1 overflow-y-auto pb-20 bg-slate-50">
            <div className="w-full h-64 bg-slate-200 relative">
               <img src={activeOrder.foto_url || "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800"} className="w-full h-full object-cover" alt="Foto Mesin" />
               <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent flex items-end p-6">
                  <div>
                    <h2 className="text-white text-2xl font-black uppercase italic">{activeOrder.machine_name || activeOrder.machine_type}</h2>
                    <p className="text-slate-300 font-bold">{activeOrder.customer_name}</p>
                  </div>
               </div>
            </div>

            <div className="p-6 max-w-4xl mx-auto -mt-6 relative z-10">
               
               {/* 1. INFO PIC LENGKAP (3 KOLOM) */}
               <div className="bg-white p-6 rounded-[2rem] shadow-lg mb-6 grid grid-cols-3 gap-6 text-center divide-x divide-slate-100">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">{t.mechanic}</label>
                    <p className="font-bold text-slate-800 text-sm">{activeOrder.mechanic_name || "-"}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">{t.electrical}</label>
                    <p className="font-bold text-slate-800 text-sm">{activeOrder.pic_listrik || t.notSet}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">{t.estimation}</label>
                    <p className="font-bold text-slate-800 text-sm">
                        {activeOrder.estimation_date 
                            ? new Date(activeOrder.estimation_date).toLocaleDateString(lang === "ID" ? "id-ID" : "en-US", { dateStyle: 'long' })
                            : t.notSet}
                    </p>
                  </div>
               </div>

               {/* 2. SPESIFIKASI */}
               <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 shadow-sm mb-6">
                   <h3 className="font-black text-blue-600 uppercase text-sm mb-2 flex items-center gap-2">
                       {t.specTitle}
                   </h3>
                   <p className="text-slate-700 text-sm font-medium leading-relaxed whitespace-pre-wrap">
                       {activeOrder.spesifikasi || t.noSpec}
                   </p>
               </div>

               {/* 3. LAPORAN DENGAN TOMBOL (AWALNYA HILANG, DIKLIK MUNCUL) */}
               <div>
                  <div className="flex items-center gap-2 mb-4">
                      <div className="h-6 w-1 bg-slate-800 rounded-full"></div>
                      <h3 className="font-black text-slate-800 uppercase text-sm">{t.reportTitle}</h3>
                  </div>

                  {/* TOMBOL PILIHAN */}
                  <div className="flex gap-0 border border-slate-300 rounded-xl overflow-hidden mb-6 bg-white">
                      <button 
                        onClick={() => setReportTab(reportTab === 'MECHANIC' ? null : 'MECHANIC')}
                        className={`flex-1 py-4 font-bold text-xs uppercase transition-all border-r border-slate-200
                        ${reportTab === 'MECHANIC' ? 'bg-slate-100 text-slate-900 inner-shadow' : 'text-slate-400 hover:bg-slate-50'}`}>
                        {t.btnMechanic}
                      </button>
                      <button 
                        onClick={() => setReportTab(reportTab === 'ELECTRIC' ? null : 'ELECTRIC')}
                        className={`flex-1 py-4 font-bold text-xs uppercase transition-all
                        ${reportTab === 'ELECTRIC' ? 'bg-slate-100 text-slate-900 inner-shadow' : 'text-slate-400 hover:bg-slate-50'}`}>
                        {t.btnElectric}
                      </button>
                  </div>

                  {/* AREA KONTEN LAPORAN (MUNCUL JIKA DIKLIK) */}
                  {reportTab && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                          
                          {/* LAPORAN MEKANIK (KARTU KUNING - DESIGN LAMA) */}
                          {reportTab === 'MECHANIC' && (
                              <div className="relative pl-6 group">
                                  <div className="absolute -left-[7px] top-1 w-4 h-4 bg-yellow-400 border-4 border-white rounded-full shadow-sm z-10"></div>
                                  <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-slate-200"></div>
                                  
                                  <div className="bg-[#FFFBEB] p-6 rounded-2xl border border-yellow-200 shadow-sm">
                                    <div className="flex justify-between items-center mb-4 border-b border-yellow-200 pb-3">
                                        <span className="text-[10px] font-black text-yellow-800 uppercase tracking-widest">
                                            {t.lastUpdate} {new Date(activeOrder.created_at).toLocaleDateString(lang === "ID" ? "id-ID" : "en-US")}
                                        </span>
                                        <span className="bg-white text-yellow-800 px-3 py-1 rounded-lg text-[10px] font-black border border-yellow-200 shadow-sm">
                                            {activeOrder.status || "0%"}
                                        </span>
                                    </div>
                                    {/* ISI LAPORAN MEKANIK (HISTORY LOG) */}
                                    {activeOrder.internal_report ? (
                                        <p className="text-slate-800 font-bold leading-relaxed text-sm whitespace-pre-wrap">
                                            {activeOrder.internal_report}
                                        </p>
                                    ) : (
                                        <div className="text-center py-4 text-slate-400 italic text-xs">{t.noReport}</div>
                                    )}
                                  </div>
                              </div>
                          )}

                          {/* LAPORAN ELECTRICAL (KARTU BIRU - BIAR BEDA) */}
                          {reportTab === 'ELECTRIC' && (
                              <div className="relative pl-6 group">
                                  <div className="absolute -left-[7px] top-1 w-4 h-4 bg-blue-400 border-4 border-white rounded-full shadow-sm z-10"></div>
                                  <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-slate-200"></div>

                                  <div className="bg-[#EFF6FF] p-6 rounded-2xl border border-blue-200 shadow-sm">
                                    <div className="flex justify-between items-center mb-4 border-b border-blue-200 pb-3">
                                        <span className="text-[10px] font-black text-blue-800 uppercase tracking-widest">
                                            {t.lastUpdate} {new Date(activeOrder.created_at).toLocaleDateString(lang === "ID" ? "id-ID" : "en-US")}
                                        </span>
                                        <span className="bg-white text-blue-800 px-3 py-1 rounded-lg text-[10px] font-black border border-blue-200 shadow-sm">
                                            {activeOrder.progress_listrik || 0}%
                                        </span>
                                    </div>
                                    {/* ISI LAPORAN ELECTRICAL (HISTORY LOG) */}
                                    {activeOrder.note_listrik ? (
                                        <p className="text-slate-800 font-bold leading-relaxed text-sm whitespace-pre-wrap">
                                            {activeOrder.note_listrik}
                                        </p>
                                    ) : (
                                        <div className="text-center py-4 text-slate-400 italic text-xs">{t.noReport}</div>
                                    )}
                                  </div>
                              </div>
                          )}

                      </div>
                  )}

               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}