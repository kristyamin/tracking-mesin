"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [idSearch, setIdSearch] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedDetail, setSelectedDetail] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [creds, setCreds] = useState({ username: "", password: "" });
  // MATA (SHOW PASSWORD)
  const [showPassword, setShowPassword] = useState(false);

  // --- 1. LOGIKA SEARCH ---
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idSearch) return;
    
    setLoading(true); 
    setErrorMsg(""); 
    setSearchResult(null);

    // Query ke tabel 'orders' dan kolom 'order_id'
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("order_id", idSearch.trim())
      .single();

    if (error || !data) {
      setErrorMsg("❌ ID Not Found. Check your ID.");
    } else {
      setSearchResult({
        ...data,
        // Konversi "50%" jadi angka 50 biar bisa dibaca logic timeline
        progress_number: parseInt(data.public_status) || 0 
      });
    }
    setLoading(false);
  };

  // --- 2. LOGIKA LOGIN (UPDATE SUPER ADMIN) ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("username", creds.username.trim().toUpperCase())
        .eq("password", creds.password.trim())
        .single();

      if (error || !data) {
        alert("❌ Login Gagal! Username atau Password salah.");
      } else {
        sessionStorage.setItem("user_role", data.role);
        
        // --- LOGIKA PENGARAHAN RUANGAN ---
        if (data.role === "admin") {
          router.push("/admin");
        } else if (data.role === "boss") {
          router.push("/dashboard-bos"); 
        } else if (data.role === "super_admin") {
          router.push("/super-admin"); // <--- TAMBAHAN KHUSUS SUPER ADMIN
        } else {
          alert("Akun tidak memiliki akses.");
        }
      }
    } catch (err) {
      alert("Terjadi kesalahan sistem.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans text-slate-800 relative flex flex-col justify-center">
      <div className="max-w-md mx-auto w-full">
        
        {/* TAMPILAN PENCARIAN (BELUM KETEMU DATA) */}
        {!searchResult ? (
          <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-8 border border-white relative animate-in fade-in zoom-in-95 duration-500">
            {/* Tombol Kunci Pojok Kanan */}
            <button onClick={() => setShowLoginModal(true)} className="absolute top-6 right-6 p-2 rounded-full text-gray-300 hover:text-blue-600 transition-all text-2xl">🔐</button>
            
               {/* LOGO */}
              <div className="flex justify-center mb-6 mt-4">
               <img src="/logo.png" alt="Logo Djitoe" className="h-32 w-auto object-contain" />
            </div>
            
            <div className="text-center mb-10">
                <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter mb-1">TRACKING <span className="text-blue-600">Machine</span></h1>
                <p className="text-gray-400 text-xs font-bold tracking-widest uppercase">Monitoring Progress MACHINE</p>
            </div>
            
            <form onSubmit={handleSearch}>
              <div className="mb-6 relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><span className="text-gray-400 text-lg group-focus-within:text-blue-500 transition-colors">🔍</span></div>
                <input type="text" placeholder="ORDER ID" className="w-full pl-12 pr-4 py-5 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 outline-none transition-all font-black text-slate-900 uppercase placeholder-gray-300 tracking-wide" 
                    value={idSearch} onChange={(e) => setIdSearch(e.target.value)} />
              </div>
              <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black shadow-xl shadow-blue-200 transition-all active:scale-95 text-sm tracking-wider">
                  {loading ? "SEARCHING..." : "TRACK STATUS"}
              </button>
            </form>
            
            {errorMsg && <div className="mt-6 p-4 bg-red-50 rounded-2xl text-red-500 text-xs font-bold text-center border border-red-100 animate-pulse">{errorMsg}</div>}
            <div className="mt-10 border-t border-gray-50 pt-6"><p className="text-center text-gray-300 text-[9px] font-bold tracking-[0.2em] uppercase">Djitoe Mesindo System V1.0</p></div>
            <div className="mt-0 border-t border-gray-50 pt-1"><p className="text-center text-gray-300 text-[9px] font-bold tracking-[0.2em] uppercase">www.djitoemesindo.com</p></div>
          </div>
        ) : (
          
          /* TAMPILAN HASIL (DATA DITEMUKAN) */
          <div className="animate-in fade-in slide-in-from-bottom duration-500">
            <button onClick={() => { setSearchResult(null); setIdSearch(""); }} className="mb-6 bg-white px-4 py-2 rounded-full shadow-sm text-slate-400 text-xs font-bold hover:text-blue-600 hover:shadow-md flex items-center gap-2 transition-all w-fit mx-auto">← CHECK ANOTHER ID</button>
            
            <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-6 border border-white relative">
              
              {/* Info Mesin */}
              <div className="bg-blue-50/50 p-5 rounded-3xl mb-8 border border-blue-50">
                <div className="flex justify-between items-center border-b border-blue-100 pb-3 mb-3">
                    <span className="text-[10px] font-black text-blue-300 uppercase tracking-wider">Machine</span>
                    <span className="font-black text-blue-900 text-lg uppercase">{searchResult.machine_name || searchResult.machine_type}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-blue-300 uppercase tracking-wider">Mechanic</span>
                    <span className="font-bold text-slate-600">{searchResult.mechanic_name || "-"}</span>
                </div>
              </div>

              {/* Deskripsi Update (PESAN UTK CUSTOMER) */}
              {searchResult.deskripsi_progress && (
                <div className="mb-8 bg-blue-600 p-5 rounded-3xl shadow-lg shadow-blue-200 text-white animate-pulse-once">
                  <p className="text-[10px] font-bold text-blue-200 uppercase mb-1">📢 LATEST UPDATE:</p>
                  <p className="font-bold leading-relaxed text-sm">"{searchResult.deskripsi_progress}"</p>
                  <p className="text-[9px] text-blue-300 mt-2 text-right uppercase tracking-wider">
                      {new Date(searchResult.created_at).toLocaleDateString('id-ID')}
                  </p>
                </div>
              )}

              {/* TIMELINE PROGRESS */}
              <div className="space-y-0 relative pl-2">
                <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gray-100 -z-10"></div>
                
                {/* STEP 1: Confirmed */}
                <div className="flex gap-5 pb-8">
                    <div className="flex flex-col items-center"><div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white text-sm shadow-lg shadow-green-200 z-10">✓</div></div>
                    <div className="pt-2"><p className="font-bold text-gray-400 text-sm">Order Confirmed</p></div>
                </div>
                
                {/* STEP 2: Assembly (1% - 74%) */}
                <div onClick={() => (searchResult.progress_number >= 1 && searchResult.progress_number < 75) && setSelectedDetail("perakitan")} 
                     className={`flex gap-5 pb-8 ${(searchResult.progress_number >= 1 && searchResult.progress_number < 75) ? 'cursor-pointer group' : ''}`}>
                  <div className="flex flex-col items-center relative">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-all z-10 shadow-lg 
                      ${searchResult.progress_number >= 75 ? 'bg-green-500 text-white shadow-green-200' : (searchResult.progress_number >= 1 ? 'bg-blue-600 text-white ring-4 ring-blue-50 shadow-blue-300' : 'bg-white border-2 border-gray-100 text-gray-300')}`}>
                          {searchResult.progress_number >= 75 ? '✓' : '2'}
                      </div>
                  </div>
                  <div className="pt-2">
                      <p className={`font-bold text-sm ${searchResult.progress_number >= 1 && searchResult.progress_number < 75 ? 'text-blue-700' : (searchResult.progress_number >= 75 ? 'text-gray-400' : 'text-gray-300')}`}>Component Assembly</p>
                      <p className="text-[10px] font-bold uppercase mt-1">
                          {searchResult.progress_number >= 75 ? <span className="text-green-500">✓ Finished</span> : (searchResult.progress_number >= 1 ? <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded">● Detail</span> : <span className="text-gray-300">🔒 Locked</span>)}
                      </p>
                  </div>
                </div>

                {/* STEP 3: QC (75% - 99%) */}
                <div onClick={() => (searchResult.progress_number >= 75 && searchResult.progress_number < 100) && setSelectedDetail("qc")} 
                     className={`flex gap-5 pb-8 ${(searchResult.progress_number >= 75 && searchResult.progress_number < 100) ? 'cursor-pointer group' : ''}`}>
                  <div className="flex flex-col items-center relative">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-all z-10 shadow-lg 
                      ${searchResult.progress_number >= 100 ? 'bg-green-500 text-white shadow-green-200' : (searchResult.progress_number >= 75 ? 'bg-blue-600 text-white ring-4 ring-blue-50 shadow-blue-300' : 'bg-white border-2 border-gray-100 text-gray-300')}`}>
                          {searchResult.progress_number >= 100 ? '✓' : '3'}
                      </div>
                  </div>
                  <div className="pt-2">
                      <p className={`font-bold text-sm ${searchResult.progress_number >= 75 && searchResult.progress_number < 100 ? 'text-blue-700' : (searchResult.progress_number >= 100 ? 'text-gray-400' : 'text-gray-300')}`}>Quality Control</p>
                      <p className="text-[10px] font-bold uppercase mt-1">
                          {searchResult.progress_number >= 100 ? <span className="text-green-500">✓ Finished</span> : (searchResult.progress_number >= 75 ? <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded">● Detail</span> : <span className="text-gray-300">🔒 Locked</span>)}
                      </p>
                  </div>
                </div>

                {/* --- STEP 4: FINAL STATUS (SUDAH DIPERBAIKI) --- */}
                <div className={`flex gap-5 ${searchResult.progress_number < 100 ? 'opacity-40' : ''}`}>
                  <div className="flex flex-col items-center relative">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-all z-10 shadow-lg 
                        ${searchResult.delivery_status === 'Selesai' 
                            ? 'bg-green-600 text-white shadow-green-200' 
                            : (searchResult.progress_number >= 100 ? 'bg-blue-600 text-white shadow-blue-300' : 'bg-white border-2 border-gray-100 text-gray-300')}`}>
                      
                      {/* LOGIKA IKON */}
                      {searchResult.delivery_status === 'Selesai' ? '✓' : (searchResult.delivery_status === 'Dalam Perjalanan' ? '🚚' : '4')}
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <p className={`font-bold text-sm ${searchResult.progress_number >= 100 ? 'text-slate-900' : 'text-gray-300'}`}>
                        {/* LOGIKA TEKS BAHASA INGGRIS */}
                        {searchResult.delivery_status === 'Selesai' && "Completed"}
                        {searchResult.delivery_status === 'Dalam Perjalanan' && "In Transit"}
                        {searchResult.delivery_status === 'Siap Dikirim' && "Ready to Ship"}
                        {(!searchResult.delivery_status && searchResult.progress_number >= 100) && "Ready to Ship"} 
                        {searchResult.progress_number < 100 && "Ready to Ship"}
                    </p>
                    
                    {/* STATUS TAMBAHAN DI BAWAHNYA */}
                    {searchResult.delivery_status === 'Dalam Perjalanan' && <p className="text-[10px] font-bold text-blue-500 mt-1 uppercase animate-pulse">● Out for Delivery</p>}
                    {searchResult.delivery_status === 'Selesai' && <p className="text-[10px] font-bold text-green-500 mt-1 uppercase">✓ Received</p>}
                  </div>
                </div>

              </div>
            </div>
            <div className="text-center mt-8 space-y-2"><p className="text-gray-300 text-[10px] font-bold tracking-[0.3em] uppercase">PT Djitoe Mesindo</p></div>
          </div>
        )}
      </div>

      {/* MODAL FOTO (Menampilkan public_foto_url) */}
      {selectedDetail && searchResult && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-5 z-50 backdrop-blur-md animate-in fade-in">
          <div className="bg-white rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl relative border border-white/50">
            <button onClick={() => setSelectedDetail(null)} className="absolute top-4 right-4 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center z-10 backdrop-blur-sm transition-all">✕</button>
            <div className="h-64 bg-gray-200">
                {/* Tampilkan FOTO PUBLIC */}
                <img src={searchResult.public_foto_url || "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500"} className="w-full h-full object-cover" alt="Progress Picture" />
            </div>
            <div className="p-8">
              <h3 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight">search results</h3>
              <div className="h-1 w-12 bg-blue-500 rounded-full mb-4"></div>
              <p className="text-gray-500 text-sm mb-4 leading-relaxed font-medium">Status Progress: <strong className="text-slate-900">{searchResult.public_status}</strong>.</p>
              {searchResult.deskripsi_progress && (<div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6 text-sm"><p className="text-xs font-bold text-blue-600 uppercase mb-1">NOTE:</p><p className="text-slate-700">{searchResult.deskripsi_progress}</p></div>)}
              <button onClick={() => setSelectedDetail(null)} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black shadow-xl hover:bg-black transition-all">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LOGIN (Untuk Admin/Boss) */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/20 backdrop-blur-md animate-in fade-in zoom-in-95">
          <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-xs shadow-2xl relative border border-white">
            <button onClick={() => setShowLoginModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500">✕</button>
            <div className="flex justify-center mb-8"><div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-4xl">🔐</div></div>
            <h2 className="text-2xl font-black text-center text-slate-800 uppercase mb-2 tracking-tight">Access Staff</h2>
            <p className="text-xs text-center text-gray-400 font-bold mb-8 uppercase tracking-widest">Admin & Direksi Only</p>
            <form onSubmit={handleLogin} className="space-y-4">
              <div><input type="text" placeholder="USERNAME" className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-slate-900 font-black outline-none focus:border-blue-500 text-center uppercase tracking-wider text-sm transition-all placeholder-gray-300" value={creds.username} onChange={(e) => setCreds({ ...creds, username: e.target.value.toUpperCase() })} /></div>
              {/* KOLOM PASSWORD BARU (DENGAN MATA) */}
              <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••" 
                    className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-slate-900 font-black outline-none focus:border-blue-500 text-center tracking-widest text-base transition-all placeholder-gray-300 pr-12" 
                    value={creds.password} 
                    onChange={(e) => setCreds({ ...creds, password: e.target.value })} 
                  />
                  
                  {/* TOMBOL MATA */}
                  <button 
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl grayscale opacity-50 hover:opacity-100 active:scale-95 transition-all"
                    onMouseDown={() => setShowPassword(true)}
                    onMouseUp={() => setShowPassword(false)}
                    onMouseLeave={() => setShowPassword(false)}
                    onTouchStart={() => setShowPassword(true)}
                    onTouchEnd={() => setShowPassword(false)}
                  >
                    {showPassword ? "👀" : "👁️"}
                  </button>
              </div>
              <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black mt-2 hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all text-sm">MASUK</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}