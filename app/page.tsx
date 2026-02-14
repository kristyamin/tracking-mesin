"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  
  // --- STATE PENCARIAN & DATA (DARI PAGE LOGIN ASLI) ---
  const [idSearch, setIdSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<any>(null); 
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // --- STATE MODAL ---
  const [selectedDetail, setSelectedDetail] = useState<string | null>(null); 
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false); 
  const [showAndroidGuide, setShowAndroidGuide] = useState(false);

  // --- STATE LOGIN ---
  const [creds, setCreds] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  // 1. LOGIKA SEARCH MESIN
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idSearch) return;
    
    setLoading(true); 
    setErrorMsg(""); 
    setSearchResults([]);
    setSelectedMachine(null);

    try {
        // 👇 PERUBAHAN UTAMA: Kita panggil Server API, BUKAN Supabase langsung
        const response = await fetch('/api/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: idSearch.trim().toUpperCase() })
        });
        
        // Menerima hasil yang sudah matang dari server
        const result = await response.json();

        // Cek jika error atau data kosong
        if (!response.ok || !result.data || result.data.length === 0) {
            setErrorMsg("❌ ID Not Found. Please check your Order ID.");
        } else {
            // Data berhasil ditemukan
            setSearchResults(result.data);
            if (result.data.length === 1) {
                const item = result.data[0];
                setSelectedMachine({
                    ...item,
                    progress_number: parseInt(item.public_status) || 0
                });
            }
        }
    } catch (err) {
        setErrorMsg("❌ Terjadi kesalahan jaringan.");
    }
    
    setLoading(false);
  };

  const handleSelectMachine = (item: any) => {
      setSelectedMachine({
          ...item,
          progress_number: parseInt(item.public_status) || 0
      });
  };

  const handleBack = () => {
      if (searchResults.length === 1) {
          setSearchResults([]);
          setSelectedMachine(null);
          setIdSearch("");
      } else {
          setSelectedMachine(null);
      }
  };

  // 2. LOGIKA LOGIN STAFF (LOGIKA ASLI RESET BULANAN DIPERTAHANKAN) ✅
  const handleOpenLogin = () => {
      setCreds({ username: "", password: "" });
      setShowPassword(false);
      setShowLoginModal(true);
  };

  // 2. LOGIKA LOGIN STAFF (VERSI AMAN VIA SERVER)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Panggil Server API Login
      const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
              username: creds.username.trim().toUpperCase(), 
              password: creds.password.trim() 
          })
      });

      const result = await response.json();

      if (!response.ok || !result.data) {
        alert("❌ Login Gagal! Username atau Password salah.");
        setCreds({ username: "", password: "" });
      } else {
        const data = result.data;
        sessionStorage.setItem("user_role", data.role);

        // Redirect sesuai Role
        if (data.role === "admin") {
          router.push("/admin");
        } else if (data.role === "boss") {
          router.push("/dashboard-bos");
        } else if (data.role === "super_admin") {
          router.push("/super-admin");
        } else if (data.role === "mess_admin" || data.role === "mess_viewer") {
          router.push("/inventory");
        } else {
          alert("Akun tidak memiliki akses.");
        }
      }
    } catch (err) {
      alert("Terjadi kesalahan jaringan.");
      setCreds({ username: "", password: "" }); 
    }
    setLoading(false);
  };

  // --- RETURN TAMPILAN (MENGGUNAKAN DESIGN "YANG AKU SUKA") ---
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 relative flex flex-col justify-center overflow-hidden">
      
      {/* --- INJECT CSS ANIMASI KHUSUS (SHIMMER & FLOAT) --- */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .animate-text-shimmer {
          background: linear-gradient(to right, #2563EB 20%, #60A5FA 40%, #60A5FA 60%, #2563EB 80%);
          background-size: 200% auto;
          color: transparent;
          background-clip: text;
          -webkit-background-clip: text;
          animation: shimmer 3s linear infinite;
        }
      `}</style>

      {/* BACKGROUND DECORATION */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

      <div className="max-w-md mx-auto w-full z-10 p-4">
        
        {/* === TAMPILAN 1: FORM PENCARIAN (HOME) === */}
        {searchResults.length === 0 && (
          <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden p-8 border border-white/50 relative animate-in fade-in slide-in-from-bottom-8 duration-700">            
            
            {/* Tombol Login */}
            <button onClick={handleOpenLogin} className="absolute top-6 right-6 p-2 rounded-full text-slate-300 hover:text-blue-600 hover:bg-blue-50 transition-all text-xl" title="Staff Login">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
            </button>
            
            {/* LOGO (Floating Animation & Clickable to Website) */}
            <div className="flex justify-center mb-6 mt-4">
               <a 
                  href="https://djitoemesindo.com/profile" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="animate-float block cursor-pointer hover:scale-105 hover:opacity-90 transition-all duration-300"
                  title="Kunjungi Website PT Djitoe Mesindo"
               >
                   <img src="/logo.png" alt="Logo Djitoe" className="h-24 md:h-28 w-auto object-contain drop-shadow-lg" />
               </a>
            </div>
            
            {/* JUDUL (Shimmer Animation & Clickable) */}
            <div className="text-center mb-10">
                <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tight mb-2 whitespace-nowrap">             
                    TRACKING{" "}
                    <a 
                        href="https://djitoemesindo.com/product" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="cursor-pointer hover:opacity-80 transition-opacity inline-block"
                        title="Kunjungi Website PT Djitoe Mesindo"
                    >
                        <span className="animate-text-shimmer font-black">MACHINE</span>
                    </a>
                </h1>
                <div className="h-1 w-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mx-auto mb-3"></div>
                <p className="text-slate-400 text-[10px] font-bold tracking-[0.3em] uppercase">MONITORING PROGRESS SYSTEM</p>
            </div>
            
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <span className="text-slate-400 text-lg group-focus-within:text-blue-500 transition-colors duration-300">🔍</span>
                </div>
                <input 
                    type="text" 
                    placeholder="ENTER ORDER ID" 
                    className="w-full pl-14 pr-4 py-5 bg-slate-50/50 border border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-300 font-black text-slate-800 uppercase placeholder-slate-300 tracking-wider shadow-inner text-sm md:text-base" 
                    value={idSearch} 
                    onChange={(e) => setIdSearch(e.target.value)} 
                />
              </div>
              <button disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 active:scale-[0.98] text-sm tracking-widest uppercase flex justify-center items-center gap-2">
                  {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        SEARCHING...
                      </>
                  ) : "TRACK STATUS"}
              </button>
            </form>
            
            {/* Error Message (jika ada) */}
            {errorMsg && (
                <div className="mt-6 p-4 bg-red-50 rounded-2xl text-red-500 text-xs font-bold text-center border border-red-100 animate-pulse">
                    {errorMsg}
                </div>
            )}
            
            {/* FOOTER INSTALL & INFO */}
            <div className="mt-10 pt-6 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-300 uppercase mb-4 tracking-widest text-center">Install Application</p>
                <div className="grid grid-cols-2 gap-4">
                 
                    {/* TOMBOL ANDROID (Warna Hijau Bawaan) */}
                    <button onClick={() => setShowAndroidGuide(true)} className="flex flex-col items-center justify-center bg-white border border-slate-100 py-4 px-2 rounded-2xl hover:border-green-400 hover:bg-green-50/50 hover:shadow-md active:scale-95 transition-all cursor-pointer text-center group duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" fill="currentColor" className="w-6 h-6 mb-2 text-green-500 group-hover:scale-110 transition duration-300">
                          <path d="M420.55,301.93a24,24,0,1,1,24-24,24,24,0,0,1-24,24m-265.1,0a24,24,0,1,1,24-24,24,24,0,0,1-24,24m273.7-144.48,47.94-83a10,10,0,1,0-17.32-10h0L413.66,144.4a286.43,286.43,0,0,0-251.32,0L116.14,64.44a10,10,0,1,0-17.32,10h0l47.94,83C64.53,202.22,8.24,285.55,0,384H576c-8.24-98.45-64.53-181.78-146.85-226.55"/>
                        </svg>
                        <p className="text-[10px] font-black uppercase text-green-600 transition">Android</p>
                    </button>

                    {/* TOMBOL APPLE (Warna Hitam Bawaan) */}
                    <button onClick={() => setShowIOSGuide(true)} className="flex flex-col items-center justify-center bg-white border border-slate-100 py-4 px-2 rounded-2xl hover:border-slate-800 hover:bg-slate-50 hover:shadow-md active:scale-95 transition-all cursor-pointer text-center group duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" fill="currentColor" className="w-6 h-6 mb-2 text-slate-800 group-hover:scale-110 transition duration-300">
                          <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-46.6-35.5-4.6-86.7 18.1-110.6 18.1-23.9 0-67.3-20.9-101.2-19.4-49.2 1.8-88.7 26.9-113.3 69.5-40.5 69.4-10.5 172.2 29.2 229.6 19.2 27.9 40.9 58.4 70.5 58.4 28.1 0 38.6-18.1 72.3-18.1 34.2 0 43.7 18.1 73.5 18.1 29.2 0 47.7-25.5 65.8-51.1 20.4-28.6 28.8-41.2 32.1-42.4-17.9-7.7-31.2-23.6-33.6-49.3zM248.3 52.3c22.4-26.9 37.6-64.1 33.4-101.2-32.1 2.5-71.3 21.1-94.2 48-20.6 24.1-38.6 61.9-33.4 98.9 35.8 2.8 72.5-19.1 94.2-45.7z"/>
                        </svg>
                        <p className="text-[10px] font-black uppercase text-slate-800 transition">iPhone / iOS</p>
                    </button>

                </div>
            </div>
            
            {/* FOOTER VERSI LINK AKTIF */}
            <div className="mt-8 text-center opacity-60 hover:opacity-100 transition-opacity">
                <p className="text-slate-400 text-[9px] font-bold tracking-[0.2em] uppercase">
                    Djitoe Mesindo System V2.1 © {new Date().getFullYear()}
                </p>
                <a 
                    href="https://djitoemesindo.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-slate-400 text-[9px] font-bold tracking-[0.2em] uppercase hover:text-blue-500 cursor-pointer transition-colors block mt-1"
                >
                    WWW.DJITOEMESINDO.COM
                </a>
            </div>
          </div>
        )}

        {/* === TAMPILAN 2: PILIH MESIN === */}
        {(searchResults.length > 1 && !selectedMachine) && (
            <div className="animate-in fade-in slide-in-from-bottom duration-500">
                <button onClick={() => { setSearchResults([]); setIdSearch(""); }} className="mb-6 bg-white/80 backdrop-blur px-5 py-3 rounded-full shadow-sm text-slate-500 text-xs font-bold hover:text-blue-600 hover:shadow-md flex items-center gap-2 transition-all w-fit mx-auto border border-white">← CHECK ANOTHER ID</button>
                <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl overflow-hidden p-6 border border-white relative">
                    <div className="text-center mb-6">
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">CHOOSE MACHINE</h2>
                        <p className="text-slate-400 text-xs font-bold mt-1">{searchResults.length} machines found for this ID</p>
                    </div>
                    <div className="space-y-3">
                        {searchResults.map((item, idx) => (
                            <button key={item.id} onClick={() => handleSelectMachine(item)} className="w-full text-left bg-slate-50 hover:bg-blue-50 p-4 rounded-2xl border border-slate-100 hover:border-blue-200 transition-all group flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-full flex items-center justify-center font-black text-xs shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">{idx + 1}</div>
                                    <div>
                                        <h3 className="font-black text-slate-800 text-sm uppercase">{item.machine_name || item.machine_type}</h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Status: <span className="text-blue-600">{item.public_status}</span></p>
                                    </div>
                                </div>
                                <span className="text-slate-300 group-hover:text-blue-600 text-xl font-black transition-colors">→</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* === TAMPILAN 3: DETAIL MESIN === */}
        {selectedMachine && (
          <div className="animate-in fade-in slide-in-from-bottom duration-500">
            <button onClick={handleBack} className="mb-6 bg-white/80 backdrop-blur px-5 py-3 rounded-full shadow-sm text-slate-500 text-xs font-bold hover:text-blue-600 hover:shadow-md flex items-center gap-2 transition-all w-fit mx-auto border border-white">
                ← {searchResults.length > 1 ? "PILIH MESIN LAIN" : "CHECK ANOTHER ID"}
            </button>
            <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl overflow-hidden p-6 border border-white relative">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-3xl mb-8 border border-blue-100">
                <div className="flex justify-between items-center border-b border-blue-200/50 pb-3 mb-3">
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider">Machine Model</span>
                    <span className="font-black text-blue-900 text-lg uppercase text-right">{selectedMachine.machine_name || selectedMachine.machine_type}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider">Mechanic</span>
                    <span className="font-bold text-slate-700">{selectedMachine.mechanic_name || "-"}</span>
                </div>
              </div>
              
              {selectedMachine.spesifikasi && (
                  <div className="mb-8 bg-slate-50 p-5 rounded-3xl border border-slate-100 shadow-inner text-slate-800">
                      <p className="text-[10px] font-black text-blue-600 uppercase mb-2 flex items-center gap-2">⚙️ SPECIFICATIONS</p>
                      <p className="font-bold leading-relaxed text-sm whitespace-pre-wrap text-slate-600">{selectedMachine.spesifikasi}</p>
                  </div>
              )}
              
              <div className="space-y-0 relative pl-2">
                <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-slate-100 -z-10"></div>
                
                {/* Step 1 */}
                <div className="flex gap-5 pb-8">
                    <div className="flex flex-col items-center">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white text-sm shadow-lg shadow-green-200 z-10 scale-110">✓</div>
                    </div>
                    <div className="pt-2">
                        <p className="font-bold text-slate-400 text-sm">Order Confirmed</p>
                    </div>
                </div>
                
                {/* Step 2 */}
                <div onClick={() => (selectedMachine.progress_number >= 1 && selectedMachine.progress_number < 75) && setSelectedDetail("perakitan")} className={`flex gap-5 pb-8 ${(selectedMachine.progress_number >= 1 && selectedMachine.progress_number < 75) ? 'cursor-pointer group' : ''}`}>
                    <div className="flex flex-col items-center relative">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-all z-10 shadow-lg ${selectedMachine.progress_number >= 75 ? 'bg-green-500 text-white shadow-green-200' : (selectedMachine.progress_number >= 1 ? 'bg-blue-600 text-white ring-4 ring-blue-50 shadow-blue-300 scale-110' : 'bg-white border-2 border-slate-100 text-slate-300')}`}>
                            {selectedMachine.progress_number >= 75 ? '✓' : '2'}
                        </div>
                    </div>
                    <div className="pt-2">
                        <p className={`font-bold text-sm ${selectedMachine.progress_number >= 1 && selectedMachine.progress_number < 75 ? 'text-blue-700' : (selectedMachine.progress_number >= 75 ? 'text-slate-400' : 'text-slate-300')}`}>Component Assembly</p>
                        <p className="text-[10px] font-bold uppercase mt-1">
                            {selectedMachine.progress_number >= 75 ? <span className="text-green-500">✓ Finished</span> : (selectedMachine.progress_number >= 1 ? <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded shadow-sm">● Detail</span> : <span className="text-slate-300">🔒 Locked</span>)}
                        </p>
                    </div>
                </div>
                
                {/* Step 3 */}
                <div onClick={() => (selectedMachine.progress_number >= 75 && selectedMachine.progress_number < 100) && setSelectedDetail("qc")} className={`flex gap-5 pb-8 ${(selectedMachine.progress_number >= 75 && selectedMachine.progress_number < 100) ? 'cursor-pointer group' : ''}`}>
                    <div className="flex flex-col items-center relative">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-all z-10 shadow-lg ${selectedMachine.progress_number >= 100 ? 'bg-green-500 text-white shadow-green-200' : (selectedMachine.progress_number >= 75 ? 'bg-blue-600 text-white ring-4 ring-blue-50 shadow-blue-300 scale-110' : 'bg-white border-2 border-slate-100 text-slate-300')}`}>
                            {selectedMachine.progress_number >= 100 ? '✓' : '3'}
                        </div>
                    </div>
                    <div className="pt-2">
                        <p className={`font-bold text-sm ${selectedMachine.progress_number >= 75 && selectedMachine.progress_number < 100 ? 'text-blue-700' : (selectedMachine.progress_number >= 100 ? 'text-slate-400' : 'text-slate-300')}`}>Quality Control</p>
                        <p className="text-[10px] font-bold uppercase mt-1">
                            {selectedMachine.progress_number >= 100 ? <span className="text-green-500">✓ Finished</span> : (selectedMachine.progress_number >= 75 ? <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded shadow-sm">● Detail</span> : <span className="text-slate-300">🔒 Locked</span>)}
                        </p>
                    </div>
                </div>
                
                {/* Step 4 */}
                <div className={`flex gap-5 ${selectedMachine.progress_number < 100 ? 'opacity-40' : ''}`}>
                    <div className="flex flex-col items-center relative">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-all z-10 shadow-lg ${selectedMachine.delivery_status === 'Selesai' ? 'bg-green-600 text-white shadow-green-200' : (selectedMachine.progress_number >= 100 ? 'bg-blue-600 text-white shadow-blue-300 scale-110' : 'bg-white border-2 border-slate-100 text-slate-300')}`}>
                            {selectedMachine.delivery_status === 'Selesai' ? '✓' : (selectedMachine.delivery_status === 'Dalam Perjalanan' ? '🚚' : '4')}
                        </div>
                    </div>
                    <div className="pt-2">
                        <p className={`font-bold text-sm ${selectedMachine.progress_number >= 100 ? 'text-slate-900' : 'text-slate-300'}`}>
                            {selectedMachine.delivery_status === 'Selesai' && "Completed"}
                            {selectedMachine.delivery_status === 'Dalam Perjalanan' && "In Transit"}
                            {selectedMachine.delivery_status === 'Siap Dikirim' && "Ready to Ship"}
                            {(!selectedMachine.delivery_status && selectedMachine.progress_number >= 100) && "Ready to Ship"}
                            {selectedMachine.progress_number < 100 && "Pending"}
                        </p>
                        {selectedMachine.delivery_status === 'Dalam Perjalanan' && <p className="text-[10px] font-bold text-blue-500 mt-1 uppercase animate-pulse">● Out for Delivery</p>}
                        {selectedMachine.delivery_status === 'Selesai' && <p className="text-[10px] font-bold text-green-500 mt-1 uppercase">✓ Received</p>}
                    </div>
                </div>
              </div>
            </div>
            <div className="text-center mt-8 space-y-2"><p className="text-slate-400 text-[10px] font-bold tracking-[0.3em] uppercase">PT Djitoe Mesindo</p></div>
          </div>
        )}

        {/* MODAL GUIDES & DETAIL */}
        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in">
            <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-xs shadow-2xl relative border-2 border-white text-center">
              <button onClick={() => setShowIOSGuide(false)} className="absolute top-4 right-4 w-8 h-8 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full font-bold">✕</button>
              <div className="text-5xl mb-4"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" fill="currentColor" className="w-16 h-16 mx-auto text-slate-800"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-46.6-35.5-4.6-86.7 18.1-110.6 18.1-23.9 0-67.3-20.9-101.2-19.4-49.2 1.8-88.7 26.9-113.3 69.5-40.5 69.4-10.5 172.2 29.2 229.6 19.2 27.9 40.9 58.4 70.5 58.4 28.1 0 38.6-18.1 72.3-18.1 34.2 0 43.7 18.1 73.5 18.1 29.2 0 47.7-25.5 65.8-51.1 20.4-28.6 28.8-41.2 32.1-42.4-17.9-7.7-31.2-23.6-33.6-49.3zM248.3 52.3c22.4-26.9 37.6-64.1 33.4-101.2-32.1 2.5-71.3 21.1-94.2 48-20.6 24.1-38.6 61.9-33.4 98.9 35.8 2.8 72.5-19.1 94.2-45.7z"/></svg></div>
              <h3 className="text-xl font-black text-slate-800 mb-2 uppercase">Install Iphone</h3>
              <p className="text-xs text-gray-500 mb-6 leading-relaxed">Apple devices do not natively support APK files. To achieve an app-like experience, please follow these steps:</p>
              <div className="space-y-4 text-left bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex gap-3 items-center"><span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span><p className="text-xs font-bold text-slate-700">Open <span className="font-black text-blue-600">The Link</span> in Safari.</p></div>
                  <div className="flex gap-3 items-center"><span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span><p className="text-xs font-bold text-slate-700">Tap the Share icon. <span className="font-black text-blue-600">Add to Home Screen</span> </p></div>
                  <div className="flex gap-3 items-center"><span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span><p className="text-xs font-bold text-slate-700">Name your app and select<span className="font-black text-blue-600"> Add</span> to finish.</p></div>
              </div>
              <button onClick={() => setShowIOSGuide(false)} className="w-full bg-slate-900 text-white py-3 rounded-xl font-black mt-6 hover:bg-black transition-all text-xs uppercase shadow-lg">Got It</button>
            </div>
          </div>
        )}

        {showAndroidGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in">
            <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-xs shadow-2xl relative border-2 border-white text-center">
              <button onClick={() => setShowAndroidGuide(false)} className="absolute top-4 right-4 w-8 h-8 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full font-bold">✕</button>
              <div className="text-5xl mb-4 text-green-600 flex justify-center"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" fill="currentColor" className="w-16 h-16"><path d="M420.55,301.93a24,24,0,1,1,24-24,24,24,0,0,1-24,24m-265.1,0a24,24,0,1,1,24-24,24,24,0,0,1-24,24m273.7-144.48,47.94-83a10,10,0,1,0-17.32-10h0L413.66,144.4a286.43,286.43,0,0,0-251.32,0L116.14,64.44a10,10,0,1,0-17.32,10h0l47.94,83C64.53,202.22,8.24,285.55,0,384H576c-8.24-98.45-64.53-181.78-146.85-226.55"/></svg></div>
              <h3 className="text-xl font-black text-slate-800 mb-2 uppercase">Install Android</h3>
              <p className="text-xs text-gray-500 mb-6 leading-relaxed">To install the app on Android, please download the APK file and install it manually on your device.</p>
              <div className="space-y-4 text-left bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6">
                  <div className="flex gap-3 items-center"><span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span><p className="text-xs font-bold text-slate-700">Press the button <span className="font-black text-green-600">Download</span>.</p></div>
                  <div className="flex gap-3 items-center"><span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span><p className="text-xs font-bold text-slate-700">Install the file and <span className="font-black text-green-600">Allow</span> unknown sources.</p></div>
              </div>
              <a href="/djitoe-app.apk" download className="block w-full bg-green-600 text-white py-3 rounded-xl font-black hover:bg-green-700 transition-all text-xs uppercase shadow-lg shadow-green-200">DOWNLOAD APK HERE</a>
            </div>
          </div>
        )}

        {selectedDetail && selectedMachine && (
          <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-5 z-50 backdrop-blur-md animate-in fade-in">
            <div className="bg-white rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl relative border border-white/50">
              <button onClick={() => setSelectedDetail(null)} className="absolute top-4 right-4 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center z-10 backdrop-blur-sm transition-all">✕</button>
              <div className="h-64 bg-gray-200"><img src={selectedMachine.public_foto_url || "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500"} className="w-full h-full object-cover" alt="Progress Picture" /></div>
              <div className="p-8">
                  <h3 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight">SEARCH RESULTS</h3>
                  <div className="h-1 w-12 bg-blue-500 rounded-full mb-4"></div>
                  <p className="text-gray-500 text-sm mb-4 leading-relaxed font-medium">Status Progress: <strong className="text-slate-900">{selectedMachine.public_status}</strong>.</p>
                  {selectedMachine.deskripsi_progress && (
                      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6 text-sm">
                          <p className="text-xs font-bold text-blue-600 uppercase mb-1">NOTE :</p>
                          <p className="text-slate-700">{selectedMachine.deskripsi_progress}</p>
                      </div>
                  )}
                  <button onClick={() => setSelectedDetail(null)} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black shadow-xl hover:bg-black transition-all">CLOSE</button>
              </div>
            </div>
          </div>
        )}

        {showLoginModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in zoom-in-95">
            <div className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] p-10 w-full max-w-xs shadow-2xl relative border border-white/50">
              <button onClick={() => setShowLoginModal(false)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
              <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-4xl shadow-inner border border-blue-100">🔐</div>
              </div>
              <h2 className="text-2xl font-black text-center text-slate-800 uppercase mb-2 tracking-tight">Access Staff</h2>
              <p className="text-xs text-center text-slate-400 font-bold mb-8 uppercase tracking-widest">Admin & Director Only</p>
              
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                    <input type="text" placeholder="USERNAME" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-900 font-black outline-none focus:border-blue-500 text-center uppercase tracking-wider text-sm transition-all placeholder-slate-300 focus:shadow-lg focus:shadow-blue-100" value={creds.username} onChange={(e) => setCreds({ ...creds, username: e.target.value.toUpperCase() })} />
                </div>
                <div className="relative">
                    <input type={showPassword ? "text" : "password"} placeholder="••••" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-900 font-black outline-none focus:border-blue-500 text-center tracking-widest text-base transition-all placeholder-slate-300 pr-12 focus:shadow-lg focus:shadow-blue-100" value={creds.password} onChange={(e) => setCreds({ ...creds, password: e.target.value })} />
                    <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-xl text-slate-300 hover:text-blue-500 transition-all" onMouseDown={() => setShowPassword(true)} onMouseUp={() => setShowPassword(false)} onMouseLeave={() => setShowPassword(false)} onTouchStart={() => setShowPassword(true)} onTouchEnd={() => setShowPassword(false)}>
                        {showPassword ? "👀" : "👁️"}
                    </button>
                </div>
                <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black mt-2 hover:bg-blue-700 shadow-xl shadow-blue-300 hover:shadow-blue-400 transition-all text-sm active:scale-95">LOGIN SYSTEM</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}