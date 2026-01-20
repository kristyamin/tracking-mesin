"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

// --- KONFIGURASI KARTU MESIN ---
const MACHINE_CATEGORIES = [
  {
    id: "MAKING",
    title: "MAKING MACHINE",
    types: ["S-7500", "S-7000", "S-6000E", "S-6000", "S-5000", "S-4000", "FM400"],
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
  
  // === SATPAM DI SINI ===
  useEffect(() => {
    // Cek apakah punya tiket 'boss'?
    const role = sessionStorage.getItem("user_role");
    
    if (role !== "boss") {
        // Kalau bukan boss, ke Home
        router.push("/"); 
    }
  }, []);
  
  // DATA
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState<string | null>(null); 
  const [activeOrder, setActiveOrder] = useState<any>(null); 

  // --- LOGIC TAHUN DINAMIS (NOW + 4 YEARS) ---
  const currentYearReal = new Date().getFullYear(); // Deteksi Tahun Komputer (Misal: 2026)
  const [selectedYear, setSelectedYear] = useState(currentYearReal.toString());

  const years = [];
  // Loop 5 kali: Tahun ini (0) s/d 4 tahun ke depan
  for (let i = 0; i < 5; i++) {
      years.push((currentYearReal + i).toString());
  }
  // Hasil: ["2026", "2027", "2028", "2029", "2030"] secara otomatis

  // FETCH DATA
  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (!error && data) setOrders(data);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  // FILTER LOGIC
  const ordersByDate = orders.filter((item) => {
    const date = new Date(item.created_at);
    return date.getFullYear().toString() === selectedYear;
  });

  const filteredList = ordersByDate.filter((item) => item.machine_type === selectedType);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 relative">
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        
        {/* HEADER */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            <div>
              <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight">Monitoring Produksi</h1>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">PT DJITOE MESINDO</p>
            </div>
            <div className="flex gap-2">
               <button onClick={fetchOrders} className="bg-blue-50 text-blue-600 px-4 py-2 rounded-full font-bold text-xs uppercase hover:bg-blue-100 transition-colors">Refresh</button>
               {selectedType ? (
                   <button onClick={() => setSelectedType(null)} className="bg-slate-100 text-slate-600 px-4 py-2 rounded-full font-bold text-xs uppercase hover:bg-slate-200 transition-colors">← Kembali</button>
               ) : (
                   <button onClick={() => router.push("/")} className="bg-slate-100 text-slate-600 px-4 py-2 rounded-full font-bold text-xs uppercase hover:bg-slate-200 transition-colors">
                       🏠 Home
                   </button>
               )}
            </div>
          </div>
          <div className="flex justify-end">
            <div className="w-1/3">
                <select value={selectedYear} onChange={(e)=>setSelectedYear(e.target.value)} className="w-full p-3 bg-slate-100 rounded-xl font-bold text-sm outline-none text-right">
                    {years.map(y => <option key={y} value={y}>Tahun {y}</option>)}
                </select>
            </div>
          </div>
        </div>

        {/* VIEW 1: KARTU */}
        {!selectedType && (
            <div className="space-y-8 animate-in fade-in duration-500">
                {MACHINE_CATEGORIES.map((cat) => (
                    <div key={cat.id}>
                        <div className="flex items-center mb-4">
                            <div className="h-1 w-10 bg-slate-300 rounded-full mr-3"></div>
                            <span className="text-sm font-black text-slate-400 tracking-widest uppercase">{cat.title}</span>
                            <div className="h-px bg-slate-200 flex-1 ml-4"></div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {cat.types.map((type) => {
                                const count = ordersByDate.filter(o => o.machine_type === type).length;
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
                                        <p className="text-[10px] text-slate-400 font-bold mt-1">{count > 0 ? "Klik untuk detail →" : "Tidak ada order"}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* VIEW 2: LIST */}
        {selectedType && (
             <div className="space-y-4 animate-in slide-in-from-right duration-300">
                <div className="flex items-center gap-2 mb-2">
                    <span className="bg-slate-800 text-white px-3 py-1 rounded-lg text-xs font-bold uppercase">{selectedType}</span>
                    <span className="text-slate-400 text-xs font-bold">List Order Tahun {selectedYear}</span>
                </div>

                {filteredList.length === 0 ? (
                    <div className="text-center p-20 text-slate-400 font-bold border-2 border-dashed rounded-[2rem] bg-white">📂 Tidak ada data.</div>
                ) : (
                    filteredList.map((item) => (
                      <div key={item.id} onClick={() => setActiveOrder(item)} 
                        className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-100 hover:border-blue-300 transition-all cursor-pointer flex flex-col md:grid md:grid-cols-4 items-center gap-2 group">
                        <div className="text-xs font-mono font-bold text-slate-500">{new Date(item.created_at).toLocaleDateString("id-ID", { day: '2-digit', month: 'short' })}</div>
                        <div className="font-black text-blue-700 uppercase tracking-tight text-lg">{item.order_id}</div>
                        <div className="font-bold text-slate-800 text-sm">{item.machine_name || item.machine_type}</div>
                        <div className="w-full md:w-auto flex md:justify-end">
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${parseInt(item.status) >= 100 ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-600'}`}>
                                {item.status}
                            </span>
                        </div>
                      </div>
                    ))
                )}
             </div>
        )}

      </div>

      {/* === MODAL DETAIL (KHUSUS BOSS - VERSI BERSIH) === */}
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
               <div className="bg-white p-6 rounded-[2rem] shadow-lg mb-8 grid grid-cols-2 gap-6">
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

               {/* LAPORAN KHUSUS BOSS (CLEAN VIEW) */}
               <div className="space-y-6">
                  <h3 className="font-black text-slate-800 uppercase text-sm pl-2 border-l-4 border-yellow-500">Laporan Internal</h3>
                  
                  <div className="relative border-l-2 border-slate-200 ml-4 space-y-8 pb-4">
                      <div className="relative pl-8 group">
                          {/* Indikator Kuning (Khas Laporan Internal) */}
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
                            
                            {/* ISI LAPORAN */}
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