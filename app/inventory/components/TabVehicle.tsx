"use client";
import { useState } from "react";

export default function TabVehicle({ vehicleList, role, onSelectVehicle, onEdit, onDelete, onPrint, searchTerm, onAdd }: any) {
  
  // STATE NAVIGASI
  const [viewStep, setViewStep] = useState<"LOCATION" | "TYPE" | "LIST">("LOCATION");
  const [selectedLoc, setSelectedLoc] = useState("");
  const [selectedType, setSelectedType] = useState<"MOBIL" | "MOTOR">("MOBIL");
  
  // STATE FILTER BARU (MESS / NON MESS)
  const [filterScope, setFilterScope] = useState("ALL");

  // --- LOGIKA FILTER UTAMA ---
  const filteredList = (vehicleList || []).filter((v: any) => {
      // 1. Filter Wajib (Lokasi & Jenis)
      let pass = v.jenis === selectedType && v.lokasi === selectedLoc;
      
      // 2. Filter Scope (Mess / Non Mess)
      if (filterScope === "MESS") {
          pass = pass && v.mess_id; // Harus punya ID Mess
      } else if (filterScope === "NON MESS") {
          pass = pass && !v.mess_id; // Tidak punya ID Mess
      }

      // 3. Filter Pencarian
      if (searchTerm) {
          const term = searchTerm.toLowerCase();
          pass = pass && (
            v.nama_kendaraan?.toLowerCase().includes(term) || 
            v.plat_nomor?.toLowerCase().includes(term) ||
            v.pic_kendaraan?.toLowerCase().includes(term)
          );
      }
      return pass;
  });

  const getStatusIndicator = (dateString: string, type: string) => {
    if (!dateString) return <span className="text-slate-300 text-[10px] font-mono border border-slate-100 px-2 py-0.5 rounded">--</span>;
    const diffDays = Math.ceil((new Date(dateString).getTime() - new Date().setHours(0,0,0,0)) / (86400000));
    
    if (diffDays < 0) return <span className="bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded text-[9px] font-black animate-pulse">🚨 {type}</span>;
    else if (diffDays <= 30) return <span className="bg-orange-50 text-orange-600 border border-orange-100 px-2 py-0.5 rounded text-[9px] font-black">🟠 {type}</span>;
    else return <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded text-[9px] font-bold">🟢 {type}</span>;
  };

  return (
    <div className="animate-in fade-in pb-20">
      
      {/* HEADER NAVIGASI (TOMBOL BACK) */}
      {viewStep !== "LOCATION" && (
          <div className="flex items-center gap-4 mb-6">
              <button 
                onClick={() => {
                    if (viewStep === "LIST") {
                        setViewStep("TYPE");
                        setFilterScope("ALL"); // Reset filter saat kembali
                    } else {
                        setViewStep("LOCATION");
                    }
                }} 
                className="w-10 h-10 bg-white rounded-full shadow-sm border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition text-slate-600 font-black text-xl"
              >
                  ⬅
              </button>
              <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">POSISI:</p>
                  <h2 className="text-lg font-black text-slate-800 uppercase leading-none">
                      {viewStep === "TYPE" ? selectedLoc : `${selectedLoc} / ${selectedType}`}
                  </h2>
              </div>
          </div>
      )}

      {/* === STEP 1: PILIH LOKASI === */}
      {viewStep === "LOCATION" && (
          <div className="space-y-6 mt-6 animate-in slide-in-from-bottom-4">
              <div className="flex justify-between items-end px-2">
                  <h3 className="font-black text-slate-700 uppercase">PILIH DEPARTEMEN</h3>
                  {role === 'mess_admin' && (
                      <button onClick={onAdd} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg hover:bg-blue-700 transition hover:scale-105">
                          + KENDARAAN BARU
                      </button>
                   )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {['TANJUNG UNCANG', 'SEKUPANG', 'MEGA CIPTA'].map((loc) => {
                      const count = (vehicleList || []).filter((v:any) => v.lokasi === loc).length;
                      return (
                          <div key={loc} onClick={() => { setSelectedLoc(loc); setViewStep("TYPE"); }} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-400 transition cursor-pointer group relative overflow-hidden flex flex-col justify-between min-h-[160px]">
                              <div className="absolute -right-6 -top-6 text-9xl opacity-5 grayscale group-hover:scale-110 transition">🏢</div>
                              <div>
                                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl mb-3 shadow-sm group-hover:scale-110 transition">📍</div>
                                  <h4 className="font-black text-slate-800 text-xl">{loc}</h4>
                                  <p className="text-xs font-bold text-slate-400 mt-1">Pool Kendaraan</p>
                              </div>
                              <div className="flex justify-between items-end mt-4">
                                  <span className="text-3xl font-black text-slate-800">{count}</span>
                                  <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded font-bold border border-blue-100">Unit Total</span>
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>
      )}

      {/* === STEP 2: PILIH JENIS === */}
      {viewStep === "TYPE" && (
          <div className="max-w-4xl mx-auto mt-6 animate-in zoom-in-95">
              <h3 className="text-center font-black text-slate-700 uppercase mb-6 tracking-widest">JENIS KENDARAAN DI {selectedLoc}</h3>
              <div className="grid grid-cols-2 gap-6 max-w-2xl mx-auto">
                  {/* MOBIL */}
                  <div onClick={() => { setSelectedType("MOBIL"); setViewStep("LIST"); }} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-blue-500 cursor-pointer transition text-center group relative overflow-hidden">
                      <div className="text-6xl mb-4 group-hover:scale-110 transition drop-shadow-sm">🚙</div>
                      <h3 className="text-xl font-black text-slate-800 uppercase">MOBIL</h3>
                      <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-bold mt-3 inline-block border border-blue-100">
                          {(vehicleList || []).filter((v:any) => v.jenis === 'MOBIL' && v.lokasi === selectedLoc).length} Unit
                      </span>
                  </div>

                  {/* MOTOR */}
                  <div onClick={() => { setSelectedType("MOTOR"); setViewStep("LIST"); }} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-orange-500 cursor-pointer transition text-center group relative overflow-hidden">
                      <div className="text-6xl mb-4 group-hover:scale-110 transition drop-shadow-sm">🏍️</div>
                      <h3 className="text-xl font-black text-slate-700 uppercase">MOTOR</h3>
                      <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-[10px] font-bold mt-3 inline-block border border-orange-100">
                          {(vehicleList || []).filter((v:any) => v.jenis === 'MOTOR' && v.lokasi === selectedLoc).length} Unit
                      </span>
                  </div>
              </div>
          </div>
      )}

      {/* === STEP 3: LIST DATA (DENGAN FILTER BARU) === */}
      {viewStep === "LIST" && (
          <div className="space-y-4 animate-in slide-in-from-bottom-8">
               
              {/* FILTER BARU: MESS / NON MESS */}
              <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
                  {["ALL", "MESS", "NON MESS"].map((scope) => (
                      <button 
                        key={scope}
                        onClick={() => setFilterScope(scope)}
                        className={`
                            px-4 py-2 rounded-xl text-xs font-black uppercase whitespace-nowrap transition shadow-sm border
                            ${filterScope === scope 
                                ? "bg-slate-800 text-white border-slate-800 shadow-slate-300" 
                                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-800"}
                        `}
                      >
                          {scope === "ALL" ? "SEMUA KENDARAAN" : scope}
                      </button>
                  ))}
              </div>

              {/* HEADER LIST */}
              <div className="flex flex-wrap justify-between items-center bg-white p-4 rounded-[2rem] shadow-sm border border-slate-200 mb-2 gap-2">
                  <div>
                      <h3 className="font-black text-slate-800 uppercase text-sm md:text-base">{selectedType} - {selectedLoc}</h3>
                      <p className="text-xs text-slate-400 font-bold">
                          {filteredList.length} Unit Terdata
                          {filterScope !== "ALL" && <span className="text-blue-600"> (Filter: {filterScope})</span>}
                      </p>
                  </div>
                  {role === 'mess_admin' && (
                      <button 
                        onClick={() => onPrint(selectedType, selectedLoc)} 
                        className="bg-slate-100 text-slate-600 px-3 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 flex items-center gap-2 transition"
                      >
                          🖨️ <span className="hidden md:inline">CETAK</span>
                      </button>
                  )}
              </div>

              {/* GRID DATA (CARD STYLE SERAGAM DENGAN IT) */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredList.map((v: any) => {
                       const isMobil = selectedType === 'MOBIL';
                       return (
                      <div key={v.id} onClick={() => onSelectVehicle(v)} className={`bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm transition group relative flex flex-col justify-between hover:shadow-lg cursor-pointer ${isMobil ? 'hover:border-blue-300' : 'hover:border-orange-300'}`}>
                          
                          {/* TOMBOL EDIT/DELETE (HOVER) */}
                          {role === 'mess_admin' && (
                              <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition z-10">
                                  {/* 👇 INI YANG DIPERBAIKI: Kirim 'v' dan 'e' */}
                                  <button onClick={(e) => onEdit(v, e)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white shadow-sm">✏️</button>
                                  
                                  {/* Kalau Delete tetap sama, dia cuma butuh ID */}
                                  <button onClick={(e) => { e.stopPropagation(); onDelete('mess_vehicles', v.id); }} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white shadow-sm">🗑️</button>
                              </div>
                          )}

                          <div>
                              {/* HEADER ITEM */}
                              <div className="flex items-start gap-3 mb-4">
                                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm shrink-0 ${isMobil ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                                    {isMobil ? '🚙' : '🏍️'}
                                  </div>
                                  <div className="overflow-hidden">
                                      <h4 className="font-black text-slate-800 uppercase text-sm truncate" title={v.nama_kendaraan}>{v.nama_kendaraan}</h4>
                                      <span className="bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded mt-1 inline-block border border-slate-600 shadow-sm">{v.plat_nomor}</span>
                                  </div>
                              </div>

                              {/* INFO PIC & LOKASI */}
                              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2 mb-3">
                                  <div>
                                      <p className="text-[9px] text-slate-400 uppercase font-bold">PIC / Pengguna:</p>
                                      <p className="text-xs font-bold text-slate-700 truncate">{v.pic_kendaraan || "Belum Ada PIC"}</p>
                                  </div>
                                  <div className="pt-2 border-t border-slate-200 border-dashed">
                                      <p className="text-[9px] text-slate-400 uppercase font-bold">Posisi Unit:</p>
                                      <p className={`text-xs font-bold uppercase ${v.mess_locations ? 'text-blue-600' : 'text-slate-500'}`}>
                                          {v.mess_locations ? `🏠 ${v.mess_locations.nama_mess}` : "🏢 OPERASIONAL (NON MESS)"}
                                      </p>
                                  </div>
                              </div>
                          </div>

                          {/* STATUS INDICATORS */}
                          <div className="flex gap-2 flex-wrap pt-2">
                              {getStatusIndicator(v.tgl_pajak, "Pajak 5Th")}
                              {getStatusIndicator(v.tgl_pajak_tahunan, "STNK")}
                              {getStatusIndicator(v.tgl_service, "Service")}
                          </div>
                      </div>
                  )})}
              </div>

              {filteredList.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center p-10 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 text-slate-400">
                    <span className="text-4xl mb-2">💨</span>
                    <p className="italic font-bold text-xs">
                        {filterScope !== "ALL" ? `Tidak ada kendaraan di kategori ${filterScope}` : `Belum ada data ${selectedType} di ${selectedLoc}`}
                    </p>
                </div>
              )}
          </div>
      )}
    </div>
  );
}