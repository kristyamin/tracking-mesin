"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase"; // 👈 Ini penting banget buat narik data!

export default function ManajerPage() {
  const router = useRouter();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("gatepass");

  // ================= 1. SATPAM RUANGAN (OTENTIKASI BENAR) =================
  useEffect(() => {
    // Cek tiket abadi dari Gembok Gate Pass
    const savedRole = localStorage.getItem("role_gatepass");
    const namaUser = sessionStorage.getItem("nama_user"); // Nangkap nama stefanus/roy

    // Kalau tiket BUKAN manajer ATAU gak ada nama usernya, tendang ke depan!
    if (savedRole !== 'manajer' || !namaUser) {
      alert("⚠️ Akses ditolak! Silakan masuk melalui gembok utama.");
      router.push("/");
      return;
    }

    setCurrentUser(namaUser.toLowerCase());
    setIsCheckingAuth(false);
  }, [router]);

  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.removeItem("role_gatepass"); // Kunci yang benar dibakar!
    router.push("/");
  };

  // ================= 2. MESIN PENARIK DATA DARI SUPABASE =================
  const [pengajuan, setPengajuan] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [alasanTolak, setAlasanTolak] = useState("");
  const [zoomedFoto, setZoomedFoto] = useState<{foto: string, nama: string} | null>(null);

  useEffect(() => {
    // Kalau udah diizinkan masuk, langsung tarik data dari server
    if (!isCheckingAuth && currentUser) {
      fetchDataPengajuan();
    }
  }, [isCheckingAuth, currentUser]);

  const fetchDataPengajuan = async () => {
    try {
      const { data, error } = await supabase
        .from('form_pengajuan')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        // Sesuaikan nama kolom database dengan desain UI kamu
        const formattedData = data.map(d => ({
          id: d.nomor_surat,
          type: d.tipe_form,
          tanggal: d.tanggal,
          jam: d.jam,
          bulan: d.bulan,
          tahun: d.tahun,
          pemohon: d.pemohon,
          nik: d.nik,
          department: d.department,
          tujuan: d.tujuan,
          barang: d.barang || [],
          status: d.status || 'pending',
          approvedBy: { stefanus: d.acc_stefanus || false, roy: d.acc_roy || false },
          tanggalIjin: d.tanggal_ijin,
          jamMulai: d.jam_mulai,
          jamSelesai: d.jam_selesai,
          kendaraan: d.kendaraan
        }));
        setPengajuan(formattedData);
      }
    } catch (err) {
      console.error("Gagal menarik data:", err);
    }
  };

  // ================= 3. LOGIKA FILTER & HILANG OTOMATIS =================
  const filteredPengajuan = pengajuan.filter(item => {
    if (item.status === 'rejected') return false; // Sembunyikan yang udah ditolak
    if (item.type !== activeTab) return false;
    
    if (item.type === 'gatepass') {
      return currentUser ? !item.approvedBy[currentUser as keyof typeof item.approvedBy] : true;
    } else {
      return !(item.approvedBy.stefanus || item.approvedBy.roy);
    }
  });

  const getBadgeCount = (type: string) => {
    return pengajuan.filter(item => {
      if (item.status === 'rejected') return false;
      if (item.type !== type) return false;
      if (type === 'gatepass') {
        return currentUser ? !item.approvedBy[currentUser as keyof typeof item.approvedBy] : false;
      } else {
        return !(item.approvedBy.stefanus || item.approvedBy.roy);
      }
    }).length;
  };

  const countGatepass = getBadgeCount('gatepass');
  const countIjinKeluar = getBadgeCount('ijin_keluar');
  const countSetHari = getBadgeCount('setengah_hari');
  const countKetHadir = getBadgeCount('ket_hadir');

  // ================= 4. FUNGSI APPROVE & REJECT (LANGSUNG TEMBAK SERVER) =================
  const handleApproveOtomatis = async (id: string) => {
    if (!currentUser) return;
    
    const isConfirmed = confirm("Yakin ingin memberikan Tanda Tangan Digital pada dokumen ini?");
    if (!isConfirmed) return;

    try {
      // Tentukan siapa yang ngeklik, kolom Supabase mana yang diisi
      const kolomAcc = currentUser === 'stefanus' ? 'acc_stefanus' : 'acc_roy';
      
      const { error } = await supabase.from('form_pengajuan').update({
         [kolomAcc]: true
      }).eq('nomor_surat', id);

      if (error) throw error;

      const namaManajer = currentUser === 'stefanus' ? 'Stefanus' : 'Roy';
      const jamAcc = new Date().toLocaleTimeString('id-ID', { hour12: false });
      alert(`✅ Tanda Tangan Digital Pak ${namaManajer} berhasil dibubuhkan pada ${jamAcc} WIB!`);
      
      fetchDataPengajuan(); // Refresh data dari server biar kartunya hilang
      setSelectedItem(null);
    } catch (err) {
      alert("❌ Gagal menyimpan persetujuan ke server.");
    }
  };

  const submitReject = async (id: string) => {
    if (alasanTolak.trim() === "") {
      alert("⚠️ Alasan penolakan wajib diisi!");
      return;
    }

    try {
      const { error } = await supabase.from('form_pengajuan').update({
         status: 'rejected'
      }).eq('nomor_surat', id);

      if (error) throw error;

      const namaManajer = currentUser === 'stefanus' ? 'Stefanus' : 'Roy';
      alert(`❌ Pengajuan ${id} DITOLAK oleh Pak ${namaManajer}!\nAlasan: ${alasanTolak}`);
      
      fetchDataPengajuan(); // Refresh data
      setSelectedItem(null);
      setIsRejecting(false);
      setAlasanTolak("");
    } catch (err) {
      alert("❌ Gagal menolak pengajuan. Periksa jaringan.");
    }
  };

  const tutupModal = () => {
    setSelectedItem(null);
    setIsRejecting(false);
    setAlasanTolak("");
  };

  if (isCheckingAuth) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-400">Memeriksa Akses...</div>;

  // ================= 5. TAMPILAN HALAMAN (JSX) =================
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center pb-10 relative">
      <div className="w-full max-w-md bg-white shadow-sm p-4 sticky top-0 z-10 border-b border-slate-200">
        <div className="flex items-center justify-between mb-1">
          <Link href="/" className="text-blue-600 font-medium flex items-center gap-1 active:scale-95 transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
            Menu
          </Link>
          <span className="font-bold text-slate-800 text-lg tracking-tight">Aplikasi Persetujuan</span>
          <button onClick={handleLogout} className="text-red-500 text-sm font-bold bg-red-50 px-3 py-1 rounded-lg border border-red-100">Logout</button>
        </div>
        <div className="text-center w-full mt-2">
          <span className="text-[10px] font-bold text-white bg-slate-800 px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
            Manajer: {currentUser?.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="w-full max-w-md p-4">
        <div className="flex gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide">
          <button 
            onClick={() => setActiveTab('gatepass')} 
            className={`px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition border-2 flex items-center gap-2 ${activeTab === 'gatepass' ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'}`}
          >
            Barang Keluar {countGatepass > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{countGatepass}</span>}
          </button>
          <button 
            onClick={() => setActiveTab('ijin_keluar')} 
            className={`px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition border-2 flex items-center gap-2 ${activeTab === 'ijin_keluar' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'}`}
          >
            Ijin Keluar {countIjinKeluar > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{countIjinKeluar}</span>}
          </button>
          <button 
            onClick={() => setActiveTab('setengah_hari')} 
            className={`px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition border-2 flex items-center gap-2 ${activeTab === 'setengah_hari' ? 'bg-indigo-100 text-indigo-800 border-indigo-300' : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'}`}
          >
            Setengah Hari {countSetHari > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{countSetHari}</span>}
          </button>
          <button 
            onClick={() => setActiveTab('ket_hadir')} 
            className={`px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition border-2 flex items-center gap-2 ${activeTab === 'ket_hadir' ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'}`}
          >
            Ket. Hadir {countKetHadir > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{countKetHadir}</span>}
          </button>
        </div>

        {filteredPengajuan.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-300 text-center flex flex-col items-center mt-4">
            <span className="text-4xl mb-3">☕</span>
            <p className="text-slate-500 font-medium">Antrian di tab ini kosong.<br/>Waktunya ngopi!</p>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            {filteredPengajuan.map((item) => (
              <div 
                key={item.id} 
                onClick={() => setSelectedItem(item)}
                className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-md hover:border-blue-300 active:scale-95 transition-all relative overflow-hidden"
              >
                <div className={`absolute left-0 top-0 bottom-0 w-2 ${
                  item.type === 'gatepass' ? 'bg-amber-500' : 
                  item.type === 'ijin_keluar' ? 'bg-emerald-500' : 
                  item.type === 'setengah_hari' ? 'bg-indigo-500' : 'bg-rose-500'
                }`}></div>

                <div className="pl-3">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{item.id}</span>
                      <p className="text-[11px] text-slate-400 font-medium">{item.tanggal} • {item.jam}</p>
                    </div>
                    
                    {item.approvedBy.stefanus || item.approvedBy.roy ? (
                      <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Diproses</span>
                    ) : (
                      <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider animate-pulse">Wait ACC</span>
                    )}
                  </div>
                  
                  <h3 className="font-bold text-slate-800 text-lg">{item.pemohon}</h3>
                  <p className="text-slate-500 text-sm line-clamp-1 mt-1">
                    {item.type === 'gatepass' ? `Bawa ${item.barang?.length} Barang` : `Alasan: ${item.tujuan}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedItem && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm p-2 md:p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-t-3xl md:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="bg-slate-100 p-4 border-b border-slate-200 flex justify-between items-center shrink-0">
              <span className={`text-[10px] font-black px-3 py-1.5 rounded-md uppercase tracking-widest ${
                  selectedItem.type === 'gatepass' ? 'bg-amber-200 text-amber-900' : 
                  selectedItem.type === 'ijin_keluar' ? 'bg-emerald-200 text-emerald-900' : 
                  selectedItem.type === 'setengah_hari' ? 'bg-indigo-200 text-indigo-900' : 'bg-rose-200 text-rose-900'
                }`}>
                  {selectedItem.type === 'gatepass' ? 'Gate Pass Barang' : selectedItem.type === 'ijin_keluar' ? 'Ijin Keluar' : selectedItem.type === 'setengah_hari' ? 'Ijin Setengah Hari' : 'Keterangan Hadir'}
              </span>
              <button onClick={tutupModal} className="bg-slate-300 text-slate-700 p-1.5 rounded-full hover:bg-slate-400 active:scale-95 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="p-4 md:p-6 overflow-y-auto flex-1 bg-white">
              {selectedItem.type !== 'gatepass' ? (
                <div className="border border-gray-300 p-4 md:p-5 rounded-sm shadow-sm bg-white font-serif text-sm text-black relative overflow-hidden"> 
                  <div className="absolute inset-0 z-0 pointer-events-none select-none opacity-[0.05] grayscale" style={{ backgroundImage: 'url("/logo.png")', backgroundRepeat: 'repeat', backgroundSize: '150px', backgroundPosition: 'center' }}></div>

                  <div className="flex justify-center border-b-2 border-black pb-3 mb-4 relative z-10">
                    <div className="w-56 h-20 flex items-center justify-center overflow-hidden shrink-0">
                      <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                    </div>
                  </div>

                  <h2 className="text-center font-bold text-[13px] mb-1 uppercase underline underline-offset-4 relative z-10">
                    {selectedItem.type === 'ijin_keluar' ? 'FORM IJIN KELUAR' : selectedItem.type === 'setengah_hari' ? 'FORM IJIN MASUK SETENGAH HARI' : 'FORM KETERANGAN HADIR KARYAWAN'}
                  </h2>
                  <h3 className="text-center font-bold text-[11px] mb-5 uppercase relative z-10">
                    ( DEPARTMENT {selectedItem.department} )
                  </h3>

                  <table className="w-full text-xs md:text-sm mb-6 relative z-10">
                    <tbody>
                      <tr><td className="w-20 md:w-24 py-1">Nama</td><td>: <strong>{selectedItem.pemohon}</strong></td></tr>
                      <tr><td className="py-1">ID / NIK</td><td>: {selectedItem.nik}</td></tr>
                      <tr><td className="py-1">Department</td><td>: {selectedItem.department}</td></tr>
                      <tr><td className="py-1">Tanggal</td><td>: <strong>{selectedItem.tanggalIjin}</strong></td></tr>
                      {selectedItem.type === 'ket_hadir' ? (
                        <tr><td className="py-1">Jam Kerja</td><td>: {selectedItem.jamMulai}</td></tr>
                      ) : (
                        <tr><td className="py-1">Jam Ijin</td><td>: {selectedItem.jamMulai} s/d {selectedItem.jamSelesai}</td></tr>
                      )}
                      <tr><td className="py-1 align-top">Alasan</td><td className="align-top leading-tight">: {selectedItem.tujuan}</td></tr>
                      {selectedItem.type !== 'ket_hadir' && (
                        <tr><td className="py-1">Kendaraan</td><td>: {selectedItem.kendaraan || '-'}</td></tr>
                      )}
                    </tbody>
                  </table>

                  <div className="mt-6 pt-4 border-t border-dashed border-gray-300 text-center relative z-10">
                    <p className="text-[10px] text-red-600 font-bold bg-red-50 p-2 rounded">
                      ⚠️ Tanda Tangan HRD / Security tidak dilakukan di aplikasi. Karyawan wajib membawa cetakan fisik ke ruangan HRD.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Pemohon (Gate Pass)</p>
                    <p className="font-bold text-slate-800 text-lg">{selectedItem.pemohon} <span className="text-slate-400 text-sm font-normal">({selectedItem.nik})</span></p>
                    <p className="text-xs text-slate-500 mt-1">{selectedItem.tanggal} • {selectedItem.jam}</p>
                  </div>

                  <div className="mb-6">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-3">Daftar Barang & Foto ({selectedItem.barang.length})</p>
                    <div className="space-y-4">
                      {selectedItem.barang.map((b: any, i: number) => (
                        <div key={i} className="bg-white border-2 border-slate-100 rounded-xl p-3 flex gap-3 items-center">
                          <div 
                            onClick={() => setZoomedFoto({ foto: b.foto, nama: b.namaBarang })}
                            className="w-20 h-20 shrink-0 rounded-lg overflow-hidden border border-slate-300 bg-slate-200 cursor-pointer relative group"
                          >
                            <img src={b.foto} alt={b.namaBarang} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-slate-800 text-sm leading-tight">{b.namaBarang}</p>
                            <p className="text-xs text-slate-500 font-medium mt-1">Jumlah: <span className="font-bold text-red-600 text-sm">{b.jumlah}</span></p>
                            <p className="text-[10px] text-blue-600 font-bold mt-1 cursor-pointer" onClick={() => setZoomedFoto({ foto: b.foto, nama: b.namaBarang })}>🔍 Perbesar</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-2">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Tujuan / Alasan</p>
                    <p className="bg-amber-50 border border-amber-100 text-amber-900 p-4 rounded-xl font-medium text-sm leading-relaxed">
                      "{selectedItem.tujuan}"
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="p-4 bg-white border-t border-slate-100 shrink-0 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] pb-6 md:pb-4">
              {isRejecting ? (
                <div className="animate-fade-in">
                  <label className="block text-sm font-bold text-red-600 mb-2">Alasan Penolakan:</label>
                  <textarea rows={2} className="w-full border border-red-200 bg-red-50 p-3 rounded-xl focus:ring-2 focus:ring-red-500 mb-3 text-sm text-red-900" value={alasanTolak} onChange={(e) => setAlasanTolak(e.target.value)}></textarea>
                  <div className="flex gap-2">
                    <button onClick={() => setIsRejecting(false)} className="w-1/3 bg-slate-200 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-300 active:scale-95 transition text-sm">Batal</button>
                    <button onClick={() => submitReject(selectedItem.id)} className="w-2/3 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 active:scale-95 transition text-sm">Kirim Penolakan</button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setIsRejecting(true)} className="w-1/4 bg-red-50 text-red-600 font-bold py-2 rounded-xl border border-red-200 hover:bg-red-100 active:scale-95 transition flex flex-col items-center justify-center text-sm gap-1">
                    <span className="text-xl leading-none">❌</span>
                    <span className="text-[10px] uppercase tracking-wider">Tolak</span>
                  </button>
                  <div className="w-3/4 flex flex-col gap-2">
                    {currentUser === 'stefanus' || currentUser === 'roy' ? (
                      <button 
                        disabled={selectedItem.approvedBy[currentUser as keyof typeof selectedItem.approvedBy]}
                        onClick={() => handleApproveOtomatis(selectedItem.id)}
                        className={`w-full font-bold py-3 rounded-xl transition text-sm flex justify-center items-center gap-2 ${selectedItem.approvedBy[currentUser as keyof typeof selectedItem.approvedBy] ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-blue-600 text-white shadow-md hover:bg-blue-700 active:scale-95'}`}
                      >
                        {selectedItem.approvedBy[currentUser as keyof typeof selectedItem.approvedBy] ? '✅ Anda Sudah TTD' : `✍️ Bubuhkan TTD (${currentUser.charAt(0).toUpperCase() + currentUser.slice(1)})`}
                      </button>
                    ) : null}

                    {selectedItem.type === 'gatepass' && (
                      <div className="w-full bg-slate-50 text-slate-500 font-medium py-2 rounded-xl text-[10px] flex justify-center items-center border border-slate-200 uppercase tracking-widest">
                        {currentUser === 'stefanus' ? (
                           selectedItem.approvedBy.roy ? '✅ Pak Roy Sudah ACC' : '⏳ Menunggu ACC Pak Roy'
                        ) : (
                           selectedItem.approvedBy.stefanus ? '✅ Pak Stefanus Sudah ACC' : '⏳ Menunggu ACC Pak Stefanus'
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {zoomedFoto && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in" onClick={() => setZoomedFoto(null)}>
          <div className="w-full max-w-lg flex justify-between items-start mb-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-white text-lg leading-tight w-4/5">{zoomedFoto.nama}</h3>
            <button onClick={() => setZoomedFoto(null)} className="text-white bg-slate-800 p-2 rounded-full hover:bg-slate-700 active:scale-95 transition">✕</button>
          </div>
          <img src={zoomedFoto.foto} alt={zoomedFoto.nama} className="w-full max-w-lg max-h-[70vh] object-contain rounded-xl border border-slate-700 shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}