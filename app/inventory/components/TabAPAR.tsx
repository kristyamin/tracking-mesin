"use client";
import { useState } from "react";

export default function TabAPAR({ aparList, role, onAdd, onEdit, onDelete, onPrint, searchTerm }: any) {
  
  // STATE NAVIGASI: LOCATION -> LIST
  const [viewStep, setViewStep] = useState<"LOCATION" | "LIST">("LOCATION");
  const [selectedLoc, setSelectedLoc] = useState("");

  const filteredList = aparList.filter((item: any) => {
      let pass = item.lokasi === selectedLoc;
      if (searchTerm) {
          const term = searchTerm.toLowerCase();
          pass = pass && (item.nomor_tabung?.toLowerCase().includes(term) || item.detail_lokasi?.toLowerCase().includes(term));
      }
      return pass;
  });

  const getStatusColor = (cond: string) => {
      if (cond === 'BAIK') return 'bg-green-100 text-green-700 border-green-200';
      if (cond === 'KURANG TEKANAN') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      return 'bg-red-100 text-red-700 border-red-200';
  };

  return (
    <div className="animate-in fade-in pb-20">
      
      {/* HEADER NAVIGASI (TOMBOL BACK) */}
      {viewStep === "LIST" && (
          <div className="flex items-center gap-4 mb-6">
              <button 
                onClick={() => setViewStep("LOCATION")} 
                className="w-10 h-10 bg-white rounded-full shadow-sm border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition text-slate-600 font-black text-xl"
              >
                  ⬅
              </button>
              <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">LOKASI APAR:</p>
                  <h2 className="text-lg font-black text-slate-800 uppercase leading-none">{selectedLoc}</h2>
              </div>
          </div>
      )}

      {/* STEP 1: PILIH LOKASI */}
      {viewStep === "LOCATION" && (
          <div className="space-y-6 mt-6">
              <div className="flex justify-between items-end px-4">
                  <h3 className="font-black text-slate-700 uppercase">PILIH DEPARTEMEN</h3>
                  {role === 'mess_admin' && <button onClick={onAdd} className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg hover:bg-red-700 transition">+ APAR BARU</button>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['TANJUNG UNCANG', 'SEKUPANG', 'MEGA CIPTA'].map((loc) => {
                      const count = aparList.filter((i:any) => i.lokasi === loc).length;
                      return (
                          <div key={loc} onClick={() => { setSelectedLoc(loc); setViewStep("LIST"); }} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-red-400 cursor-pointer transition relative overflow-hidden group">
                              <div className="absolute -right-4 -top-4 text-6xl opacity-5 grayscale group-hover:scale-110 transition">🔥</div>
                              <h4 className="font-black text-slate-800 text-lg">{loc}</h4>
                              <p className="text-xs font-bold text-red-600 mt-1">{count} Tabung APAR</p>
                          </div>
                      );
                  })}
              </div>
          </div>
      )}

      {/* STEP 2: LIST DATA APAR */}
      {viewStep === "LIST" && (
          <div className="space-y-4">
               {/* HEADER LIST DENGAN TOMBOL PRINT */}
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-4">
                  <div>
                      <h3 className="font-black text-slate-800 uppercase">APAR - {selectedLoc}</h3>
                      <p className="text-xs text-slate-400 font-bold">{filteredList.length} Unit</p>
                  </div>
                  {/* 👇 TOMBOL PRINT YANG MENGIRIM LOKASI */}
                  {role === 'mess_admin' && <button onClick={() => onPrint(selectedLoc)} className="bg-slate-100 text-slate-600 p-2 rounded-lg text-xs font-bold hover:bg-slate-200">🖨️ CETAK</button>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredList.map((item: any) => (
                      <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-red-400 transition group relative">
                          {role === 'mess_admin' && (
                              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                  <button onClick={() => onEdit(item)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white">✏️</button>
                                  <button onClick={() => onDelete('apar_assets', item.id)} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white">🗑️</button>
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
                          <div className={`text-[10px] font-bold px-2 py-1 rounded border text-center ${getStatusColor(item.kondisi)}`}>
                              KONDISI: {item.kondisi}
                          </div>
                          {item.tgl_exp && (
                              <p className="text-[9px] text-center mt-1 text-slate-400 font-mono">Exp: {new Date(item.tgl_exp).toLocaleDateString('id-ID')}</p>
                          )}
                      </div>
                  ))}
                  {filteredList.length === 0 && <div className="col-span-full text-center py-10 text-slate-400 italic">Belum ada data APAR di {selectedLoc}.</div>}
              </div>
          </div>
      )}
    </div>
  );
}