"use client";
import { useState } from "react";

export default function TabIT({ data, role, onAdd, onEdit, onDelete, onPrint, searchTerm }: any) {
  
  // STATE NAVIGASI: LOCATION -> CATEGORY -> LIST
  const [viewStep, setViewStep] = useState<"LOCATION" | "CATEGORY" | "LIST">("LOCATION");
  const [selectedLoc, setSelectedLoc] = useState("");
  const [selectedCat, setSelectedCat] = useState("");

  const categories = [
      { id: 'LAPTOP', icon: '💻', label: 'Laptop' },
      { id: 'KOMPUTER', icon: '🖥️', label: 'PC Desktop' },
      { id: 'PRINTER', icon: '🖨️', label: 'Printer' },
      { id: 'HP', icon: '📱', label: 'Handphone' },
      { id: 'TABLET', icon: '📟', label: 'Tablet' },
      { id: 'LAINNYA', icon: '🔌', label: 'Lainnya' },
  ];

  // FILTER DATA
  const filteredList = data.filter((item: any) => {
      let pass = item.lokasi === selectedLoc && item.category === selectedCat;
      if (searchTerm) {
          const term = searchTerm.toLowerCase();
          pass = pass && (item.device_name?.toLowerCase().includes(term) || item.current_holder?.toLowerCase().includes(term));
      }
      return pass;
  });

  // Helper untuk label kategori
  const getCatLabel = (id: string) => categories.find(c => c.id === id)?.label || id;

  return (
    <div className="animate-in fade-in pb-20">
      
      {/* HEADER NAVIGASI (TOMBOL BACK) */}
      {viewStep !== "LOCATION" && (
          <div className="flex items-center gap-4 mb-6">
              <button 
                onClick={() => setViewStep(viewStep === "LIST" ? "CATEGORY" : "LOCATION")} 
                className="w-10 h-10 bg-white rounded-full shadow-sm border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition text-slate-600 font-black text-xl"
              >
                  ⬅
              </button>
              <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">POSISI:</p>
                  <h2 className="text-lg font-black text-slate-800 uppercase leading-none">
                      {viewStep === "CATEGORY" ? selectedLoc : `${selectedLoc} / ${getCatLabel(selectedCat)}`}
                  </h2>
              </div>
          </div>
      )}

      {/* STEP 1: PILIH LOKASI */}
      {viewStep === "LOCATION" && (
          <div className="space-y-6 mt-6">
              <div className="flex justify-between items-end px-4">
                  <h3 className="font-black text-slate-700 uppercase">PILIH DEPARTEMEN</h3>
                  {role === 'mess_admin' && <button onClick={onAdd} className="bg-purple-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg hover:bg-purple-700 transition">+ INPUT ASET BARU</button>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['TANJUNG UNCANG', 'SEKUPANG', 'MEGA CIPTA'].map((loc) => {
                      const count = data.filter((i:any) => i.lokasi === loc).length;
                      return (
                          <div key={loc} onClick={() => { setSelectedLoc(loc); setViewStep("CATEGORY"); }} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-purple-400 cursor-pointer transition relative overflow-hidden group">
                              <div className="absolute -right-4 -top-4 text-6xl opacity-5 grayscale group-hover:scale-110 transition">🏢</div>
                              <h4 className="font-black text-slate-800 text-lg">{loc}</h4>
                              <p className="text-xs font-bold text-purple-600 mt-1">{count} Aset IT</p>
                          </div>
                      );
                  })}
              </div>
          </div>
      )}

      {/* STEP 2: PILIH KATEGORI */}
      {viewStep === "CATEGORY" && (
          <div className="max-w-4xl mx-auto mt-6">
              <h3 className="text-center font-black text-slate-700 uppercase mb-6">KATEGORI DI {selectedLoc}</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {categories.map((cat) => {
                      const count = data.filter((i:any) => i.lokasi === selectedLoc && i.category === cat.id).length;
                      return (
                          <div key={cat.id} onClick={() => { setSelectedCat(cat.id); setViewStep("LIST"); }} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-purple-400 cursor-pointer transition text-center group">
                              <div className="text-4xl mb-2 group-hover:scale-110 transition">{cat.icon}</div>
                              <h4 className="font-bold text-slate-800 text-sm uppercase">{cat.label}</h4>
                              <p className="text-[10px] font-bold text-slate-400 mt-1">{count} Unit</p>
                          </div>
                      );
                  })}
              </div>
          </div>
      )}

      {/* STEP 3: LIST DATA */}
      {viewStep === "LIST" && (
          <div className="space-y-4">
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-4">
                  <div>
                      <h3 className="font-black text-slate-800 uppercase">{getCatLabel(selectedCat)} - {selectedLoc}</h3>
                      <p className="text-xs text-slate-400 font-bold">{filteredList.length} Item</p>
                  </div>
                  {role === 'mess_admin' && (
                      <button 
                        onClick={() => onPrint(selectedLoc)} 
                        className="bg-slate-100 text-slate-600 p-2 rounded-lg text-xs font-bold hover:bg-slate-200 flex items-center gap-2"
                      >
                          🖨️ <span className="hidden md:inline">LIST</span>
                      </button>
                  )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredList.map((item: any) => (
                      <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-purple-400 transition group relative">
                          {role === 'mess_admin' && (
                              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                  <button onClick={() => onEdit(item)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white">✏️</button>
                                  <button onClick={() => onDelete('it_assets', item.id)} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white">🗑️</button>
                              </div>
                          )}
                          <div className="flex items-center gap-3 mb-2">
                              <div className={`w-2 h-2 rounded-full ${item.status === 'TERSEDIA' ? 'bg-green-500' : (item.status === 'RUSAK' ? 'bg-red-500' : 'bg-blue-500')}`}></div>
                              <h4 className="font-bold text-slate-800 text-sm uppercase truncate">{item.device_name}</h4>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                              <p className="text-[10px] text-slate-400 uppercase font-bold">User:</p>
                              <p className="text-xs font-bold text-slate-700 uppercase">{item.current_holder || "TERSEDIA"}</p>
                              {item.nik && <p className="text-[10px] text-slate-400 font-mono mt-0.5">NIK: {item.nik}</p>}
                          </div>
                      </div>
                  ))}
              </div>
              {filteredList.length === 0 && <div className="text-center py-10 text-slate-400 italic bg-white rounded-2xl border-2 border-dashed">Kosong</div>}
          </div>
      )}
    </div>
  );
}