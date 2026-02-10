"use client";
import { useState } from "react";

export default function TabIT({ data, role, onAdd, onEdit, onDelete, onPrint, searchTerm }: any) {
  
  // STATE NAVIGASI
  const [viewStep, setViewStep] = useState<"LOCATION" | "CATEGORY" | "LIST">("LOCATION");
  const [selectedLoc, setSelectedLoc] = useState("");
  const [selectedCat, setSelectedCat] = useState("");
  
  // STATE FILTER DIVISI (WS)
  const [filterDivisi, setFilterDivisi] = useState("ALL"); // Default tampilkan semua

  const categories = [
      { id: 'LAPTOP', icon: '💻', label: 'Laptop' },
      { id: 'KOMPUTER', icon: '🖥️', label: 'PC Desktop' },
      { id: 'PRINTER', icon: '🖨️', label: 'Printer' },
      { id: 'HP', icon: '📱', label: 'Handphone' },
      { id: 'TABLET', icon: '📟', label: 'Tablet' },
      { id: 'LAINNYA', icon: '🔌', label: 'Lainnya' },
  ];

  // --- LOGIKA FILTER UTAMA ---
  const filteredList = data.filter((item: any) => {
      // 1. Filter Wajib (Lokasi & Kategori)
      let pass = item.lokasi === selectedLoc && item.category === selectedCat;
      
      // 2. Filter Pencarian (Search Bar)
      if (searchTerm) {
          const term = searchTerm.toLowerCase();
          pass = pass && (
            item.device_name?.toLowerCase().includes(term) || 
            item.current_holder?.toLowerCase().includes(term) ||
            item.department?.toLowerCase().includes(term) // Sekarang bisa cari nama divisi juga
          );
      }

      // 3. Filter Tombol Divisi (WS 1, WS 2, dll)
      if (filterDivisi !== "ALL") {
          // Cek apakah divisi mengandung kata kunci filter (Misal: "WS 1")
          pass = pass && item.department?.toUpperCase().includes(filterDivisi);
      }

      return pass;
  });

  const getCatLabel = (id: string) => categories.find(c => c.id === id)?.label || id;

  return (
    <div className="animate-in fade-in pb-20">
      
      {/* HEADER NAVIGASI (TOMBOL BACK) */}
      {viewStep !== "LOCATION" && (
          <div className="flex items-center gap-4 mb-6">
              <button 
                onClick={() => {
                    setViewStep(viewStep === "LIST" ? "CATEGORY" : "LOCATION");
                    setFilterDivisi("ALL"); // Reset filter saat kembali
                }} 
                className="w-10 h-10 bg-white rounded-full shadow-sm border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition text-slate-600 font-black text-xl"
              >
                  ⬅
              </button>
              <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">POSISI ASET:</p>
                  <h2 className="text-lg font-black text-slate-800 uppercase leading-none">
                      {viewStep === "CATEGORY" ? selectedLoc : `${selectedLoc} / ${getCatLabel(selectedCat)}`}
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
                      <button onClick={onAdd} className="bg-purple-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg hover:bg-purple-700 transition hover:scale-105">
                          + INPUT ASET BARU
                      </button>
                  )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {['TANJUNG UNCANG', 'SEKUPANG', 'MEGA CIPTA'].map((loc) => {
                      const count = data.filter((i:any) => i.lokasi === loc).length;
                      return (
                          <div key={loc} onClick={() => { setSelectedLoc(loc); setViewStep("CATEGORY"); }} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-purple-400 cursor-pointer transition relative overflow-hidden group flex flex-col justify-between min-h-[160px]">
                              <div className="absolute -right-6 -top-6 text-9xl opacity-5 grayscale group-hover:scale-110 transition">🏢</div>
                              <div>
                                  <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-2xl mb-3 shadow-sm group-hover:scale-110 transition">📍</div>
                                  <h4 className="font-black text-slate-800 text-xl">{loc}</h4>
                                  <p className="text-xs font-bold text-slate-400 mt-1">Gudang & Kantor</p>
                              </div>
                              <div className="flex justify-between items-end mt-4">
                                  <span className="text-3xl font-black text-slate-800">{count}</span>
                                  <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-1 rounded font-bold border border-purple-100">Total Aset IT</span>
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>
      )}

      {/* === STEP 2: PILIH KATEGORI === */}
      {viewStep === "CATEGORY" && (
          <div className="max-w-4xl mx-auto mt-6 animate-in zoom-in-95">
              <h3 className="text-center font-black text-slate-700 uppercase mb-6 tracking-widest">KATEGORI DI {selectedLoc}</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {categories.map((cat) => {
                      const count = data.filter((i:any) => i.lokasi === selectedLoc && i.category === cat.id).length;
                      return (
                          <div key={cat.id} onClick={() => { setSelectedCat(cat.id); setViewStep("LIST"); }} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-purple-400 cursor-pointer transition text-center group relative overflow-hidden">
                              <div className="text-5xl mb-3 group-hover:scale-110 transition drop-shadow-sm">{cat.icon}</div>
                              <h4 className="font-black text-slate-800 text-sm uppercase">{cat.label}</h4>
                              <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-bold mt-3 inline-block border border-slate-200">
                                  {count} Unit
                              </span>
                          </div>
                      );
                  })}
              </div>
          </div>
      )}

      {/* === STEP 3: LIST DATA (DENGAN FILTER WS) === */}
      {viewStep === "LIST" && (
          <div className="space-y-4 animate-in slide-in-from-bottom-8">
              
              {/* FILTER BAR BARU (WS 1 - WS 4) */}
              <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
                  {["ALL", "WS 1", "WS 2", "WS 3", "WS 4"].map((ws) => (
                      <button 
                        key={ws}
                        onClick={() => setFilterDivisi(ws)}
                        className={`
                            px-4 py-2 rounded-xl text-xs font-black uppercase whitespace-nowrap transition shadow-sm border
                            ${filterDivisi === ws 
                                ? "bg-purple-600 text-white border-purple-600 shadow-purple-200" 
                                : "bg-white text-slate-500 border-slate-200 hover:bg-purple-50 hover:text-purple-600"}
                        `}
                      >
                          {ws === "ALL" ? "SEMUA AREA" : ws}
                      </button>
                  ))}
              </div>

              {/* HEADER LIST */}
              <div className="flex flex-wrap justify-between items-center bg-white p-4 rounded-[2rem] shadow-sm border border-slate-200 mb-2 gap-2">
                  <div>
                      <h3 className="font-black text-slate-800 uppercase text-sm md:text-base">{getCatLabel(selectedCat)} - {selectedLoc}</h3>
                      <p className="text-xs text-slate-400 font-bold">
                          {filteredList.length} Item 
                          {filterDivisi !== "ALL" && <span className="text-purple-600"> (Filter: {filterDivisi})</span>}
                      </p>
                  </div>
                  {role === 'mess_admin' && (
                      <button 
                        onClick={() => onPrint(selectedLoc)} 
                        className="bg-slate-100 text-slate-600 px-3 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 flex items-center gap-2 transition"
                      >
                          🖨️ <span className="hidden md:inline">CETAK DATA</span>
                      </button>
                  )}
              </div>

              {/* GRID DATA (TIDAK GESER-GESER LAGI) */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredList.map((item: any) => (
                      <div key={item.id} className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-lg hover:border-purple-300 transition group relative flex flex-col justify-between">
                          
                          {/* TOMBOL EDIT/HAPUS (HOVER) */}
                          {role === 'mess_admin' && (
                              <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition z-10">
                                  <button onClick={() => onEdit(item)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white shadow-sm">✏️</button>
                                  <button onClick={() => onDelete('it_assets', item.id)} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white shadow-sm">🗑️</button>
                              </div>
                          )}

                          <div>
                              {/* HEADER ITEM */}
                              <div className="flex items-start gap-3 mb-3">
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm shrink-0 ${item.status === 'TERSEDIA' ? 'bg-green-100 text-green-600' : (item.status === 'RUSAK' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600')}`}>
                                      {item.status === 'TERSEDIA' ? '✅' : (item.status === 'RUSAK' ? '🛠️' : '👤')}
                                  </div>
                                  <div className="overflow-hidden">
                                      <h4 className="font-black text-slate-800 text-sm uppercase truncate" title={item.device_name}>{item.device_name}</h4>
                                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded inline-block mt-1 border ${item.status === 'TERSEDIA' ? 'bg-green-50 text-green-700 border-green-200' : (item.status === 'RUSAK' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200')}`}>
                                          {item.status}
                                      </span>
                                  </div>
                              </div>

                              {/* INFO PENGGUNA & DIVISI (YANG TADI HILANG) */}
                              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
                                  <div>
                                      <p className="text-[9px] text-slate-400 uppercase font-bold">Pengguna (User):</p>
                                      <p className="text-xs font-bold text-slate-700 uppercase truncate">{item.current_holder || "TERSEDIA DI GUDANG"}</p>
                                  </div>
                                  
                                  {/* INI BAGIAN DIVISI YANG BARU DITAMBAHKAN */}
                                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 border-dashed">
                                      <div>
                                          <p className="text-[9px] text-slate-400 uppercase font-bold">Divisi / Lokasi:</p>
                                          <p className="text-xs font-bold text-purple-700 uppercase">{item.department || "-"}</p>
                                      </div>
                                      {item.nik && (
                                          <div className="text-right">
                                              <p className="text-[9px] text-slate-400 uppercase font-bold">NIK:</p>
                                              <p className="text-xs font-mono text-slate-500">{item.nik}</p>
                                          </div>
                                      )}
                                  </div>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>

              {filteredList.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center p-10 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 text-slate-400">
                    <span className="text-4xl mb-2">🤷‍♂️</span>
                    <p className="italic font-bold text-xs">
                        {filterDivisi !== "ALL" ? `Tidak ada aset di ${filterDivisi}` : "Data aset kosong."}
                    </p>
                </div>
              )}
          </div>
      )}
    </div>
  );
}