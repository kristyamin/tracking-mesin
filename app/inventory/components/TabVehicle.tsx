"use client";
import { useState } from "react";

export default function TabVehicle({ vehicleList, role, onSelectVehicle, onEdit, onDelete, onPrint, searchTerm, onAdd }: any) {
  
  // STATE NAVIGASI: LOCATION -> TYPE -> LIST
  const [viewStep, setViewStep] = useState<"LOCATION" | "TYPE" | "LIST">("LOCATION");
  const [selectedLoc, setSelectedLoc] = useState("");
  const [selectedType, setSelectedType] = useState<"MOBIL" | "MOTOR">("MOBIL");

  const filteredList = vehicleList.filter((v: any) => {
      let pass = v.jenis === selectedType && v.lokasi === selectedLoc;
      if (searchTerm) {
          const term = searchTerm.toLowerCase();
          pass = pass && (v.nama_kendaraan?.toLowerCase().includes(term) || v.plat_nomor?.toLowerCase().includes(term));
      }
      return pass;
  });

  const getStatusIndicator = (dateString: string, type: string) => {
    if (!dateString) return <span className="text-gray-300 text-[9px] font-mono">--</span>;
    const diffDays = Math.ceil((new Date(dateString).getTime() - new Date().setHours(0,0,0,0)) / (86400000));
    if (diffDays < 0) return <span className="bg-red-600 text-white px-2 py-0.5 rounded text-[9px] font-black animate-pulse">🚨 {type}</span>;
    else if (diffDays <= 30) return <span className="bg-orange-100 text-orange-700 border border-orange-300 px-2 py-0.5 rounded text-[9px] font-black">🟠 {type}</span>;
    else return <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded text-[9px] font-bold border border-green-200">🟢 {type}</span>;
  };

  return (
    <div className="animate-in fade-in pb-20">
      
      {/* HEADER NAVIGASI (MODEL TOMBOL BACK SEPERTI APAR) */}
      {viewStep !== "LOCATION" && (
          <div className="flex items-center gap-4 mb-6">
              <button 
                onClick={() => setViewStep(viewStep === "LIST" ? "TYPE" : "LOCATION")} 
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

      {/* STEP 1: PILIH LOKASI (ADA TOMBOL TAMBAH DI KANAN) */}
      {viewStep === "LOCATION" && (
          <div className="space-y-6 mt-6">
              <div className="flex justify-between items-end px-4">
                  <h3 className="font-black text-slate-700 uppercase">PILIH DEPARTEMEN</h3>
                  {role === 'mess_admin' && (
                      <button onClick={onAdd} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg hover:bg-blue-700 transition">
                          + KENDARAAN BARU
                      </button>
                  )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['TANJUNG UNCANG', 'SEKUPANG', 'MEGA CIPTA'].map((loc) => {
                      const count = vehicleList.filter((v:any) => v.lokasi === loc).length;
                      return (
                          <div key={loc} onClick={() => { setSelectedLoc(loc); setViewStep("TYPE"); }} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-400 cursor-pointer transition relative overflow-hidden group">
                              <div className="absolute -right-4 -top-4 text-6xl opacity-5 grayscale group-hover:scale-110 transition">🏢</div>
                              <h4 className="font-black text-slate-800 text-lg">{loc}</h4>
                              <p className="text-xs font-bold text-blue-600 mt-1">{count} Unit Total</p>
                          </div>
                      );
                  })}
              </div>
          </div>
      )}

      {/* STEP 2: PILIH JENIS */}
      {viewStep === "TYPE" && (
          <div className="max-w-4xl mx-auto mt-6">
              <h3 className="text-center font-black text-slate-700 uppercase mb-6">JENIS KENDARAAN DI {selectedLoc}</h3>
              <div className="grid grid-cols-2 gap-6 max-w-2xl mx-auto">
                  <div onClick={() => { setSelectedType("MOBIL"); setViewStep("LIST"); }} className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-400 cursor-pointer transition text-center group">
                      <div className="text-6xl mb-4 group-hover:scale-110 transition">🚙</div>
                      <h3 className="text-xl font-black text-slate-700 uppercase">MOBIL</h3>
                      <p className="text-xs text-slate-400 font-bold mt-2">
                          {vehicleList.filter((v:any) => v.jenis === 'MOBIL' && v.lokasi === selectedLoc).length} Unit
                      </p>
                  </div>
                  <div onClick={() => { setSelectedType("MOTOR"); setViewStep("LIST"); }} className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-400 cursor-pointer transition text-center group">
                      <div className="text-6xl mb-4 group-hover:scale-110 transition">🏍️</div>
                      <h3 className="text-xl font-black text-slate-700 uppercase">MOTOR</h3>
                      <p className="text-xs text-slate-400 font-bold mt-2">
                          {vehicleList.filter((v:any) => v.jenis === 'MOTOR' && v.lokasi === selectedLoc).length} Unit
                      </p>
                  </div>
              </div>
          </div>
      )}

      {/* STEP 3: LIST DATA */}
      {viewStep === "LIST" && (
          <div className="space-y-4">
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-4">
                  <div>
                      <h3 className="font-black text-slate-800 uppercase text-sm md:text-base">{selectedType} - {selectedLoc}</h3>
                      <p className="text-xs text-slate-400 font-bold">{filteredList.length} Aset Terdaftar</p>
                  </div>
                  {role === 'mess_admin' && (
                      <button 
                        onClick={() => onPrint(selectedType, selectedLoc)} 
                        className="bg-slate-100 text-slate-600 px-3 py-2 rounded-lg text-xs font-bold hover:bg-slate-200 flex items-center gap-2"
                      >
                          🖨️ <span className="hidden md:inline">LIST</span>
                      </button>
                  )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredList.map((v: any) => (
                      <div key={v.id} onClick={() => onSelectVehicle(v)} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md cursor-pointer hover:border-blue-400 transition group relative">
                          {role === 'mess_admin' && (
                              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                  <button onClick={(e) => onEdit(v, e)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white">✏️</button>
                                  <button onClick={() => onDelete('mess_vehicles', v.id)} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white">🗑️</button>
                              </div>
                          )}
                          <div className="flex items-center gap-3 mb-3">
                              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-2xl">{selectedType === 'MOBIL' ? '🚙' : '🏍️'}</div>
                              <div>
                                  <h4 className="font-black text-slate-800 uppercase text-sm">{v.nama_kendaraan}</h4>
                                  <span className="bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded">{v.plat_nomor}</span>
                              </div>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 mb-2">
                              <p className="text-[10px] text-slate-400 uppercase font-bold">PIC / Pengguna</p>
                              <p className="text-xs font-bold text-slate-700">{v.pic_kendaraan || "Belum Ada PIC"}</p>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                              {getStatusIndicator(v.tgl_pajak, "Pjk 5Th")}
                              {getStatusIndicator(v.tgl_pajak_tahunan, "STNK")}
                              {getStatusIndicator(v.tgl_service, "Svc")}
                          </div>
                      </div>
                  ))}
              </div>
              {filteredList.length === 0 && <div className="text-center py-10 text-slate-400 italic bg-white rounded-2xl border-2 border-dashed">Belum ada data {selectedType} di {selectedLoc}</div>}
          </div>
      )}
    </div>
  );
}