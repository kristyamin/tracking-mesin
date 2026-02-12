"use client";
import { useState } from "react";

export default function TabAPAR({ 
  aparList, acList, role, 
  onAddAPAR, onEditAPAR, 
  onAddAC, onEditAC, 
  onDelete, onPrint, searchTerm 
}: any) {
  
  // STATE UTAMA: MENU PILIHAN (APAR / AC)
  const [module, setModule] = useState<"MENU" | "APAR" | "AC">("MENU");

  // STATE NAVIGASI DALAM MODUL: LOCATION -> LIST
  const [viewStep, setViewStep] = useState<"LOCATION" | "LIST">("LOCATION");
  const [selectedLoc, setSelectedLoc] = useState("");

  // STATE FILTER AREA (TAMBAHAN BARU)
  const [filterArea, setFilterArea] = useState("ALL");

  // --- HELPER ---
  const formatDateIndo = (dateString: string) => { 
      if (!dateString) return "-";
      return new Date(dateString).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }); 
  };

  const getStatusColorAPAR = (cond: string) => {
      if (cond === 'BAIK') return 'bg-green-100 text-green-700 border-green-200';
      if (cond === 'KURANG TEKANAN') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      return 'bg-red-100 text-red-700 border-red-200';
  };

  const getServiceStatusAC = (dateString: string) => {
      if (!dateString) return <span className="text-gray-300 text-[10px]">Belum dijadwalkan</span>;
      const today = new Date();
      today.setHours(0,0,0,0);
      const svcDate = new Date(dateString);
      const diff = Math.ceil((svcDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

      if (diff < 0) return <span className="text-red-600 font-black animate-pulse">⚠️ LEWAT {Math.abs(diff)} HARI</span>;
      if (diff <= 7) return <span className="text-orange-600 font-black">🟠 {diff} Hari Lagi</span>;
      return <span className="text-green-600 font-bold">🟢 {formatDateIndo(dateString)}</span>;
  };

  // --- FILTER DATA (SUDAH DITAMBAH LOGIC FILTER AREA) ---
  const filteredAPAR = (aparList || []).filter((item: any) => {
      let pass = item.lokasi === selectedLoc;
      
      // Filter Area (WS 1, WS 2...)
      if (filterArea !== "ALL") {
          pass = pass && item.detail_lokasi?.toUpperCase().includes(filterArea);
      }

      if (searchTerm) {
          const term = searchTerm.toLowerCase();
          pass = pass && (item.nomor_tabung?.toLowerCase().includes(term) || item.detail_lokasi?.toLowerCase().includes(term));
      }
      return pass;
  });

  const filteredAC = (acList || []).filter((item: any) => {
      let pass = item.lokasi === selectedLoc;
      
      // Filter Area
      if (filterArea !== "ALL") {
          pass = pass && item.detail_lokasi?.toUpperCase().includes(filterArea);
      }

      if (searchTerm) {
          const term = searchTerm.toLowerCase();
          pass = pass && (item.brand?.toLowerCase().includes(term) || item.detail_lokasi?.toLowerCase().includes(term));
      }
      return pass;
  });

  return (
    <div className="animate-in fade-in pb-20">
      
      {/* === LEVEL 0: MENU UTAMA (PILIH APAR / AC) === */}
      {module === "MENU" && (
        <div className="grid grid-cols-2 gap-4 mt-4">
            {/* KARTU MENU APAR */}
            <div onClick={() => { setModule("APAR"); setViewStep("LOCATION"); }} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-red-400 transition cursor-pointer group relative overflow-hidden min-h-[180px] flex flex-col justify-between">
                <div className="absolute -right-6 -top-6 text-9xl opacity-5 group-hover:scale-110 transition grayscale group-hover:grayscale-0">🔥</div>
                <div>
                    <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-2xl mb-3 shadow-sm group-hover:scale-110 transition">🧯</div>
                    <h3 className="font-black text-slate-800 text-xl uppercase">APAR</h3>
                    <p className="text-xs text-slate-400 font-bold mt-1">Pemadam Api Ringan</p>
                </div>
                <div className="flex justify-between items-end">
                    <span className="text-3xl font-black text-slate-800">{(aparList || []).length}</span>
                    <span className="text-[10px] bg-slate-100 px-2 py-1 rounded font-bold text-slate-500">Unit Terdata</span>
                </div>
            </div>

            {/* KARTU MENU AC */}
            <div onClick={() => { setModule("AC"); setViewStep("LOCATION"); }} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-400 transition cursor-pointer group relative overflow-hidden min-h-[180px] flex flex-col justify-between">
                <div className="absolute -right-6 -top-6 text-9xl opacity-5 group-hover:scale-110 transition grayscale group-hover:grayscale-0">❄️</div>
                <div>
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl mb-3 shadow-sm group-hover:scale-110 transition">❄️</div>
                    <h3 className="font-black text-slate-800 text-xl uppercase">Air Conditioner</h3>
                    <p className="text-xs text-slate-400 font-bold mt-1">Pendingin Ruangan</p>
                </div>
                <div className="flex justify-between items-end">
                    <span className="text-3xl font-black text-slate-800">{(acList || []).length}</span>
                    <span className="text-[10px] bg-slate-100 px-2 py-1 rounded font-bold text-slate-500">Unit Terdata</span>
                </div>
            </div>
        </div>
      )}

      {/* === LEVEL 1 & 2: MODUL AKTIF (APAR ATAU AC) === */}
      {module !== "MENU" && (
        <>
            {/* HEADER NAVIGASI (TOMBOL BACK) */}
            <div className="flex items-center gap-4 mb-6">
                <button 
                    onClick={() => {
                        if (viewStep === "LIST") {
                            setViewStep("LOCATION");
                            setFilterArea("ALL"); // Reset filter saat kembali
                        } else {
                            setModule("MENU");
                        }
                    }} 
                    className="w-10 h-10 bg-white rounded-full shadow-sm border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition text-slate-600 font-black text-xl"
                >
                    ⬅
                </button>
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{module === 'APAR' ? 'LOKASI APAR:' : 'LOKASI AC:'}</p>
                    <h2 className="text-lg font-black text-slate-800 uppercase leading-none">{viewStep === "LOCATION" ? "PILIH AREA" : selectedLoc}</h2>
                </div>
            </div>

            {/* STEP 1: PILIH LOKASI (CARD STYLE) */}
            {viewStep === "LOCATION" && (
                <div className="space-y-6 mt-6">
                    <div className="flex justify-between items-end px-4">
                        <h3 className="font-black text-slate-700 uppercase">PILIH DEPARTEMEN</h3>
                        {role === 'mess_admin' && (
                            <button onClick={module === 'APAR' ? onAddAPAR : onAddAC} className={`text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg transition ${module === 'APAR' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                                {module === 'APAR' ? '+ APAR BARU' : '+ AC BARU'}
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {['TANJUNG UNCANG', 'SEKUPANG', 'MEGA CIPTA'].map((loc) => {
                            const count = module === 'APAR' 
                                ? (aparList || []).filter((i:any) => i.lokasi === loc).length
                                : (acList || []).filter((i:any) => i.lokasi === loc).length;
                            
                            return (
                                <div key={loc} onClick={() => { setSelectedLoc(loc); setViewStep("LIST"); }} className={`bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg cursor-pointer transition relative overflow-hidden group ${module === 'APAR' ? 'hover:border-red-400' : 'hover:border-blue-400'}`}>
                                    <div className="absolute -right-4 -top-4 text-6xl opacity-5 grayscale group-hover:scale-110 transition">{module === 'APAR' ? '🔥' : '❄️'}</div>
                                    <h4 className="font-black text-slate-800 text-lg">{loc}</h4>
                                    <p className={`text-xs font-bold mt-1 ${module === 'APAR' ? 'text-red-600' : 'text-blue-600'}`}>{count} Unit {module}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* STEP 2: LIST DATA */}
            {viewStep === "LIST" && (
                <div className="space-y-4">
                    
                    {/*  FITUR FILTER */}
                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
                        {["ALL", "WS 1", "WS 2", "WS 3", "WS 4"].map((area) => (
                            <button 
                                key={area}
                                onClick={() => setFilterArea(area)}
                                className={`
                                    px-4 py-2 rounded-xl text-[10px] md:text-xs font-black uppercase whitespace-nowrap transition shadow-sm border
                                    ${filterArea === area 
                                        ? (module === "APAR" ? "bg-red-600 text-white border-red-600 shadow-red-200" : "bg-blue-600 text-white border-blue-600 shadow-blue-200") 
                                        : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"}
                                `}
                            >
                                {area === "ALL" ? "SEMUA AREA" : area}
                            </button>
                        ))}
                    </div>

                    {/* HEADER LIST */}
                    <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-4">
                        <div>
                            <h3 className="font-black text-slate-800 uppercase">{module} - {selectedLoc}</h3>
                            <p className="text-xs text-slate-400 font-bold">
                                {module === 'APAR' ? filteredAPAR.length : filteredAC.length} Unit
                                {filterArea !== "ALL" && <span className="text-slate-800"> (Area: {filterArea})</span>}
                            </p>
                        </div>
                        {role === 'mess_admin' && <button onClick={() => onPrint(selectedLoc)} className="bg-slate-100 text-slate-600 p-2 rounded-lg text-xs font-bold hover:bg-slate-200">🖨️ CETAK</button>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        
                        {/* --- LOOPING DATA APAR --- */}
                        {module === 'APAR' && filteredAPAR.map((item: any) => (
                            <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-red-400 transition group relative">
                                {role === 'mess_admin' && (
                                    <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition z-10">
                                        <button onClick={(e) => { e.stopPropagation(); onEditAPAR(item); }} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white">✏️</button>
                                        <button onClick={(e) => { e.stopPropagation(); onDelete('apar_assets', item.id); }} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white">🗑️</button>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="text-2xl">🧯</div>
                                    <div>
                                        <h4 className="font-black text-slate-800 text-sm uppercase">{item.nomor_tabung}</h4>
                                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{item.jenis} - {item.berat_kg} KG</span>
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 mb-2">
                                    <p className="text-[10px] text-slate-400 uppercase font-bold">Posisi Detail:</p>
                                    <p className="text-xs font-bold text-slate-700">{item.detail_lokasi || "-"}</p>
                                </div>
                                <div className={`text-[10px] font-bold px-2 py-1 rounded border text-center ${getStatusColorAPAR(item.kondisi)}`}>
                                    KONDISI: {item.kondisi}
                                </div>
                                {item.tgl_exp && (
                                    <p className="text-[9px] text-center mt-1 text-slate-400 font-mono">Exp: {formatDateIndo(item.tgl_exp)}</p>
                                )}
                            </div>
                        ))}

                        {/* --- LOOPING DATA AC --- */}
                        {module === 'AC' && filteredAC.map((item: any) => (
                            <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-400 transition group relative">
                                {role === 'mess_admin' && (
                                    <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition z-10">
                                        <button onClick={(e) => { e.stopPropagation(); onEditAC(item); }} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white">✏️</button>
                                        <button onClick={(e) => { e.stopPropagation(); onDelete('ac_assets', item.id); }} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white">🗑️</button>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="text-2xl">❄️</div>
                                    <div>
                                        <h4 className="font-black text-slate-800 text-sm uppercase">{item.brand}</h4>
                                        <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">{item.pk || "?"} PK - THN {item.tahun_pasang || "-"}</span>
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 mb-2">
                                    <p className="text-[10px] text-slate-400 uppercase font-bold">Posisi Detail:</p>
                                    <p className="text-xs font-bold text-slate-700">{item.detail_lokasi || "-"}</p>
                                </div>
                                <div className="text-center bg-slate-50 rounded-lg border border-slate-100 p-2">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Jadwal Service:</p>
                                    {getServiceStatusAC(item.tgl_service_berikutnya)}
                                </div>
                                <div className="mt-2 text-center">
                                     {item.kondisi === 'RUSAK' ? 
                                        <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100">❌ UNIT RUSAK</span> : 
                                        <span className="text-[10px] font-bold text-green-600">✓ KONDISI NORMAL</span>
                                     }
                                </div>
                            </div>
                        ))}

                        {/* PESAN KOSONG */}
                        {(module === 'APAR' ? filteredAPAR : filteredAC).length === 0 && (
                            <div className="col-span-full text-center py-10 text-slate-400 italic">
                                {filterArea !== "ALL" ? `Tidak ada unit di area ${filterArea}` : `Belum ada data ${module} di ${selectedLoc}.`}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
      )}
    </div>
  );
}