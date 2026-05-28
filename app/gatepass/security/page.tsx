"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SecurityPage() {
  const router = useRouter();

  // ==============================================
  // FITUR 1: SISTEM LOGIN SECURITY (Nembak Supabase)
  // ==============================================
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [securityName, setSecurityName] = useState<string | null>(null);
  const [inputPin, setInputPin] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false); // Buat efek loading pas ngecek PIN

  // ==============================================
  // FITUR 2: DETEKSI SCAN DARI KAMERA HP
  // ==============================================
  const [scannedSuratId, setScannedSuratId] = useState<string | null>(null);
  const [dokumenScan, setDokumenScan] = useState<any>(null);
  const [loadingScan, setLoadingScan] = useState(false);

  // ==============================================
  // FITUR 3: LOG HARIAN / BUKU TAMU
  // ==============================================
  const [riwayat, setRiwayat] = useState<any[]>([]);
  const [waktuSekarang, setWaktuSekarang] = useState("");

  useEffect(() => {
    const savedName = localStorage.getItem("nama_security");
    if (savedName) setSecurityName(savedName);

    const params = new URLSearchParams(window.location.search);
    const suratDariQR = params.get("surat");
    if (suratDariQR) {
      setScannedSuratId(suratDariQR);
      if (savedName) fetchDokumenScan(suratDariQR); 
    }

    setIsCheckingAuth(false);
  }, []);

  useEffect(() => {
    const updateWaktu = () => {
      const now = new Date();
      const jam = now.toLocaleTimeString('id-ID', { hour12: false }) + " WIB";
      const tanggal = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
      setWaktuSekarang(`${tanggal} • ${jam}`);
    };
    updateWaktu();
    const timer = setInterval(updateWaktu, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (securityName && !scannedSuratId) {
      fetchLogHarian();
    }
  }, [securityName, scannedSuratId]);

  // ==============================================
  // FUNGSI TARIK DATA DARI SUPABASE
  // ==============================================
  const fetchDokumenScan = async (idSurat: string) => {
    setLoadingScan(true);
    try {
      const { data, error } = await supabase
        .from('form_pengajuan')
        .select('*')
        .eq('nomor_surat', idSurat)
        .single();

      if (error || !data) throw new Error("Dokumen tidak ditemukan!");
      setDokumenScan(data);
    } catch (err) {
      console.error(err);
      setDokumenScan(null); 
    }
    setLoadingScan(false);
  };

  const fetchLogHarian = async () => {
    const today = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    try {
      const { data, error } = await supabase
        .from('form_pengajuan')
        .select('*')
        .in('status', ['keluar', 'ditahan']) 
        .eq('tanggal', today)   
        .order('waktu_keluar', { ascending: false });

      if (data) setRiwayat(data);
    } catch (err) {
      console.error("Gagal menarik log harian");
    }
  };

  // ==============================================
  // FUNGSI AKSI SECURITY (CEK PIN KE DATABASE)
  // ==============================================
  const handleLogin = async () => {
    if (inputPin.trim().length < 4) {
      alert("⚠️ Masukkan 4 digit PIN Anda!");
      return;
    }

    setIsLoggingIn(true);

    try {
      // 1. Tembak ke Supabase, cari adakah PIN yang cocok di tabel akun_security
      const { data, error } = await supabase
        .from('akun_security')
        .select('nama')
        .eq('pin', inputPin)
        .single(); // Ambil 1 data aja

      // 2. Kalau error atau data kosong (berarti PIN salah)
      if (error || !data) {
        alert("❌ PIN Tidak Valid! Anda tidak terdaftar sebagai petugas keamanan.");
        setInputPin(""); // Kosongkan layar biar bisa ngetik lagi
        setIsLoggingIn(false);
        return;
      }

      // 3. Kalau PIN Benar, ambil nama dari database
      const namaSatpam = data.nama;
      localStorage.setItem("nama_security", namaSatpam);
      setSecurityName(namaSatpam);

      if (scannedSuratId) fetchDokumenScan(scannedSuratId);

    } catch (err) {
      alert("❌ Terjadi kesalahan jaringan. Cek koneksi internet Anda.");
    }
    setIsLoggingIn(false);
  };

  const handleLogout = () => {
    if(confirm("Ganti shift penjagaan? (Logout)")) {
      localStorage.removeItem("nama_security");
      setSecurityName(null);
      setInputPin("");
    }
  };

  const handleIzinkanKeluar = async (id: string) => {
    if(confirm("Validasi fisik barang sesuai dengan foto? Izinkan keluar?")) {
      const jamKeluar = new Date().toLocaleTimeString('id-ID', { hour12: false }) + " WIB";
      try {
        const { error } = await supabase.from('form_pengajuan').update({
          status: 'keluar',
          waktu_keluar: jamKeluar,
          petugas_security: securityName
        }).eq('nomor_surat', id);

        if (error) throw error;

        alert(`✅ Gate Pass ${id} BERHASIL DITUTUP!\n\nBarang diizinkan keluar pada ${jamKeluar} oleh Petugas: ${securityName}.`);
        router.replace('/gatepass/security');
        setScannedSuratId(null);
        setDokumenScan(null);
      } catch (err) {
        alert("❌ Gagal mengupdate data ke server. Pastikan sinyal internet stabil.");
      }
    }
  };

  const handleTahan = async (id: string) => {
    if(confirm("❌ Yakin menahan barang ini? Pemohon harus kembali ke Admin!")) {
      const jamTahan = new Date().toLocaleTimeString('id-ID', { hour12: false }) + " WIB";
      try {
        const { error } = await supabase.from('form_pengajuan').update({
          status: 'ditahan',
          waktu_keluar: jamTahan,
          petugas_security: securityName
        }).eq('nomor_surat', id);

        if (error) throw error;

        alert(`🛑 BARANG DITAHAN!\n\nStatus telah diupdate. Pemohon harus lapor Admin.`);
        router.replace('/gatepass/security');
        setScannedSuratId(null);
        setDokumenScan(null);
      } catch (err) {
        alert("❌ Gagal mengupdate data ke server. Pastikan sinyal internet stabil.");
      }
    }
  };

  const [zoomedFoto, setZoomedFoto] = useState<{foto: string, nama: string} | null>(null);

  // ==============================================
  // TAMPILAN 1: HALAMAN LOGIN SECURITY
  // ==============================================
  if (isCheckingAuth) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Memuat Sistem...</div>;

  if (!securityName) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-700">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-yellow-500 p-4 rounded-full shadow-[0_0_20px_rgba(234,179,8,0.4)] animate-pulse">
                <svg className="w-10 h-10 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
              </div>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-widest uppercase">Pos Security</h1>
            <p className="text-slate-400 text-sm mt-1">Sistem Keamanan Berlapis</p>
          </div>
          <div className="mb-8">
            <label className="block text-slate-300 font-bold mb-2 text-sm uppercase tracking-wider text-center">Masukkan PIN Akses</label>
            <input 
              type="password" 
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              placeholder="••••" 
              className="w-full bg-slate-900 border border-slate-600 p-4 rounded-xl focus:ring-2 focus:ring-yellow-500 text-white font-black text-center text-4xl tracking-[0.5em] placeholder-slate-700 transition-all shadow-inner" 
              value={inputPin} 
              onChange={(e) => setInputPin(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              disabled={isLoggingIn}
            />
          </div>
          <button disabled={isLoggingIn} onClick={handleLogin} className="w-full bg-yellow-500 text-slate-900 font-black py-4 rounded-xl shadow-[0_0_15px_rgba(234,179,8,0.3)] hover:bg-yellow-400 active:scale-95 transition text-lg uppercase tracking-wider disabled:opacity-50">
            {isLoggingIn ? "Memeriksa PIN..." : "Verifikasi PIN 🛡️"}
          </button>
          
          {scannedSuratId && <p className="text-yellow-500 text-xs text-center mt-4 bg-yellow-900/30 p-2 rounded-lg font-bold">⚠️ Anda harus otorisasi PIN sebelum memindai QR Code.</p>}

          <div className="mt-6 text-center">
            <Link href="/" className="text-slate-500 text-sm underline hover:text-slate-300">Kembali ke Portal Utama</Link>
          </div>
        </div>
      </div>
    );
  }

  // ==============================================
  // TAMPILAN 2: MODE SCAN BARCODE (Pengecekan Fisik)
  // ==============================================
  if (scannedSuratId) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center pb-24 relative p-4">
        <div className="w-full max-w-lg mt-4 mb-6 flex justify-between items-center text-white">
          <button onClick={() => { setScannedSuratId(null); setDokumenScan(null); router.replace('/gatepass/security'); }} className="bg-slate-800 px-4 py-2 rounded-lg font-bold text-sm">⬅ Batal</button>
          <span className="font-bold text-yellow-500 tracking-widest uppercase text-sm">Mode Validasi</span>
        </div>

        {loadingScan ? (
           <div className="w-full max-w-lg bg-slate-800 p-10 rounded-3xl text-center shadow-2xl animate-pulse text-white">⏳ Mengambil data dari server...</div>
        ) : dokumenScan ? (
          <div className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl">
            {/* Header Status */}
            <div className={`p-6 text-center border-b-4 ${dokumenScan.status === 'keluar' ? 'bg-slate-100 border-slate-300' : dokumenScan.status === 'ditahan' ? 'bg-red-50 border-red-500' : 'bg-yellow-50 border-yellow-400'}`}>
              <h2 className="text-2xl font-black text-slate-800 tracking-tighter">{dokumenScan.nomor_surat}</h2>
              {dokumenScan.status === 'keluar' ? (
                <p className="mt-2 inline-block bg-slate-800 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">Telah Keluar Gerbang</p>
              ) : dokumenScan.status === 'ditahan' ? (
                <p className="mt-2 inline-block bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest animate-pulse">BARANG DITAHAN</p>
              ) : (
                <p className="mt-2 inline-block bg-yellow-400 text-slate-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest animate-pulse">Menunggu Validasi Fisik</p>
              )}
            </div>

            <div className="p-6">
              {/* Info Pembawa */}
              <div className="mb-8 text-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Pembawa Barang</p>
                <p className="font-black text-3xl text-blue-900">{dokumenScan.pemohon}</p>
                <p className="font-bold text-slate-500">NIK: {dokumenScan.nik}</p>
              </div>

              {/* Rincian Barang Asli */}
              <div className="mb-6">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-3">Cocokkan Barang Berikut:</p>
                <div className="space-y-4">
                  {dokumenScan.barang && dokumenScan.barang.map((b: any, i: number) => (
                    <div key={i} className="bg-white border-2 border-slate-200 rounded-xl p-3 flex gap-4 items-center shadow-sm">
                      <div 
                        onClick={() => setZoomedFoto({ foto: b.foto, nama: b.namaBarang })}
                        className="w-24 h-24 shrink-0 rounded-lg overflow-hidden border border-slate-300 bg-slate-100 cursor-pointer relative group"
                      >
                        <img src={b.foto} alt={b.namaBarang} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                          <span className="text-white text-xs font-bold">🔍 ZOOM</span>
                        </div>
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-800 text-lg leading-tight">{b.namaBarang}</p>
                        <p className="text-slate-600 font-medium mt-1">Jumlah: <span className="text-xl font-black text-red-600">{b.jumlah}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tombol Aksi Bawah Layar */}
            {dokumenScan.status !== 'keluar' && dokumenScan.status !== 'ditahan' ? (
              <div className="p-4 bg-slate-100 border-t border-slate-200 flex gap-3">
                <button onClick={() => handleTahan(dokumenScan.nomor_surat)} className="w-1/3 bg-white text-red-600 font-black py-4 rounded-xl border-2 border-red-200 hover:bg-red-50 active:scale-95 transition uppercase text-sm">
                  ❌ Tahan
                </button>
                <button onClick={() => handleIzinkanKeluar(dokumenScan.nomor_surat)} className="w-2/3 bg-emerald-500 text-white font-black py-4 rounded-xl shadow-[0_5px_15px_rgba(16,185,129,0.4)] hover:bg-emerald-600 active:scale-95 transition uppercase text-lg">
                  ✅ Lolos
                </button>
              </div>
            ) : (
              <div className={`p-6 text-center rounded-b-3xl ${dokumenScan.status === 'keluar' ? 'bg-slate-800' : 'bg-red-900'}`}>
                <p className={`${dokumenScan.status === 'keluar' ? 'text-emerald-400' : 'text-red-400'} font-bold mb-1`}>
                  {dokumenScan.status === 'keluar' ? '✅ Validasi Selesai (Lolos)' : '🛑 Validasi Selesai (Ditahan)'}
                </p>
                <p className="text-slate-300 text-sm">Diperiksa oleh {dokumenScan.petugas_security} pada {dokumenScan.waktu_keluar}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full max-w-lg bg-white p-10 rounded-3xl text-center shadow-2xl">
            <span className="text-6xl block mb-4">🤷‍♂️</span>
            <h2 className="text-2xl font-black text-slate-800">Surat Tidak Ditemukan!</h2>
            <p className="text-slate-500 mt-2">QR Code tidak valid atau surat belum ada di sistem.</p>
          </div>
        )}

        {/* Modal Zoom Foto */}
        {zoomedFoto && (
          <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-slate-900/95 p-4 animate-fade-in" onClick={() => setZoomedFoto(null)}>
            <img src={zoomedFoto.foto} alt={zoomedFoto.nama} className="w-full max-w-lg max-h-[80vh] object-contain rounded-xl border border-slate-700 shadow-2xl" onClick={(e) => e.stopPropagation()} />
            <p className="text-white font-bold text-xl mt-6 text-center px-4">{zoomedFoto.nama}</p>
            <p className="text-slate-400 text-sm mt-2 animate-pulse">Ketuk sembarang untuk menutup</p>
          </div>
        )}
      </div>
    );
  }

  // ==============================================
  // TAMPILAN 3: DASHBOARD UTAMA BUKU TAMU SECURITY
  // ==============================================
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center pb-10">
      <div className="w-full bg-slate-800 shadow-md p-4 sticky top-0 z-10 flex items-center justify-between border-b border-slate-700">
        <Link href="/" className="text-yellow-500 font-medium flex items-center gap-1 active:scale-95 transition">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          Portal
        </Link>
        <div className="text-center">
          <span className="font-black text-white text-lg tracking-widest uppercase block">Gate Pos 1</span>
          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest flex items-center justify-center gap-1">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span> Petugas: {securityName}
          </span>
        </div>
        <button onClick={handleLogout} className="text-red-400 text-sm font-bold bg-slate-700 px-3 py-1 rounded-lg hover:bg-slate-600">Ganti Shift</button>
      </div>

      <div className="w-full max-w-md p-6">
        <div className="mb-8 text-center">
          <p className="text-slate-400 font-medium text-sm">Waktu Server:</p>
          <p className="text-2xl font-black text-white tracking-widest">{waktuSekarang || "Memuat..."}</p>
        </div>

        {/* INFO SCANNER */}
        <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 text-center mb-8 shadow-lg">
          <div className="w-20 h-20 bg-yellow-500 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(234,179,8,0.3)]">
            <svg className="w-10 h-10 text-slate-900" fill="currentColor" viewBox="0 0 24 24"><path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 13h6v6H3v-6zm2 2v2h2v-2H5zm13-2h-2v2h2v-2zm-2 2h-2v2h2v-2zm2 2h-2v2h2v-2zm-2 2h-2v2h2v-2zm-4-6h2v2h-2v-2zm2 2h2v2h-2v-2zm-2 2h2v2h-2v-2z"/></svg>
          </div>
          <h3 className="text-white font-bold text-lg mb-1">Siap Memindai Dokumen</h3>
          <p className="text-slate-400 text-sm mb-4">Arahkan kamera HP (Bawaan HP) Anda ke QR Code yang dicetak Admin.</p>
          <p className="text-xs text-yellow-500 font-medium bg-yellow-900/30 py-2 px-4 rounded-lg inline-block border border-yellow-700/50">
            *Otomatis mendeteksi dokumen dari server
          </p>
        </div>

        {/* LOG BUKU TAMU HARIAN */}
        <div>
          <h3 className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-4 border-b border-slate-700 pb-2">Log Validasi Hari Ini</h3>
          
          <div className="space-y-4">
            {riwayat.length === 0 ? (
              <p className="text-center text-slate-500 font-medium py-4 bg-slate-800/50 rounded-2xl border border-slate-700/50 border-dashed">Belum ada dokumen tervalidasi hari ini.</p>
            ) : (
              riwayat.map(item => (
                <div key={item.nomor_surat} className={`p-4 rounded-2xl border flex justify-between items-center opacity-90 shadow-md ${item.status === 'ditahan' ? 'bg-red-900/20 border-red-800' : 'bg-slate-800 border-slate-700'}`}>
                  <div>
                    {item.status === 'ditahan' ? (
                      <span className="text-red-400 text-[10px] font-black uppercase tracking-widest">🛑 DITAHAN</span>
                    ) : (
                      <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">✅ LOLOS GERBANG</span>
                    )}
                    <h4 className="text-white font-bold text-base mt-1 line-clamp-1">{item.pemohon}</h4>
                    <p className="text-slate-400 text-xs mt-1 font-mono">{item.nomor_surat}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`${item.status === 'ditahan' ? 'text-red-300' : 'text-slate-300'} font-bold text-sm`}>{item.waktu_keluar}</p>
                    <p className="text-slate-500 text-[10px] uppercase font-bold mt-1">Oleh: {item.petugas_security}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}