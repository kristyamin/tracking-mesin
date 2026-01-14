"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation"; // Import Router

export default function DashboardBos() {
  const router = useRouter(); // Init Router
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // STATE LOGIN INTERNAL

  const currentYearReal = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYearReal.toString());
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
  const [activeProject, setActiveProject] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]); 

  const years = [];
  for (let y = currentYearReal + 1; y >= 2024; y--) years.push(y.toString());

  const months = [
    { value: "1", label: "Januari" }, { value: "2", label: "Februari" }, { value: "3", label: "Maret" },
    { value: "4", label: "April" }, { value: "5", label: "Mei" }, { value: "6", label: "Juni" },
    { value: "7", label: "Juli" }, { value: "8", label: "Agustus" }, { value: "9", label: "September" },
    { value: "10", label: "Oktober" }, { value: "11", label: "November" }, { value: "12", label: "Desember" }
  ];

  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
    if (!error) setProjects(data);
    setLoading(false);
  };

  const openDetail = async (project: any) => {
    setActiveProject(project);
    const { data } = await supabase
      .from("project_logs")
      .select("*")
      .eq("id_pesanan", project.id_pesanan)
      .order("created_at", { ascending: false });
    if (data) setLogs(data); else setLogs([]);
  };

  // Langsung fetch data saat halaman dibuka (Tanpa cek login lagi)
  useEffect(() => { 
    fetchProjects(); 
  }, []);

  const filteredProjects = projects.filter((item) => {
    const date = new Date(item.created_at);
    return date.getFullYear().toString() === selectedYear && (date.getMonth() + 1).toString() === selectedMonth;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 relative">
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        
        {/* HEADER */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight">Monitoring Produksi</h1>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">PT DJITOE MESINDO</p>
            </div>
            <div className="flex gap-2">
               {/* TOMBOL REFRESH */}
               <button onClick={fetchProjects} className="bg-blue-50 text-blue-600 px-4 py-2 rounded-full font-bold text-xs uppercase hover:bg-blue-100 transition-colors">Refresh</button>
               
               {/* TOMBOL KEMBALI KE MENU UTAMA (PENGGANTI LOGOUT) */}
               <button onClick={() => router.push("/")} className="bg-slate-100 text-slate-600 px-4 py-2 rounded-full font-bold text-xs uppercase hover:bg-slate-200 transition-colors">
                 🏠 Menu Utama
               </button>
            </div>
          </div>
          <div className="flex gap-3">
            <select value={selectedMonth} onChange={(e)=>setSelectedMonth(e.target.value)} className="flex-1 p-3 bg-slate-100 rounded-xl font-bold text-sm outline-none">{months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}</select>
            <select value={selectedYear} onChange={(e)=>setSelectedYear(e.target.value)} className="flex-1 p-3 bg-slate-100 rounded-xl font-bold text-sm outline-none">{years.map(y => <option key={y} value={y}>{y}</option>)}</select>
          </div>
        </div>

        {/* LIST DATA */}
        <div className="space-y-3">
          {filteredProjects.length === 0 ? (
            <div className="text-center p-20 text-slate-400 font-bold border-2 border-dashed rounded-[2rem]">📂 Belum ada data</div>
          ) : (
            filteredProjects.map((item) => (
              <div key={item.id} onClick={() => openDetail(item)} 
                className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-100 hover:border-blue-300 transition-all cursor-pointer flex flex-col md:grid md:grid-cols-4 items-center gap-2 group">
                <div className="text-xs font-mono font-bold text-slate-500">{new Date(item.created_at).toLocaleDateString("id-ID", { day: '2-digit', month: 'short' })}</div>
                <div className="font-black text-blue-700 uppercase tracking-tight">{item.id_pesanan}</div>
                <div className="font-bold text-slate-800 text-sm">{item.customer}</div>
                <div className="w-full md:w-auto flex md:justify-end">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${item.progress >= 100 ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-600'}`}>
                    {item.progress}% - {item.progress >= 100 ? (item.status_pengiriman || 'Siap') : 'Proses'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL DETAIL FULL SCREEN */}
      {activeProject && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="p-4 flex justify-between items-center border-b sticky top-0 bg-white z-10 shadow-sm">
            <button onClick={() => setActiveProject(null)} className="font-black text-slate-400 hover:text-slate-900 flex items-center gap-2"><span className="text-2xl">←</span> KEMBALI</button>
            <div className="text-center">
               <p className="text-[10px] font-black text-slate-400 uppercase">Detail Log Mesin</p>
               <p className="font-black text-blue-600">{activeProject.id_pesanan}</p>
            </div>
            <div className="w-10"></div>
          </div>

          <div className="flex-1 overflow-y-auto pb-20 bg-slate-50">
            {/* Foto Header */}
            <div className="w-full h-64 bg-slate-200 relative">
               <img src={activeProject.foto_url || "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800"} className="w-full h-full object-cover" alt="Foto" />
               <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent flex items-end p-6">
                  <div>
                    <h2 className="text-white text-2xl font-black uppercase italic">{activeProject.nama_mesin}</h2>
                    <p className="text-slate-300 font-bold">{activeProject.customer}</p>
                  </div>
               </div>
            </div>

            <div className="p-6 max-w-3xl mx-auto -mt-6 relative z-10">
               <div className="bg-white p-6 rounded-[2rem] shadow-lg mb-8 grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase">Mekanik</label>
                    <p className="font-bold text-slate-800">{activeProject.mekanik}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase">Estimasi</label>
                    <p className="font-bold text-slate-800">
                       {activeProject.tanggal_selesai ? "Selesai ✅" : "Sedang Dikerjakan ⏳"}
                    </p>
                  </div>
               </div>

               {/* TIMELINE RIWAYAT */}
               <div className="space-y-6">
                 <h3 className="font-black text-slate-800 uppercase text-sm pl-2 border-l-4 border-blue-600">Riwayat Pengerjaan (Log Internal)</h3>
                 
                 {logs.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 italic bg-white rounded-2xl border">Belum ada catatan log dari Admin.</div>
                 ) : (
                    <div className="relative border-l-2 border-slate-200 ml-4 space-y-8 pb-4">
                       {logs.map((log) => (
                          <div key={log.id} className="relative pl-8 group">
                             <div className="absolute -left-[9px] top-1 w-4 h-4 bg-white border-4 border-blue-400 rounded-full group-hover:border-blue-600 transition-colors"></div>
                             <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 group-hover:shadow-md transition-all">
                                <div className="flex justify-between items-center mb-2 border-b border-slate-50 pb-2">
                                   <div className="flex flex-col">
                                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        {new Date(log.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                                      </span>
                                      <span className="text-[9px] font-bold text-slate-300 font-mono">
                                        Pukul {new Date(log.created_at).toLocaleTimeString("id-ID", {hour: '2-digit', minute:'2-digit'})} WIB
                                      </span>
                                   </div>
                                   <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-lg text-[10px] font-black">
                                      {log.progress_log}%
                                   </span>
                                </div>
                                <p className="text-slate-800 font-medium leading-relaxed text-sm">
                                   {log.pesan_update}
                                </p>
                             </div>
                          </div>
                       ))}
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