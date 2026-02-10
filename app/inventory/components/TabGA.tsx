"use client";
import { useState } from "react";

const sizeRank: Record<string, number> = {
  "XS": 1, "S": 2, "M": 3, "L": 4, "XL": 5, 
  "2XL": 6, "XXL": 6, "3XL": 7, "XXXL": 7, "4XL": 8, "5XL": 9
};

const getSizeScore = (s: string) => {
  const cleanSize = s?.toUpperCase().trim();
  return sizeRank[cleanSize] || (parseInt(cleanSize) ? 100 + parseInt(cleanSize) : 999);
};

export default function TabGA({ 
  stocks, loans, vehicles, itAssets, employees, role, searchTerm, 
  onAddStock, onEditStock, onDelete, onLoan, onReturn, onPrint, onAddMore, onImport, 
  onDeleteEmployee, onLocationChange 
}: any) {
  
  // STATE NAVIGASI: LOCATION -> DASHBOARD
  const [viewStep, setViewStep] = useState<"LOCATION" | "DASHBOARD">("LOCATION");
  const [selectedLoc, setSelectedLoc] = useState("");

  // STATE DASHBOARD
  const [subTab, setSubTab] = useState<"STOCK" | "EMPLOYEE">("EMPLOYEE");
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null); 

  // --- FILTER STOK ---
  const filteredStocks = stocks.filter((s:any) => {
      const itemLoc = s.lokasi || "TANJUNG UNCANG"; 
      return itemLoc === selectedLoc;
  });

  // --- FILTER KARYAWAN MASTER ---
  const filteredEmployees = employees.filter((e:any) => {
       const empLoc = e.lokasi || "TANJUNG UNCANG";
       return empLoc === selectedLoc;
  });

  // --- LOGIKA PROFIL KARYAWAN (GABUNGAN DATA) ---
  const getEmployeeProfiles = () => {
    // A. Ambil dari Master (yg sudah difilter lokasi)
    let allProfiles = (filteredEmployees || []).map((emp: any) => ({
        id: emp.id, 
        name: emp.nama,
        nik: emp.nik || "-",
        source: 'MASTER'
    }));

    // B. Ambil dari Data Transaksi (Manual) - SEMUA TRANSAKSI DULU
    const loanProfiles = loans.map((l:any) => ({ id: null, name: l.employee_name, nik: l.employee_nik || "-" }));
    
    // C. Gabungkan (Master + Manual)
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
        // Ambil peminjaman orang ini
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
            has_issue: myLoans.some((l:any) => l.status === 'DIPINJAM')
        };
    });

    // --- FILTER FINAL (ANTI BOCOR) ---
    // Hanya tampilkan jika:
    // 1. Dia terdaftar sebagai karyawan di LOKASI INI.
    // 2. ATAU, dia meminjam barang yang berasal dari GUDANG LOKASI INI.
    profiles = profiles.filter(p => {
        // Cek 1: Apakah dia Master di sini?
        if (p.id) {
            return filteredEmployees.some((fe:any) => fe.id === p.id);
        }
        
        // Cek 2: Apakah dia punya pinjaman dari stok gudang lokasi ini?
        const hasItemInThisLoc = p.ga_items.some((loan:any) => {
            // Cari info stok barang yang dipinjam
            const stock = stocks.find((s:any) => s.id === loan.stock_id);
            // Cek lokasi stok tersebut
            const stockLoc = stock ? (stock.lokasi || "TANJUNG UNCANG") : "TANJUNG UNCANG";
            return stockLoc === selectedLoc;
        });
        
        return hasItemInThisLoc;
    });

    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        profiles = profiles.filter((p:any) => p.name?.toLowerCase().includes(term) || p.nik?.toLowerCase().includes(term));
    }

    return profiles.sort((a:any, b:any) => (b.has_issue ? 1 : 0) - (a.has_issue ? 1 : 0) || a.name.localeCompare(b.name)); 
  };

  const employeeList = getEmployeeProfiles();
  const formatDateIndo = (dateString: string) => { if (!dateString) return "-"; return new Date(dateString).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }); };

  // --- HANDLER HAPUS ---
  const handleClickDelete = (e: any, emp: any) => {
      e.stopPropagation();
      if (emp.has_issue) {
          alert("⛔ TIDAK BISA DIHAPUS!\n\nKaryawan ini masih meminjam barang.");
          return;
      }
      if(confirm(`🗑️ HAPUS KARTU KARYAWAN?\n\nNama: ${emp.name}\n\nData ini akan dihapus permanen.`)) {
          onDeleteEmployee(emp);
      }
  };

  return (
    <div className="animate-in fade-in pb-20">
      
      {/* HEADER NAVIGASI */}
      {viewStep === "DASHBOARD" && (
          <div className="flex items-center gap-4 mb-6">
              <button 
                onClick={() => setViewStep("LOCATION")} 
                className="w-10 h-10 bg-white rounded-full shadow-sm border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition text-slate-600 font-black text-xl"
              >
                  ⬅
              </button>
              <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">DASHBOARD HR:</p>
                  <h2 className="text-lg font-black text-slate-800 uppercase leading-none">{selectedLoc}</h2>
              </div>
          </div>
      )}

      {/* STEP 1: PILIH LOKASI */}
      {viewStep === "LOCATION" && (
          <div className="space-y-6 mt-6">
              <div className="flex justify-between items-end px-4">
                  <h3 className="font-black text-slate-700 uppercase">PILIH DEPARTEMEN</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['TANJUNG UNCANG', 'SEKUPANG', 'MEGA CIPTA'].map((loc) => {
                      
                      // --- LOGIKA HITUNG JUMLAH (CARD COUNT) ---
                      // 1. Karyawan Master di Lokasi Ini
                      const masterInLoc = employees.filter((e:any) => (e.lokasi || "TANJUNG UNCANG") === loc);
                      const masterNames = masterInLoc.map((e:any) => e.nama.toUpperCase());

                      // 2. Peminjam Manual di Lokasi Ini (Cek Stok Gudang Mana)
                      // Cari ID Stok yang milik lokasi ini
                      const stockIdsInLoc = stocks.filter((s:any) => (s.lokasi || "TANJUNG UNCANG") === loc).map((s:any) => s.id);
                      // Cari Peminjaman yang pakai stok tsb
                      const loansInLoc = loans.filter((l:any) => stockIdsInLoc.includes(l.stock_id));
                      const loanNames = loansInLoc.map((l:any) => l.employee_name.toUpperCase());

                      // 3. Gabungkan (Unique)
                      const totalCount = new Set([...masterNames, ...loanNames]).size;

                      return (
                          <div 
                              key={loc} 
                              onClick={() => { setSelectedLoc(loc); setViewStep("DASHBOARD"); onLocationChange(loc); }} 
                              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-orange-400 transition relative overflow-hidden group flex flex-col justify-between min-h-[160px] cursor-pointer"
                          >
                              <div className="absolute -right-4 -top-4 text-8xl opacity-5 grayscale group-hover:scale-110 transition pointer-events-none">👥</div>
                              
                              <div>
                                  <h4 className="font-black text-slate-800 text-lg">{loc}</h4>
                                  {/* TAMPILKAN TOTAL COUNT YANG SUDAH DIPERBAIKI */}
                                  <p className="text-xs font-bold text-orange-600 mt-1">{totalCount} Karyawan Terdaftar</p>
                              </div>

                              {role === 'mess_admin' && (
                                <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onImport(loc); }} 
                                        className="flex-1 bg-slate-800 text-white py-2 rounded-lg text-[10px] font-bold hover:bg-black transition flex items-center justify-center gap-1 z-10 hover:shadow-md"
                                    >
                                        📥 IMPORT DATA
                                    </button>
                                </div>
                              )}
                          </div>
                      );
                  })}
              </div>
          </div>
      )}

      {/* STEP 2: DASHBOARD GA */}
      {viewStep === "DASHBOARD" && (
        <div className="animate-in slide-in-from-bottom-4">
          
          <div className="flex justify-center mb-6">
            <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 flex">
                <button onClick={() => setSubTab("EMPLOYEE")} className={`px-6 py-2 rounded-lg text-xs font-black uppercase transition-all ${subTab === 'EMPLOYEE' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>👥 KARYAWAN ({employeeList.length})</button>
                <button onClick={() => setSubTab("STOCK")} className={`px-6 py-2 rounded-lg text-xs font-black uppercase transition-all ${subTab === 'STOCK' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>📦 STOK ({filteredStocks.length})</button>
            </div>
          </div>

          {/* SUBTAB 1: KARYAWAN */}
          {subTab === "EMPLOYEE" && (
            <div className="space-y-4">
                <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
                    <h3 className="font-black text-slate-700 uppercase">DAFTAR KARYAWAN - {selectedLoc}</h3>
                    <div className="flex gap-2">
                        <button onClick={() => onPrint(selectedLoc)} className="bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-lg hover:bg-emerald-700 transition flex items-center gap-1">🖨️ CETAK</button>
                        {role === 'mess_admin' && (
                            <button onClick={() => onLoan()} className="bg-orange-600 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-lg hover:bg-orange-700 transition">+ PINJAM</button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {employeeList.map((emp: any, idx: number) => (
                        <div key={idx} onClick={() => setSelectedEmployee(emp)} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-orange-300 transition-all cursor-pointer group relative overflow-hidden">
                            <div className="absolute top-3 right-3 flex gap-1 z-20">
                                {role === 'mess_admin' && (
                                    <>
                                        <button onClick={(e) => { e.stopPropagation(); onAddMore(emp.name, emp.nik); }} className="bg-orange-50 text-orange-600 border border-orange-200 px-2 py-1 rounded-lg text-[10px] font-black hover:bg-orange-600 hover:text-white transition shadow-sm" title="Tambah Barang">+ ITEM</button>
                                        <button onClick={(e) => handleClickDelete(e, emp)} disabled={emp.has_issue} className={`w-7 h-7 flex items-center justify-center rounded-lg text-[10px] font-black transition shadow-sm border ${emp.has_issue ? 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed opacity-50' : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-600 hover:text-white cursor-pointer'}`}>🗑️</button>
                                    </>
                                )}
                            </div>

                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center font-black text-lg uppercase border-2 border-white shadow-sm">{emp.name.charAt(0)}</div>
                                    <div>
                                        <h4 className="font-black text-slate-800 uppercase text-sm line-clamp-1">{emp.name}</h4>
                                        <p className="text-[10px] text-slate-400 font-mono font-bold">NIK: {emp.nik}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex gap-2 mt-2">
                                <div className={`flex-1 p-2 rounded-lg text-center border ${emp.has_issue ? 'bg-orange-50 border-orange-100' : 'bg-green-50 border-green-100'}`}>
                                    <p className={`text-[9px] font-bold uppercase ${emp.has_issue ? 'text-orange-400' : 'text-green-600'}`}>Status Pinjam</p>
                                    <p className={`text-sm font-black ${emp.has_issue ? 'text-orange-700' : 'text-green-700'}`}>{emp.has_issue ? `${emp.ga_items.filter((i:any) => i.status === 'DIPINJAM').length} Item` : 'AMAN'}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {employeeList.length === 0 && <div className="text-center p-10 bg-white rounded-2xl border-2 border-dashed text-slate-400 italic">Belum ada data karyawan di {selectedLoc}.</div>}
            </div>
          )}

          {/* SUBTAB 2: STOK GUDANG */}
          {subTab === "STOCK" && (
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden animate-in fade-in">
                <div className="p-4 bg-slate-800 text-white flex justify-between items-center">
                    <h3 className="font-black uppercase text-sm">📦 Stok Gudang - {selectedLoc}</h3>
                    {role === 'mess_admin' && <button onClick={() => onAddStock(selectedLoc)} className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-[10px] font-bold transition">+ TAMBAH STOK</button>}
                </div>
                <div className="overflow-x-auto">
 {/* --- REVISI: GROUPING & SORTING STOK --- */}
                <div className="p-4 space-y-8">
                    {Object.entries(filteredStocks.reduce((acc: any, item: any) => {
                        // 1. Grouping by Nama Barang
                        const name = item.item_name;
                        if (!acc[name]) acc[name] = [];
                        acc[name].push(item);
                        return acc;
                    }, {})).map(([groupName, items]: any) => (
                        <div key={groupName} className="border rounded-xl overflow-hidden shadow-sm">
                            {/* Header Nama Barang */}
                            <div className="bg-slate-100 p-3 border-b flex justify-between items-center">
                                <h4 className="font-black text-slate-700 uppercase tracking-wider text-xs md:text-sm">📌 {groupName}</h4>
                                <span className="text-[10px] font-bold bg-white px-2 py-1 rounded border text-slate-500">{items.length} Varian Size</span>
                            </div>
                            
                            {/* Tabel Per Item */}
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-400 uppercase text-[9px] font-bold border-b">
                                    <tr><th className="p-3 w-1/3">Ukuran</th><th className="p-3 text-center">Sisa Stok</th>{role === 'mess_admin' && <th className="p-3 text-right">Aksi</th>}</tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 bg-white">
                                    {/* 2. Sorting by Ukuran (Kecil -> Besar) */}
                                    {items.sort((a:any, b:any) => getSizeScore(a.size) - getSizeScore(b.size))
                                          .map((stock: any) => (
                                        <tr key={stock.id} className="hover:bg-orange-50 transition group">
                                            <td className="p-3"><span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold border border-slate-200">{stock.size}</span></td>
                                            <td className="p-3 text-center">
                                                <span className={`text-sm font-black ${stock.total_stock < 5 ? 'text-red-500 animate-pulse' : 'text-green-600'}`}>{stock.total_stock}</span>
                                            </td>
                                            {role === 'mess_admin' && (
                                                <td className="p-3 text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <button onClick={() => onEditStock(stock)} className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white p-1.5 rounded-lg transition text-xs font-bold">EDIT</button>
                                                        <button onClick={() => onDelete('uniform_stocks', stock.id)} className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white p-1.5 rounded-lg transition text-xs font-bold">HAPUS</button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>
                </div>
                {filteredStocks.length === 0 && <div className="text-center p-8 italic text-slate-400">Stok kosong di lokasi ini.</div>}
            </div>
          )}

          {/* MODAL DETAIL KARYAWAN */}
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
                        {/* LIST BARANG GA */}
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">👕 Barang Inventaris GA</h3>
                                {role === 'mess_admin' && (
                                    <button onClick={() => { setSelectedEmployee(null); onAddMore(selectedEmployee.name, selectedEmployee.nik); }} className="bg-orange-100 text-orange-600 px-3 py-1 rounded text-[10px] font-bold hover:bg-orange-600 hover:text-white transition">+ TAMBAH ITEM</button>
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
                        
                        {/* ASET DEPARTEMEN LAIN */}
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
                                                <span className="text-xs font-bold text-green-600 uppercase">{i.status}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}