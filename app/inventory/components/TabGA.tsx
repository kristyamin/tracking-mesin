"use client";
import { useState } from "react";

export default function TabGA({ 
  stocks, loans, vehicles, itAssets, employees, role, searchTerm, 
  onAddStock, onEditStock, onDelete, onLoan, onReturn, onPrint, onAddMore, onImport, 
  onDeleteEmployee 
}: any) {
  
  const [subTab, setSubTab] = useState<"STOCK" | "EMPLOYEE">("EMPLOYEE");
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null); 

  const formatDateIndo = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  };

  const getEmployeeProfiles = () => {
    // 1. Ambil dari Master
    let allProfiles = (employees || []).map((emp: any) => ({
        id: emp.id, 
        name: emp.nama,
        nik: emp.nik || "-",
        source: 'MASTER'
    }));

    // 2. Ambil dari Data Transaksi (Manual)
    const loanProfiles = loans.map((l:any) => ({ id: null, name: l.employee_name, nik: l.employee_nik || "-" }));
    
    // 3. Gabungkan
    const uniqueMap = new Map();
    [...allProfiles, ...loanProfiles].forEach((item: any) => {
        const key = `${item.name?.toUpperCase()}-${item.nik?.toUpperCase()}`;
        if (!uniqueMap.has(key)) {
            uniqueMap.set(key, item);
        } else if (item.id && !uniqueMap.get(key).id) {
            uniqueMap.set(key, { ...item, ...uniqueMap.get(key), id: item.id });
        }
    });
    
    const distinctProfiles = Array.from(uniqueMap.values());

    let profiles = distinctProfiles.map((p: any) => {
        const myLoans = loans.filter((l:any) => l.employee_name?.toUpperCase() === p.name?.toUpperCase() && (l.employee_nik === p.nik || p.nik === '-'));
        const myVehicles = vehicles.filter((v:any) => v.pic_nik === p.nik || v.pic_kendaraan?.toUpperCase() === p.name?.toUpperCase());
        const myIT = itAssets.filter((i:any) => i.nik === p.nik || i.current_holder?.toUpperCase() === p.name?.toUpperCase());

        return {
            id: p.id,
            name: p.name?.toUpperCase(),
            nik: p.nik,
            ga_items: myLoans,
            vehicle_items: myVehicles,
            it_items: myIT,
            has_issue: myLoans.some((l:any) => l.status === 'DIPINJAM') // TRUE jika masih ada yg dipinjam
        };
    });

    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        profiles = profiles.filter((p:any) => p.name?.toLowerCase().includes(term) || p.nik?.toLowerCase().includes(term));
    }

    return profiles.sort((a:any, b:any) => (b.has_issue ? 1 : 0) - (a.has_issue ? 1 : 0) || a.name.localeCompare(b.name)); 
  };

  const employeeList = getEmployeeProfiles();

  // --- HANDLER HAPUS ---
  const handleClickDelete = (e: any, emp: any) => {
      e.stopPropagation();
      // Double check (meskipun tombol sudah didisable kalau has_issue)
      if (emp.has_issue) {
          alert("⛔ TIDAK BISA DIHAPUS!\n\nKaryawan ini masih meminjam barang. Harap kembalikan semua barang terlebih dahulu.");
          return;
      }
      
      if(confirm(`🗑️ HAPUS KARTU KARYAWAN?\n\nNama: ${emp.name}\n\nKarena semua barang sudah dikembalikan, data ini akan dihapus permanen dari daftar.`)) {
          onDeleteEmployee(emp);
      }
  };

  return (
    <div className="animate-in slide-in-from-bottom-4 pb-20">
      
      <div className="flex justify-center mb-6">
        <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 flex">
            <button onClick={() => setSubTab("EMPLOYEE")} className={`px-6 py-2 rounded-lg text-xs font-black uppercase transition-all ${subTab === 'EMPLOYEE' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>👥 DATA KARYAWAN ({employeeList.length})</button>
            <button onClick={() => setSubTab("STOCK")} className={`px-6 py-2 rounded-lg text-xs font-black uppercase transition-all ${subTab === 'STOCK' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>📦 STOK GUDANG ({stocks.length})</button>
        </div>
      </div>

      {subTab === "EMPLOYEE" && (
        <div className="space-y-4">
            <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
                <h3 className="font-black text-slate-700 uppercase">DAFTAR KARYAWAN & ASET</h3>
                <div className="flex gap-2">
                    <button onClick={onPrint} className="bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-lg hover:bg-emerald-700 transition flex items-center gap-1">🖨️ CETAK</button>
                    {role === 'mess_admin' && (
                        <>
                            <button onClick={onImport} className="bg-blue-600 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-lg hover:bg-blue-700 transition">📥 IMPORT EXCEL</button>
                            <button onClick={() => onLoan()} className="bg-orange-600 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-lg hover:bg-orange-700 transition">+ PINJAM MANUAL</button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {employeeList.map((emp: any, idx: number) => (
                    <div key={idx} onClick={() => setSelectedEmployee(emp)} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-orange-300 transition-all cursor-pointer group relative overflow-hidden">
                        
                        <div className="absolute top-3 right-3 flex gap-1 z-20">
                            {role === 'mess_admin' && (
                                <>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onAddMore(emp.name, emp.nik); }} 
                                        className="bg-orange-50 text-orange-600 border border-orange-200 px-2 py-1 rounded-lg text-[10px] font-black hover:bg-orange-600 hover:text-white transition shadow-sm"
                                        title="Tambah Barang"
                                    >
                                        + ITEM
                                    </button>
                                    
                                    {/* --- TOMBOL HAPUS (LOGIKA BARU) --- */}
                                    {/* Jika has_issue (masih pinjam) -> Disabled & Abu-abu */}
                                    {/* Jika aman -> Merah & Bisa diklik */}
                                    <button 
                                        onClick={(e) => handleClickDelete(e, emp)} 
                                        disabled={emp.has_issue} 
                                        className={`w-7 h-7 flex items-center justify-center rounded-lg text-[10px] font-black transition shadow-sm border 
                                            ${emp.has_issue 
                                                ? 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed opacity-50' 
                                                : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-600 hover:text-white cursor-pointer'
                                            }`}
                                        title={emp.has_issue ? "Kembalikan barang dulu baru bisa dihapus" : "Hapus Data Karyawan Ini"}
                                    >
                                        🗑️
                                    </button>
                                </>
                            )}
                        </div>

                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center font-black text-lg uppercase border-2 border-white shadow-sm">
                                    {emp.name.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-black text-slate-800 uppercase text-sm line-clamp-1">{emp.name}</h4>
                                    <p className="text-[10px] text-slate-400 font-mono font-bold">NIK: {emp.nik}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex gap-2 mt-2">
                            <div className={`flex-1 p-2 rounded-lg text-center border ${emp.has_issue ? 'bg-orange-50 border-orange-100' : 'bg-green-50 border-green-100'}`}>
                                <p className={`text-[9px] font-bold uppercase ${emp.has_issue ? 'text-orange-400' : 'text-green-600'}`}>List Pakaian</p>
                                <p className={`text-sm font-black ${emp.has_issue ? 'text-orange-700' : 'text-green-700'}`}>{emp.has_issue ? `${emp.ga_items.filter((i:any) => i.status === 'DIPINJAM').length} Item` : 'CLEAR'}</p>
                            </div>
                            {(emp.vehicle_items.length > 0 || emp.it_items.length > 0) && (
                                <div className="flex-1 bg-blue-50 p-2 rounded-lg text-center border border-blue-100">
                                    <p className="text-[9px] text-blue-400 font-bold uppercase">ASET LAIN</p>
                                    <div className="flex justify-center gap-2 mt-0.5">
                                        {emp.vehicle_items.length > 0 && <span className="text-sm" title="Bawa Kendaraan">🚗</span>}
                                        {emp.it_items.length > 0 && <span className="text-sm" title="Bawa Laptop">💻</span>}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            {employeeList.length === 0 && <div className="text-center p-10 bg-white rounded-2xl border-2 border-dashed text-slate-400 italic">Belum ada data karyawan.</div>}
        </div>
      )}

      {subTab === "STOCK" && (
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden animate-in fade-in">
            <div className="p-4 bg-slate-800 text-white flex justify-between items-center">
                <h3 className="font-black uppercase text-sm">📦 Stok Gudang Seragam</h3>
                {role === 'mess_admin' && <button onClick={onAddStock} className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-[10px] font-bold transition">+ TAMBAH STOK</button>}
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b">
                        <tr><th className="p-4">Nama Barang</th><th className="p-4 text-center">Ukuran</th><th className="p-4 text-center">Sisa Stok</th>{role === 'mess_admin' && <th className="p-4 text-center">Aksi</th>}</tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {stocks.map((stock: any) => (
                            <tr key={stock.id} className="hover:bg-slate-50 transition group">
                                <td className="p-4 font-bold text-slate-700 uppercase">{stock.item_name}</td>
                                <td className="p-4 text-center"><span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold text-slate-500">{stock.size}</span></td>
                                <td className="p-4 text-center">
                                    <span className={`text-lg font-black ${stock.total_stock < 5 ? 'text-red-500' : 'text-green-600'}`}>{stock.total_stock}</span>
                                </td>
                                {role === 'mess_admin' && (
                                    <td className="p-4 text-center">
                                        <div className="flex justify-center gap-2">
                                            <button onClick={() => onEditStock(stock)} className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition">✏️</button>
                                            <button onClick={() => onDelete('uniform_stocks', stock.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition">🗑️</button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {selectedEmployee && (
        <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center p-4 z-50 backdrop-blur-md animate-in zoom-in-95">
            <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
                <div className="bg-slate-800 p-6 text-white flex justify-between items-start shrink-0">
                    <div className="flex gap-4 items-center">
                        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-2xl font-black">{selectedEmployee.name.charAt(0)}</div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">{selectedEmployee.name}</h2>
                            <p className="text-slate-400 text-xs font-mono font-bold">NIK: {selectedEmployee.nik}</p>
                        </div>
                    </div>
                    <button onClick={() => setSelectedEmployee(null)} className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition">✕</button>
                </div>

                <div className="p-6 overflow-y-auto bg-slate-50 flex-1 space-y-6">
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">👕 Barang Inventaris GA</h3>
                            {role === 'mess_admin' && (
                                <button 
                                    onClick={() => { setSelectedEmployee(null); onAddMore(selectedEmployee.name, selectedEmployee.nik); }} 
                                    className="bg-orange-100 text-orange-600 px-3 py-1 rounded text-[10px] font-bold hover:bg-orange-600 hover:text-white transition"
                                >
                                    + TAMBAH ITEM
                                </button>
                            )}
                        </div>
                        <div className="space-y-2">
                            {selectedEmployee.ga_items.map((loan: any) => (
                                <div key={loan.id} className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="text-2xl">{loan.item_name_cached?.includes("SEPATU") ? '👞' : (loan.item_name_cached?.includes("HELM") ? '⛑️' : '👕')}</div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-xs uppercase">{loan.item_name_cached}</p>
                                            <div className="flex gap-2">
                                                <span className="text-[10px] bg-slate-100 px-1.5 rounded text-slate-500 font-bold">Size: {loan.size_cached}</span>
                                                <span className="text-[10px] text-slate-400">Tgl: {formatDateIndo(loan.created_at)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {loan.status === 'DIPINJAM' ? (
                                        role === 'mess_admin' ? (
                                            <button onClick={() => { onReturn(loan); setSelectedEmployee(null); }} className="bg-slate-800 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-black transition shadow-lg">↩ KEMBALIKAN</button>
                                        ) : <span className="text-red-500 text-[10px] font-bold uppercase border border-red-100 bg-red-50 px-2 py-1 rounded">Dipinjam</span>
                                    ) : (
                                        <div className="text-right">
                                            <span className="text-green-600 text-[10px] font-black uppercase block">✓ KEMBALI</span>
                                            <span className="text-[9px] text-slate-400">{loan.return_condition}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {selectedEmployee.ga_items.length === 0 && <p className="text-center italic text-xs text-slate-400 py-4">Belum ada barang GA yang dipinjam.</p>}
                        </div>
                    </div>

                    {(selectedEmployee.vehicle_items.length > 0 || selectedEmployee.it_items.length > 0) && (
                        <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                            <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">🔗 Aset Departemen Lain</h3>
                            {selectedEmployee.vehicle_items.length > 0 && (
                                <div className="mb-3">
                                    <p className="text-[10px] font-bold text-slate-500 mb-1">KENDARAAN:</p>
                                    {selectedEmployee.vehicle_items.map((v:any) => (
                                        <div key={v.id} className="bg-white p-2 rounded-lg border border-blue-100 mb-1 flex justify-between">
                                            <span className="text-xs font-bold uppercase text-slate-700">{v.jenis === 'MOBIL' ? '🚙' : '🏍️'} {v.nama_kendaraan}</span>
                                            <span className="text-xs font-mono bg-slate-100 px-1 rounded">{v.plat_nomor}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {selectedEmployee.it_items.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 mb-1">IT / LAPTOP:</p>
                                    {selectedEmployee.it_items.map((i:any) => (
                                        <div key={i.id} className="bg-white p-2 rounded-lg border border-blue-100 mb-1 flex justify-between">
                                            <span className="text-xs font-bold uppercase text-slate-700">💻 {i.device_name}</span>
                                            <span className="text-[10px] font-bold text-green-600 uppercase">{i.status}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className="p-4 bg-white border-t border-slate-100 text-center">
                    <button onClick={() => setSelectedEmployee(null)} className="text-slate-400 font-bold text-xs hover:text-slate-600 transition">TUTUP DETAIL</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}