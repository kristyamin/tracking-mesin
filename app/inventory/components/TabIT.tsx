"use client";
import { useState } from "react";

export default function TabIT({ data, role, onAdd, onEdit, onDelete, onPrint, searchTerm }: any) {
  // STATE UNTUK GANTI TAMPILAN (KARTU vs LIST)
  const [viewMode, setViewMode] = useState<"SELECTION" | "LIST">("SELECTION");
  const [selectedCategory, setSelectedCategory] = useState("");

  // FUNGSI PILIH KATEGORI
  const handleSelect = (category: string) => {
    setSelectedCategory(category);
    setViewMode("LIST");
  };

  // FILTER DATA
  const filteredData = data.filter((item: any) => {
    // Filter 1: Sesuai Kategori yang dipilih (Laptop/Komputer/dll)
    if (selectedCategory && item.category !== selectedCategory) return false;
    
    // Filter 2: Sesuai Search Term (Pencarian)
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.device_name?.toLowerCase().includes(term) ||
      item.current_holder?.toLowerCase().includes(term) ||
      item.nik?.toLowerCase().includes(term) ||
      item.department?.toLowerCase().includes(term)
    );
  });

  // CARD COMPONENT BIAR RAPI
  const CategoryCard = ({ title, icon, count, type }: any) => (
    <div onClick={() => handleSelect(type)} className="bg-white border-4 border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:border-purple-500 hover:-translate-y-2 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 group py-8">
        <div className="text-6xl md:text-7xl group-hover:scale-110 transition duration-300">{icon}</div>
        <div className="text-center">
            <h2 className="text-lg md:text-xl font-black text-slate-700 uppercase tracking-widest group-hover:text-purple-600">{title}</h2>
            <p className="text-slate-400 font-bold text-xs mt-1">{count} Unit</p>
        </div>
    </div>
  );

  return (
    <div className="animate-in slide-in-from-bottom-4 pb-20">
      
      {/* TAMPILAN 1: PILIHAN KARTU (MENU) */}
      {viewMode === "SELECTION" && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-4">
            <CategoryCard title="Laptop" icon="💻" type="LAPTOP" count={data.filter((i:any) => i.category === 'LAPTOP').length} />
            <CategoryCard title="Komputer" icon="🖥️" type="KOMPUTER" count={data.filter((i:any) => i.category === 'KOMPUTER').length} />
            <CategoryCard title="Printer" icon="🖨️" type="PRINTER" count={data.filter((i:any) => i.category === 'PRINTER').length} />
            <CategoryCard title="Handphone" icon="📱" type="HP" count={data.filter((i:any) => i.category === 'HP').length} />
            <CategoryCard title="Tablet" icon="📟" type="TABLET" count={data.filter((i:any) => i.category === 'TABLET').length} />
        </div>
      )}

      {/* TAMPILAN 2: LIST TABEL DETIL */}
      {viewMode === "LIST" && (
        <div className="animate-in fade-in">
            {/* HEADER LIST */}
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => {setViewMode("SELECTION"); setSelectedCategory("");}} className="bg-slate-100 text-slate-500 w-10 h-10 rounded-full font-bold hover:bg-slate-200 transition shadow-sm flex items-center justify-center">⬅</button>
                    <h2 className="text-lg md:text-xl font-black text-slate-800 uppercase">LIST {selectedCategory}</h2>
                </div>
                <div className="flex gap-2">
                    <button onClick={onPrint} className="bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-emerald-700 transition flex items-center gap-1">🖨️ CETAK</button>
                    {role === 'mess_admin' && (
                        <button onClick={onAdd} className="bg-purple-600 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-purple-700 transition">+ TAMBAH BARU</button>
                    )}
                </div>
            </div>

            {/* TABEL DATA */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold border-b">
                    <tr><th className="p-4">Perangkat</th><th className="p-4">Pengguna / NIK</th><th className="p-4">Status</th><th className="p-4 text-center">Aksi</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                    {filteredData.map((item: any) => (
                        <tr key={item.id} className="hover:bg-purple-50 transition">
                        <td className="p-4">
                            <p className="font-black text-slate-800 uppercase">{item.device_name}</p>
                            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold uppercase tracking-wider">{item.category}</span>
                        </td>
                        <td className="p-4">
                            {item.current_holder ? (
                            <>
                                <p className="font-bold text-slate-700 uppercase">{item.current_holder}</p>
                                <p className="text-[10px] text-slate-500 font-mono mt-0.5"><span className="font-bold text-slate-400">NIK:</span> {item.nik || "-"}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{item.department}</p>
                            </>
                            ) : <span className="text-slate-300 text-xs italic">Belum ada pengguna</span>}
                        </td>
                        <td className="p-4">
                            {item.status === 'TERSEDIA' && <span className="bg-green-100 text-green-600 px-2 py-1 rounded text-[10px] font-black uppercase">🟢 Tersedia</span>}
                            {item.status === 'DIPAKAI' && <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-[10px] font-black uppercase">🔵 Dipakai</span>}
                            {item.status === 'RUSAK' && <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-[10px] font-black uppercase">🔴 Rusak</span>}
                        </td>
                        <td className="p-4 text-center">
                            {role === 'mess_admin' && (
                            <div className="flex justify-center gap-2">
                                <button onClick={() => onEdit(item)} className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg">✏️</button>
                                <button onClick={() => onDelete('it_assets', item.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg">🗑️</button>
                            </div>
                            )}
                        </td>
                        </tr>
                    ))}
                    {filteredData.length === 0 && (
                        <tr><td colSpan={4} className="p-8 text-center text-slate-400 italic">Tidak ada data {selectedCategory} yang ditemukan.</td></tr>
                    )}
                    </tbody>
                </table>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}