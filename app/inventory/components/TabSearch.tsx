"use client";
import { useState, useMemo, useEffect, useRef } from "react";

// --- KOMPONEN DROPDOWN MESS (CUSTOM SCROLL) ---
const CustomSelectMessLocal = ({ options, value, onChange }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
  
    useEffect(() => {
      function handleClickOutside(event: any) {
        if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false);
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);
  
    const selectedItem = options.find((opt: any) => String(opt.id) === String(value));
  
    return (
      <div className="relative w-full" ref={wrapperRef}>
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-left flex justify-between items-center focus:outline-none focus:border-blue-500 transition hover:bg-slate-100"
        >
          <span className={`text-sm font-bold truncate ${selectedItem ? "text-slate-800" : "text-slate-400"}`}>
            {selectedItem ? `📍 ${selectedItem.nama_mess}` : "-- Pilih Lokasi Mess --"}
          </span>
          <span className="text-xs text-slate-400">▼</span>
        </button>
  
        {isOpen && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-40 overflow-y-auto animate-in fade-in zoom-in-95 custom-scrollbar">
            {options.length === 0 ? (
               <div className="p-3 text-xs text-slate-400 italic text-center">Data Kosong</div>
            ) : (
              options.map((opt: any) => (
                <div
                  key={opt.id}
                  onClick={() => { onChange(opt.id); setIsOpen(false); }}
                  className={`p-3 text-sm border-b border-slate-50 last:border-0 cursor-pointer hover:bg-blue-50 transition text-slate-700 font-bold ${String(value) === String(opt.id) ? "bg-blue-100 text-blue-800" : ""}`}
                >
                  📍 {opt.nama_mess}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
};

export default function TabSearch({
  employees, residents, vehicles, itAssets, loans, messList, role,
  onResign, onMoveMess, onReturnGA, 
  onSwitchTab 
}: any) {

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [targetMessId, setTargetMessId] = useState("");
  const [targetKamar, setTargetKamar] = useState("");

  // --- LOGIKA PENCARIAN ---
  const searchResults = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];
    const term = searchTerm.toUpperCase();
    const allPeopleMap = new Map();

    // Prioritas 1: Master
    employees.forEach((e: any) => allPeopleMap.set(e.nama.toUpperCase(), { name: e.nama.toUpperCase(), nik: e.nik, source: 'MASTER', id: e.id, divisi: e.divisi }));
    
    // Prioritas 2: Resident
    residents.forEach((r: any) => { 
        const key = r.nama_karyawan.toUpperCase(); 
        if (!allPeopleMap.has(key)) {
            allPeopleMap.set(key, { name: key, nik: r.nik, source: 'RESIDENT', id: null, divisi: r.jabatan }); 
        } else {
            // Kalau sudah ada, cek apakah NIK-nya kosong? Kalau kosong diisi dari sini
            const existing = allPeopleMap.get(key);
            if (!existing.nik || existing.nik === '-') {
                existing.nik = r.nik;
            }
        }
    });

    // Prioritas 3: Loan GA
    loans.forEach((l: any) => { 
        const key = l.employee_name.toUpperCase(); 
        if (!allPeopleMap.has(key)) {
            allPeopleMap.set(key, { name: key, nik: l.employee_nik, source: 'LOAN', id: null }); 
        } else {
            const existing = allPeopleMap.get(key);
            if (!existing.nik || existing.nik === '-') {
                existing.nik = l.employee_nik;
            }
        }
    });

    return Array.from(allPeopleMap.values()).filter((p: any) => p.name.includes(term) || (p.nik && p.nik.includes(term)));
  }, [searchTerm, employees, residents, loans]);

  // --- DETAIL PROFIL (DETEKTIF MODE ON 🕵️‍♂️) ---
  const getFullProfile = (person: any) => {
    const name = person.name.toUpperCase();
    const messData = residents.find((r:any) => r.nama_karyawan.toUpperCase() === name);
    const vehicleData = vehicles.filter((v:any) => v.pic_kendaraan?.toUpperCase() === name || v.pic_nik === person.nik);
    const itData = itAssets.filter((i:any) => i.current_holder?.toUpperCase() === name || i.nik === person.nik);
    const gaData = loans.filter((l:any) => l.employee_name.toUpperCase() === name && (l.employee_nik === person.nik || person.nik === '-'));
    
    const gaPending = gaData.filter((l:any) => l.status === 'DIPINJAM');
    const isSafeToResign = gaPending.length === 0;

    // 1. CARI DIVISI TERBAIK
    let finalDivisi = person.divisi;
    if (!finalDivisi || finalDivisi === '-') if (messData && messData.jabatan) finalDivisi = messData.jabatan;
    if (!finalDivisi || finalDivisi === '-') { const itWithDept = itData.find((i:any) => i.department && i.department !== '-'); if (itWithDept) finalDivisi = itWithDept.department; }
    if (!finalDivisi) finalDivisi = "Divisi Umum / Staff";

    // 2. CARI NIK TERBAIK (Supaya tidak kosong)
    let finalNik = person.nik;
    if (!finalNik || finalNik === '-' || finalNik === 'null') {
        // Cek di Mess
        if (messData && messData.nik && messData.nik !== '-') finalNik = messData.nik;
        // Cek di GA (Loans)
        else if (gaData.length > 0) {
             const gaWithNik = gaData.find((l:any) => l.employee_nik && l.employee_nik !== '-');
             if(gaWithNik) finalNik = gaWithNik.employee_nik;
        }
        // Cek di IT
        else if (itData.length > 0) {
             const itWithNik = itData.find((i:any) => i.nik && i.nik !== '-');
             if(itWithNik) finalNik = itWithNik.nik;
        }
    }

    return { 
        ...person, 
        divisi: finalDivisi, 
        nik: finalNik, // <-- PAKE HASIL DETEKTIF
        messData, vehicleData, itData, gaData, gaPending, isSafeToResign 
    };
  };

  const handleSelect = (person: any) => { setSelectedProfile(getFullProfile(person)); };

  const executeMoveMess = () => {
    if(!targetMessId) return alert("Pilih lokasi mess baru!");
    onMoveMess(selectedProfile.messData?.id, targetMessId, targetKamar, selectedProfile.name);
    setIsMoveModalOpen(false);
    setSelectedProfile(null); 
  };

  const executeResign = () => {
    if(!selectedProfile.isSafeToResign) return alert("Masih ada barang GA yang dipinjam!");
    if(confirm(`⚠️ PERINGATAN RESIGN ⚠️\n\nAnda akan menghapus data Sdr. ${selectedProfile.name}.\n\nLanjutkan?`)) {
        onResign(selectedProfile);
        setSelectedProfile(null);
        setSearchTerm("");
    }
  };

  return (
    <div className="animate-in fade-in pb-20">
      
      <div className="max-w-2xl mx-auto mb-8 relative">
        <input type="text" placeholder="Ketik Nama atau NIK Karyawan..." className="w-full p-5 pl-12 rounded-[2rem] border-2 border-slate-200 text-lg font-bold text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none transition" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl">🔍</span>
      </div>

      {!selectedProfile && searchTerm && (
          <div className="max-w-4xl mx-auto space-y-2">
              {searchResults.map((p: any, idx: number) => (
                  <div key={idx} onClick={() => handleSelect(p)} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:bg-blue-50 cursor-pointer flex justify-between items-center transition">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-black text-slate-500">{p.name.charAt(0)}</div>
                          <div>
                              <h4 className="font-bold text-slate-800">{p.name}</h4>
                              {/* Tampilkan NIK juga di list pencarian biar yakin */}
                              <p className="text-xs text-slate-400 font-mono">NIK: {p.nik || "-"}</p>
                          </div>
                      </div>
                      <span className="text-xs font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">LIHAT DETAIL ➜</span>
                  </div>
              ))}
              {searchResults.length === 0 && <p className="text-center text-slate-400 italic">Data tidak ditemukan...</p>}
          </div>
      )}

      {selectedProfile && (
          <div className="max-w-5xl mx-auto animate-in zoom-in-95">
              <div className="bg-slate-800 text-white p-6 rounded-t-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-black">{selectedProfile.name.charAt(0)}</div>
                      <div>
                          <h2 className="text-2xl md:text-3xl font-black uppercase">{selectedProfile.name}</h2>
                          <div className="flex gap-2 text-sm opacity-80 font-mono mt-1">
                              {/* NIK FINAL HASIL DETEKTIF */}
                              <span>NIK: {selectedProfile.nik || "TIDAK ADA"}</span>
                              <span>|</span>
                              <span className="font-bold text-yellow-400">{selectedProfile.divisi}</span>
                          </div>
                      </div>
                  </div>
                  <div className="flex gap-2">
                      {role === 'mess_admin' && (
                          <button onClick={executeResign} disabled={!selectedProfile.isSafeToResign} className={`px-6 py-3 rounded-xl font-black text-sm transition shadow-lg flex items-center gap-2 ${selectedProfile.isSafeToResign ? 'bg-red-600 hover:bg-red-700 text-white cursor-pointer' : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-80'}`}>{selectedProfile.isSafeToResign ? '❌ PROSES RESIGN' : '🔒 KEMBALIKAN ASET DULU'}</button>
                      )}
                      <button onClick={() => setSelectedProfile(null)} className="bg-white/10 hover:bg-white/20 px-4 py-3 rounded-xl font-bold text-sm transition">TUTUP</button>
                  </div>
              </div>

              <div className="bg-slate-50 border-x border-b border-slate-200 rounded-b-[2.5rem] p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* MESS CARD */}
                  <div onClick={() => selectedProfile.messData && onSwitchTab("MESS")} className={`bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden transition group ${selectedProfile.messData ? 'cursor-pointer hover:shadow-xl hover:border-blue-400' : ''}`}>
                      <div className="absolute top-0 right-0 bg-blue-100 text-blue-600 px-4 py-1 rounded-bl-2xl text-[10px] font-black">TEMPAT TINGGAL</div>
                      <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2"><span className="text-2xl">🏠</span> MESS & HUNIAN</h3>
                      {selectedProfile.messData ? (
                          <div className="space-y-3">
                              <div className="text-center py-4 bg-blue-50 rounded-2xl border border-blue-100 group-hover:bg-blue-100 transition"><p className="text-xs text-blue-400 font-bold uppercase">Lokasi Mess</p><p className="text-xl font-black text-blue-900">{messList.find((m:any) => m.id === selectedProfile.messData.mess_id)?.nama_mess || "Unknown"}</p><p className="text-sm font-bold text-slate-600 mt-1">Kamar No: {selectedProfile.messData.kamar_no}</p><p className="text-[10px] text-blue-400 mt-2 font-bold">(Klik untuk ke Tab Mess)</p></div>
                              {role === 'mess_admin' && (<button onClick={(e) => { e.stopPropagation(); setIsMoveModalOpen(true); }} className="w-full bg-slate-800 text-white py-2 rounded-xl text-xs font-bold hover:bg-black transition">🔄 PINDAH MESS</button>)}
                          </div>
                      ) : (<div className="text-center py-8 text-slate-400 italic"><p>Tidak tinggal di Mess</p>{role === 'mess_admin' && <button onClick={(e) => { e.stopPropagation(); setIsMoveModalOpen(true); }} className="mt-2 text-blue-600 font-bold text-xs hover:underline">+ Masukkan ke Mess</button>}</div>)}
                  </div>

                  {/* GA CARD */}
                  <div onClick={() => selectedProfile.gaData.length > 0 && onSwitchTab("UNIFORM")} className={`bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden transition ${selectedProfile.gaData.length > 0 ? 'cursor-pointer hover:shadow-xl hover:border-orange-400' : ''}`}>
                      <div className={`absolute top-0 right-0 px-4 py-1 rounded-bl-2xl text-[10px] font-black ${selectedProfile.isSafeToResign ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{selectedProfile.isSafeToResign ? 'AMAN (CLEAR)' : 'TUNGGAKAN ASET'}</div>
                      <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2"><span className="text-2xl">👕</span> GA & SERAGAM</h3>
                      <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                          {selectedProfile.gaData.map((item: any) => (
                              <div key={item.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100 text-xs group-hover:bg-orange-50 transition"><div className="font-bold text-slate-700">{item.item_name_cached} <span className="text-slate-400">({item.size_cached})</span></div>{item.status === 'DIPINJAM' ? (role === 'mess_admin' ? (<button onClick={(e) => { e.stopPropagation(); onReturnGA(item); }} className="bg-orange-500 text-white px-2 py-1 rounded text-[10px] font-bold hover:bg-orange-600">KEMBALIKAN</button>) : <span className="text-red-500 font-bold">DIPINJAM</span>) : <span className="text-green-600 font-bold">✓ KEMBALI</span>}</div>
                          ))}
                          {selectedProfile.gaData.length === 0 ? <p className="text-center text-slate-400 italic text-xs py-4">Tidak ada riwayat.</p> : <p className="text-center text-[10px] text-orange-400 font-bold mt-2">(Klik untuk ke Tab GA)</p>}
                      </div>
                  </div>

                  {/* VEHICLE CARD */}
                  <div onClick={() => selectedProfile.vehicleData.length > 0 && onSwitchTab("VEHICLE")} className={`bg-white p-5 rounded-3xl border border-slate-200 shadow-sm transition ${selectedProfile.vehicleData.length > 0 ? 'cursor-pointer hover:shadow-xl hover:border-blue-400' : ''}`}>
                      <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2"><span className="text-2xl">🚗</span> KENDARAAN</h3>
                      <div className="space-y-2">
                          {selectedProfile.vehicleData.map((v: any) => (<div key={v.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100 group-hover:bg-blue-50 transition"><div className="flex justify-between font-bold text-slate-800 text-xs uppercase"><span>{v.jenis === 'MOBIL' ? '🚙' : '🏍️'} {v.nama_kendaraan}</span><span className="bg-slate-200 px-2 rounded">{v.plat_nomor}</span></div><p className="text-[10px] text-slate-400 mt-1">Klik untuk detail di Tab Kendaraan</p></div>))}
                          {selectedProfile.vehicleData.length === 0 && <p className="text-center text-slate-400 italic text-xs py-4">Tidak membawa kendaraan.</p>}
                      </div>
                  </div>

                  {/* IT CARD */}
                  <div onClick={() => selectedProfile.itData.length > 0 && onSwitchTab("IT")} className={`bg-white p-5 rounded-3xl border border-slate-200 shadow-sm transition ${selectedProfile.itData.length > 0 ? 'cursor-pointer hover:shadow-xl hover:border-purple-400' : ''}`}>
                      <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2"><span className="text-2xl">💻</span> IT & LAPTOP</h3>
                      <div className="space-y-2">
                          {selectedProfile.itData.map((i: any) => (<div key={i.id} className="bg-purple-50 p-3 rounded-xl border border-purple-100 flex justify-between items-center group-hover:bg-purple-100 transition"><div><p className="font-bold text-purple-900 text-xs uppercase">{i.device_name}</p><p className="text-[10px] text-purple-400">{i.category}</p></div><span className="text-[10px] font-bold bg-white px-2 py-1 rounded text-purple-600">{i.status}</span></div>))}
                          {selectedProfile.itData.length === 0 ? <p className="text-center text-slate-400 italic text-xs py-4">Tidak membawa aset IT.</p> : <p className="text-center text-[10px] text-purple-400 font-bold mt-2">(Klik untuk ke Tab IT)</p>}
                      </div>
                  </div>

              </div>
          </div>
      )}

      {isMoveModalOpen && (
          <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in zoom-in-95">
              <div className="bg-white w-full max-w-sm p-6 rounded-[2rem] shadow-2xl">
                  <h3 className="text-lg font-black text-slate-800 mb-4 text-center uppercase">Pindah / Masuk Mess</h3>
                  <div className="space-y-3">
                      <div><label className="text-xs font-bold text-slate-400 ml-1">Pilih Mess Baru</label><CustomSelectMessLocal options={messList} value={targetMessId} onChange={(val: any) => setTargetMessId(val)} /></div>
                      <div><label className="text-xs font-bold text-slate-400 ml-1">Nomor Kamar</label><input type="text" className="w-full p-3 bg-slate-50 rounded-xl border font-bold text-sm" placeholder="Contoh: 05" value={targetKamar} onChange={(e) => setTargetKamar(e.target.value)} /></div>
                      <button onClick={executeMoveMess} className="w-full bg-blue-600 text-white py-3 rounded-xl font-black mt-2 hover:bg-blue-700 transition">SIMPAN PERPINDAHAN</button>
                      <button onClick={() => setIsMoveModalOpen(false)} className="w-full text-slate-400 font-bold text-xs py-2 hover:text-slate-600">BATAL</button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
}