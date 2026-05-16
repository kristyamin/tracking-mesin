"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // --- STATE BARU: TAB PINTAR ---
  const [activeTab, setActiveTab] = useState("gatepass");

  useEffect(() => {
    // Cek memori dari Gembok Depan
    const aksesSah = sessionStorage.getItem("akses_gatepass");
    const namaUser = sessionStorage.getItem("nama_user"); 

    if (!aksesSah || !namaUser) {
      alert("⚠️ Akses ditolak! Silakan masuk melalui gembok utama.");
      router.push("/");
      return;
    }

    setIsAdmin(true); // Langsung kasih masuk!
    setIsCheckingAuth(false);
  }, [router]);

  const handleLogout = () => {
    // 1. Hapus ingatan sementara
    sessionStorage.clear();
    
    // 2. INI NAMA TIKET YANG BENAR BEB!
    localStorage.removeItem("role_gatepass"); 
    
    // 3. Kembali ke beranda
    router.push("/");
  };

  const [riwayat, setRiwayat] = useState<any[]>([]);

  const hapusData = async (idHapus: string) => {
  if(confirm(`⚠️ Yakin ingin menghapus data surat jalan ${idHapus}? Data yang dihapus tidak dapat dikembalikan.`)) {
    try {
      // Hapus dari Supabase
      await supabase.from('form_pengajuan').delete().eq('id', idHapus);

      // Hapus dari layar
      setRiwayat(riwayat.filter(item => item.id !== idHapus));
      alert("Data berhasil dihapus!");
    } catch (err) {
      alert("Gagal menghapus data dari server.");
    }
  }
};

  const [searchQuery, setSearchQuery] = useState("");
  const [filterBulan, setFilterBulan] = useState("Semua Bulan");
  const [filterTahun, setFilterTahun] = useState("Semua Tahun");

  const [tahunList, setTahunList] = useState<string[]>([]);
  useEffect(() => {
    const startYear = 2026;
    const currentYear = new Date().getFullYear();
    const endYear = currentYear + 5; 
    const generatedYears = [];
    for (let y = startYear; y <= endYear; y++) {
      generatedYears.push(y.toString());
    }
    setTahunList(generatedYears);
  }, []);

  // --- STATE UNTUK CUSTOM DROPDOWN (Hanya Tampil 5 Item & Bisa Scroll) ---
  const [isBulanOpen, setIsBulanOpen] = useState(false);
  const [isTahunOpen, setIsTahunOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Menutup dropdown kalau user klik di luar area
  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsBulanOpen(false);
        setIsTahunOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const bulanOptions = [
    { label: "Semua Bulan", value: "Semua Bulan" }, { label: "Januari", value: "01" },
    { label: "Februari", value: "02" }, { label: "Maret", value: "03" },
    { label: "April", value: "04" }, { label: "Mei", value: "05" },
    { label: "Juni", value: "06" }, { label: "Juli", value: "07" },
    { label: "Agustus", value: "08" }, { label: "September", value: "09" },
    { label: "Oktober", value: "10" }, { label: "November", value: "11" },
    { label: "Desember", value: "12" },
  ];

  // --- LOGIKA FILTER (TAB + SEARCH + BULAN + TAHUN) ---
  const filteredData = riwayat.filter(item => {
    const matchTab = item.type === activeTab;
    const matchSearch = item.pemohon.toLowerCase().includes(searchQuery.toLowerCase()) || item.nik.includes(searchQuery);
    
    // Cari value bulan dari label yang dipilih
    const selectedBulanValue = bulanOptions.find(b => b.label === filterBulan)?.value;
    const matchBulan = filterBulan === "Semua Bulan" ? true : item.bulan === selectedBulanValue;
    const matchTahun = filterTahun === "Semua Tahun" ? true : item.tahun === filterTahun;
    
    return matchTab && matchSearch && matchBulan && matchTahun;
  });

  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [printDocument, setPrintDocument] = useState<any>(null);

  const eksekusiCetak = () => {
    window.print();
  };

  if (isCheckingAuth) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Memuat...</div>;

  // =========================================================================
  // HALAMAN KERTAS PRINT PDF (2 LAYOUT DINAMIS)
  // =========================================================================
  if (printDocument) {
    return (
      <div className="min-h-screen bg-gray-200 flex flex-col items-center py-10 print:py-0 print:bg-white">
        <div className="mb-6 flex gap-4 print:hidden">
          <button onClick={() => setPrintDocument(null)} className="bg-slate-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg hover:bg-slate-800 active:scale-95 transition">⬅ Kembali</button>
          <button onClick={eksekusiCetak} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold shadow-lg hover:bg-blue-700 active:scale-95 transition flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
            Cetak Kertas Asli
          </button>
        </div>

        {/* --- PERUBAHAN: min-h diganti h-max agar kertasnya fleksibel mengikuti isi --- */}
        <div className="bg-white w-[210mm] h-max p-12 shadow-2xl print:shadow-none text-black relative">
          
          {printDocument.type === 'gatepass' ? (
            /* --- LAYOUT 1: KERTAS GATE PASS (Asli Dari Kodemu) --- */
            <>
              <div className="border-b-4 border-slate-800 pb-4 mb-8 flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-black tracking-tighter text-blue-900">PT. DJITOE MESINDO</h1>
                  <p className="text-sm font-medium mt-1">Sistem Manajemen Keluar Barang</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold border border-slate-400 p-2 uppercase">Gate Pass</p>
                  <p className="font-bold mt-2">{printDocument.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <p className="text-sm text-gray-500 uppercase font-bold">Informasi Pemohon</p>
                  <p className="font-bold text-lg mt-1">{printDocument.pemohon}</p>
                  <p className="text-sm">NIK: {printDocument.nik}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 uppercase font-bold">Waktu Pengajuan</p>
                  <p className="font-bold text-lg mt-1">{printDocument.tanggal}</p>
                </div>
              </div>

              <p className="text-sm text-gray-500 uppercase font-bold mb-2">Tujuan / Alasan Bawa Barang</p>
              <div className="p-4 border border-gray-300 bg-gray-50 mb-8">
                <p className="font-medium">"{printDocument.tujuan}"</p>
              </div>

              <p className="text-sm text-gray-500 uppercase font-bold mb-2">Rincian Barang</p>
              <table className="w-full border-collapse border border-gray-400 mb-12">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-400 p-2 text-center w-12">No</th>
                    <th className="border border-gray-400 p-2 text-left">Nama Barang</th>
                    <th className="border border-gray-400 p-2 text-center w-32">Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  {printDocument.barang.map((b: any, index: number) => (
                    <tr key={index}>
                      <td className="border border-gray-400 p-2 text-center">{index + 1}</td>
                      <td className="border border-gray-400 p-2 font-medium">{b.namaBarang}</td>
                      <td className="border border-gray-400 p-2 text-center font-bold">{b.jumlah}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-between items-end mt-20">
                <div className="text-center">
                  <div className="w-36 h-36 border-2 border-dashed border-gray-400 flex items-center justify-center p-2 mb-2 bg-white">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://sistem-djitoe.com/security?surat=${printDocument.id}`} alt="QR Code Security" className="w-full h-full object-contain" />
                  </div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Scan Security</p>
                </div>
                
                <div className="flex gap-12">
                  <div className="text-center">
                    <p className="text-sm mb-16">Disetujui Oleh,</p>
                    <div className="relative">
                      {printDocument.approvedBy.stefanus && <img src="/TTD om stev 2.png" className="absolute -top-24 left-1/2 -translate-x-1/2 w-[250px] max-w-none contrast-200 brightness-75" alt="TTD Stefanus" />}
                    </div>
                    <p className="font-bold underline">Stefanus</p>
                    <p className="text-[10px] text-gray-500">Digitally Signed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm mb-16">Mengetahui,</p>
                    <div className="relative">
                      {printDocument.approvedBy.roy && <img src="/TTD Roy.png" className="absolute -top-17 left-1/2 -translate-x-1/2 w-[130px] max-w-none contrast-200 brightness-80" alt="TTD Roy" />}
                    </div>
                    <p className="font-bold underline">Roy</p>
                    <p className="text-[10px] text-gray-500">Digitally Signed</p>
                  </div>
                </div>
              </div>

              {/* --- FOOTER GATEPASS (DI ATAS GARIS GUNTING) --- */}
              <div className="mt-20 relative z-10 flex flex-col items-center">
                {/* Teks Sah (Pindah ke Atas) */}
                <p className="text-[10px] text-gray-400 mb-2 font-sans uppercase tracking-widest text-center">
                  Dokumen ini dicetak secara sah oleh sistem PT. Djitoe Mesindo pada {new Date().toLocaleDateString('id-ID')}
                </p>
                
                {/* Garis Gunting (Pindah ke Bawah Teks) */}
                <div className="w-full border-t-2 border-dashed border-gray-300 relative flex justify-center">
                  <span className="absolute -top-4 bg-white px-2 text-lg print:hidden">✂️</span>
                </div>
              </div>
            </>
          ) : (
           /* --- LAYOUT 2: KERTAS HRD (IJIN & HADIR DENGAN LOGO JUMBO) --- */
            <div className="font-serif relative overflow-hidden pb-4">
              
              {/* ================= WATERMARK LOGO BERULANG ================= */}
              <div 
                className="absolute inset-0 z-0 pointer-events-none opacity-[0.05]" 
                style={{ 
                  backgroundImage: 'url("/logo.png")', 
                  backgroundRepeat: 'repeat', 
                  backgroundSize: '150px' 
                }}
              ></div>
              {/* ========================================================= */}

              <div className="flex justify-center border-b-2 border-black pb-4 mb-6 relative z-10">
                <div className="w-56 h-20 flex items-center justify-center overflow-hidden shrink-0 relative">
                  <img src="/logo.png" alt="Logo PT Djitoe Mesindo" className="w-full h-full object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                </div>
              </div>

              <h2 className="text-center font-bold text-lg mb-1 uppercase underline underline-offset-4 relative z-10">
                {printDocument.type === 'ijin_keluar' ? 'FORM IJIN KELUAR' : printDocument.type === 'setengah_hari' ? 'FORM IJIN MASUK SETENGAH HARI' : 'FORM KETERANGAN HADIR KARYAWAN'}
              </h2>
              <h3 className="text-center font-bold text-sm mb-10 uppercase relative z-10">
                ( DEPARTMENT {printDocument.department} )
              </h3>
              
              <table className="w-full text-base mb-16 relative z-10">
                <tbody>
                  <tr><td className="w-40 py-2">Nama</td><td>: <strong>{printDocument.pemohon}</strong></td></tr>
                  <tr><td className="py-2">ID / NIK</td><td>: {printDocument.nik}</td></tr>
                  <tr><td className="py-2">Department</td><td>: {printDocument.department}</td></tr>
                  <tr><td className="py-2">Tanggal</td><td>: <strong>{printDocument.tanggalIjin}</strong></td></tr>
                  {printDocument.type === 'ket_hadir' ? (
                    <tr><td className="py-2">Jam Kerja</td><td>: {printDocument.jamMulai}</td></tr>
                  ) : (
                    <tr><td className="py-2">Jam Ijin</td><td>: {printDocument.jamMulai} s/d {printDocument.jamSelesai}</td></tr>
                  )}
                  <tr><td className="py-2 align-top">Alasan</td><td className="align-top leading-relaxed">: {printDocument.tujuan}</td></tr>
                  {printDocument.type !== 'ket_hadir' && (
                    <tr><td className="py-2">No. Motor / Mobil</td><td>: {printDocument.kendaraan || '-'}</td></tr>
                  )}
                </tbody>
              </table>

              <div className="flex justify-between items-end mt-20 text-center relative z-10">
                <div className="w-1/4">
                  <p className="mb-20 font-bold">{printDocument.type === 'ket_hadir' ? 'Pekerja' : 'Pemohon'}</p>
                  <p className="font-bold underline">{printDocument.pemohon}</p>
                </div>
                
                <div className="w-1/4">
                  <p className="mb-20 font-bold">Mengetahui</p>
                  <div className="relative">
                    {/* TTD Dinamis: Siapa yang ACC, itu yang muncul TTD nya */}
                    {printDocument.approvedBy.stefanus && <img src="/TTD om stev 2.png" className="absolute -top-24 left-1/2 -translate-x-1/2 w-[220px] max-w-none contrast-200 brightness-75" alt="TTD Stefanus" />}
                    {printDocument.approvedBy.roy && <img src="/TTD Roy.png" className="absolute -top-17 left-1/2 -translate-x-1/2 w-[110px] max-w-none contrast-200 brightness-80" alt="TTD Roy" />}
                  </div>
                  <p className="font-bold underline">( {printDocument.approvedBy.stefanus ? 'Stefanus' : printDocument.approvedBy.roy ? 'Roy' : '......................'} )</p>
                </div>
                
                <div className="w-1/4">
                  <p className="mb-20 font-bold">Menyetujui</p>
                  <p className="font-bold underline">( HRD )</p>
                </div>

                {printDocument.type !== 'ket_hadir' && (
                  <div className="w-1/4">
                    <p className="mb-20 font-bold">Security</p>
                    <p className="font-bold underline">( ...................... )</p>
                  </div>
                )}
              </div>

              {/* --- FOOTER (DI ATAS GARIS GUNTING) --- */}
              <div className="mt-20 relative z-10 w-full flex flex-col items-center">
                
                {/* Teks Sah (Dinaikkan dengan mb-8 biar gak kesundul gunting) */}
                <p className="text-[10px] text-gray-400 mb-8 font-sans uppercase tracking-widest text-center">
                  Dokumen ini dicetak secara sah oleh sistem PT. Djitoe Mesindo pada {new Date().toLocaleDateString('id-ID')}
                </p>
                
                {/* Garis Gunting */}
                <div className="w-full border-t-2 border-dashed border-gray-300 relative flex justify-center">
                </div>
                
              </div>
            </div>
          )}

        </div>
      </div>
    );
  }

  // =========================================================================
  // HALAMAN DASHBOARD UTAMA ADMIN
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center pb-10">
      <div className="w-full bg-slate-800 shadow-md p-4 sticky top-0 z-10 flex items-center justify-between">
        <Link href="/" className="text-slate-300 font-medium flex items-center gap-1 hover:text-white transition">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          Menu Utama
        </Link>
        <span className="font-bold text-white text-lg tracking-widest uppercase">Admin Command Center</span>
        <button onClick={handleLogout} className="text-red-400 text-sm font-bold bg-slate-700 px-4 py-2 rounded-lg hover:bg-slate-600">Logout Akses</button>
      </div>

      <div className="w-full max-w-6xl p-6 mt-4">
        
        {/* --- MENU TAB ADMIN --- */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide border-b border-slate-300">
          <button onClick={() => setActiveTab('gatepass')} className={`px-5 py-3 rounded-t-xl font-bold transition border-b-4 ${activeTab === 'gatepass' ? 'bg-amber-100 text-amber-800 border-amber-500' : 'bg-white text-gray-400 border-transparent hover:bg-gray-50'}`}>📦 Gate Pass</button>
          <button onClick={() => setActiveTab('ijin_keluar')} className={`px-5 py-3 rounded-t-xl font-bold transition border-b-4 ${activeTab === 'ijin_keluar' ? 'bg-emerald-100 text-emerald-800 border-emerald-500' : 'bg-white text-gray-400 border-transparent hover:bg-gray-50'}`}>🚪 Ijin Keluar</button>
          <button onClick={() => setActiveTab('setengah_hari')} className={`px-5 py-3 rounded-t-xl font-bold transition border-b-4 ${activeTab === 'setengah_hari' ? 'bg-indigo-100 text-indigo-800 border-indigo-500' : 'bg-white text-gray-400 border-transparent hover:bg-gray-50'}`}>🌗 Setengah Hari</button>
          <button onClick={() => setActiveTab('ket_hadir')} className={`px-5 py-3 rounded-t-xl font-bold transition border-b-4 ${activeTab === 'ket_hadir' ? 'bg-rose-100 text-rose-800 border-rose-500' : 'bg-white text-gray-400 border-transparent hover:bg-gray-50'}`}>📝 Ket. Hadir</button>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between" ref={dropdownRef}>
          
          <div className="relative w-full md:w-1/3">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <input 
              type="text" 
              placeholder="Cari Nama / NIK Pemohon..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium text-black"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* --- CUSTOM DROPDOWN (MAX 5 ITEM SCROLL) --- */}
          <div className="flex gap-3 w-full md:w-auto relative">
            
            {/* Filter Bulan */}
            <div className="relative w-1/2 md:w-44">
              <button 
                onClick={() => {setIsBulanOpen(!isBulanOpen); setIsTahunOpen(false);}} 
                className="w-full border border-slate-300 py-2 px-4 rounded-xl font-medium text-slate-700 bg-slate-50 flex justify-between items-center outline-none focus:ring-2 focus:ring-blue-500"
              >
                {filterBulan} <span className="text-[10px]">▼</span>
              </button>
              {isBulanOpen && (
                <ul className="absolute left-0 right-0 mt-2 bg-white border border-slate-300 rounded-xl shadow-xl z-50 max-h-52 overflow-y-auto">
                  {bulanOptions.map((opt, idx) => (
                    <li 
                      key={idx} 
                      onClick={() => {setFilterBulan(opt.label); setIsBulanOpen(false);}}
                      className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-slate-700 font-medium border-b border-slate-100 last:border-0"
                    >
                      {opt.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Filter Tahun */}
            <div className="relative w-1/2 md:w-44">
              <button 
                onClick={() => {setIsTahunOpen(!isTahunOpen); setIsBulanOpen(false);}} 
                className="w-full border border-slate-300 py-2 px-4 rounded-xl font-medium text-slate-700 bg-slate-50 flex justify-between items-center outline-none focus:ring-2 focus:ring-blue-500"
              >
                {filterTahun} <span className="text-[10px]">▼</span>
              </button>
              {isTahunOpen && (
                <ul className="absolute left-0 right-0 mt-2 bg-white border border-slate-300 rounded-xl shadow-xl z-50 max-h-52 overflow-y-auto">
                  <li onClick={() => {setFilterTahun("Semua Tahun"); setIsTahunOpen(false);}} className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-slate-700 font-medium border-b border-slate-100">Semua Tahun</li>
                  {tahunList.map((thn, idx) => (
                    <li 
                      key={idx} 
                      onClick={() => {setFilterTahun(thn); setIsTahunOpen(false);}}
                      className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-slate-700 font-medium border-b border-slate-100 last:border-0"
                    >
                      {thn}
                    </li>
                  ))}
                </ul>
              )}
            </div>

          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredData.length === 0 ? (
             <div className="col-span-full text-center p-12 bg-white rounded-2xl border border-dashed border-slate-300">
               <span className="text-4xl">📂</span>
               <p className="text-slate-500 font-medium mt-4">Tidak ada data yang cocok dengan pencarian / bulan ini.</p>
             </div>
          ) : (
            filteredData.map((item) => {
              
              // LOGIKA KESIAPAN CETAK: 
              // Gatepass = Butuh TTD Stefanus DAN Roy
              // HRD = Butuh TTD Stefanus ATAU Roy
              const fullyApproved = item.type === 'gatepass' 
                ? (item.approvedBy.stefanus && item.approvedBy.roy) 
                : (item.approvedBy.stefanus || item.approvedBy.roy);

              return (
                <div key={item.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition">
                  <div>
                    <div className="flex justify-between items-start border-b border-slate-100 pb-4 mb-4">
                      <div>
                        <span className="text-slate-800 text-sm font-extrabold bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">{item.id}</span>
                        <p className="text-xs text-slate-500 font-medium mt-2">{item.tanggal}</p>
                      </div>
                      
                      {item.status === 'rejected' ? (
                        <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full">❌ Ditolak</span>
                      ) : fullyApproved ? (
                        <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">✅ Siap Cetak</span>
                      ) : (
                        <span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full animate-pulse">⏳ Tunggu ACC</span>
                      )}
                    </div>
                    
                    <h3 className="font-bold text-slate-800 text-lg">{item.pemohon} <span className="text-sm font-normal text-slate-400">({item.nik})</span></h3>
                    {item.type === 'gatepass' ? (
                      <p className="text-slate-600 text-sm mt-2"><strong>Total:</strong> {item.barang?.length} Barang</p>
                    ) : (
                      <p className="text-slate-600 text-sm mt-2"><strong>Dept:</strong> {item.department}</p>
                    )}
                    <p className="text-slate-500 text-sm mt-1 line-clamp-2"><strong>Tujuan:</strong> {item.tujuan}</p>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-slate-100 flex gap-2">
                    <button 
                      onClick={() => setSelectedItem(item)}
                      className="flex-1 bg-slate-50 text-slate-700 font-bold py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 active:scale-95 transition text-sm"
                    >
                      Cek Detail
                    </button>
                    
                    {fullyApproved ? (
                      <button 
                        onClick={() => setPrintDocument(item)}
                        className="flex-1 bg-orange-500 text-white font-bold py-2.5 rounded-xl shadow-md hover:bg-orange-600 active:scale-95 transition text-sm flex items-center justify-center gap-2"
                      >
                        🖨️ Print PDF
                      </button>
                    ) : (
                      <button 
                        disabled
                        className="flex-1 bg-slate-100 text-slate-400 font-bold py-2.5 rounded-xl border border-slate-100 text-sm cursor-not-allowed"
                      >
                        Belum Lengkap
                      </button>
                    )}

                    <button 
                      onClick={() => hapusData(item.id)}
                      className="px-4 bg-red-50 text-red-600 font-bold rounded-xl border border-red-100 hover:bg-red-100 active:scale-95 transition"
                      title="Hapus Data"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ================= MODAL DETAIL POPUP ================= */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setSelectedItem(null)}>
          <div className="bg-white w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="bg-slate-800 p-4 flex justify-between items-center shrink-0">
               <h2 className="font-bold text-white text-lg">Detail Dokumen: {selectedItem.id}</h2>
              <button onClick={() => setSelectedItem(null)} className="text-slate-300 hover:text-white transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-500 font-bold uppercase">Pemohon</p>
                  <p className="font-bold text-slate-800 text-lg">{selectedItem.pemohon}</p>
                  <p className="text-sm text-slate-500">NIK: {selectedItem.nik}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1">Status TTD Digital</p>
                  <p className="text-sm text-slate-900 font-bold">Pak Stefanus: {selectedItem.approvedBy.stefanus ? '🆗 ACC' : '⏳ Belum'}</p>
                  <p className="text-sm text-slate-900 font-bold">Pak Roy: {selectedItem.approvedBy.roy ? '🆗 ACC' : '⏳ Belum'}</p>
                </div>
              </div>

              {selectedItem.type === 'gatepass' ? (
                <div className="mb-6">
                  <p className="text-xs text-slate-500 font-bold uppercase mb-2">Daftar Barang & Foto Asli</p>
                  <div className="space-y-3">
                    {selectedItem.barang.map((b: any, i: number) => (
                      <div key={i} className="bg-white border border-slate-200 rounded-xl p-3 flex gap-4 items-center shadow-sm">
                        <img src={b.foto} alt={b.namaBarang} className="w-24 h-24 object-cover rounded-lg border border-slate-200" />
                        <div>
                          <p className="font-bold text-slate-700">{b.namaBarang}</p>
                          <p className="text-sm text-slate-500">Jumlah: <span className="font-bold text-black">{b.jumlah}</span></p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mb-6 bg-blue-50 border border-blue-100 p-4 rounded-xl">
                  <p className="text-xs text-blue-500 font-bold uppercase mb-2">Detail Ijin HRD</p>
                  <p className="text-sm text-blue-900 font-bold">Tanggal Kejadian: {selectedItem.tanggalIjin}</p>
                  <p className="text-sm text-blue-900 font-bold">Jam: {selectedItem.jamMulai} {selectedItem.jamSelesai ? `- ${selectedItem.jamSelesai}` : ''}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-slate-500 font-bold uppercase mb-2">Tujuan / Alasan</p>
                <p className="bg-amber-50 border border-amber-100 text-amber-900 p-4 rounded-xl font-medium text-sm">
                  "{selectedItem.tujuan}"
                </p>
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between">
               <button onClick={() => { hapusData(selectedItem.id); setSelectedItem(null); }} className="text-red-600 font-bold py-2.5 px-4 rounded-xl hover:bg-red-100 border border-transparent transition">🗑️ Hapus</button>
               <button onClick={() => setSelectedItem(null)} className="bg-slate-800 text-white font-bold py-2.5 px-6 rounded-xl hover:bg-slate-900 transition">Tutup Detail</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}