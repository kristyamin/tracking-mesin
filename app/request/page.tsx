"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RequestService() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    customer_name: "",
    whatsapp_number: "",
    request_type: "",
    preferred_date: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to submit");
      setIsSuccess(true);
    } catch (error) {
      alert("❌ Oooops! Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 flex flex-col justify-center items-center py-12 px-4">
      <div className="max-w-2xl w-full">
        
        {/* Tombol Back - Minimalis & Tegas */}
        <button 
          onClick={() => router.push('/')} 
          className="mb-6 text-slate-500 text-xs font-bold hover:text-black flex items-center gap-2 transition-all uppercase tracking-widest"
        >
          ← Return to Home
        </button>

        {/* Card Form Utama - Sudut Tajam (Gagah) */}
        <div className="bg-white shadow-2xl border-t-4 border-slate-900 p-8 md:p-12 rounded-sm">
          
          <div className="mb-10 border-b-2 border-slate-100 pb-6 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900">Service Request</h1>
              <p className="text-xs font-bold text-slate-500 tracking-widest uppercase mt-2">Technical Support</p>
            </div>
            <div className="text-right hidden sm:block">
              <h2 className="text-sm font-black uppercase tracking-tighter text-slate-800">PT Djitoe Mesindo</h2>
            </div>
          </div>

          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Baris 1: Nama & WA (Bersebelahan di layar besar) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Company / Customer Name</label>
                  <input 
                    type="text" 
                    required
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:border-slate-900 focus:bg-white focus:ring-0 outline-none transition-all text-sm rounded-none"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">WhatsApp Number / E-Mail</label>
                  <input 
                    type="tel" 
                    required
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:border-slate-900 focus:bg-white focus:ring-0 outline-none transition-all text-sm rounded-none"
                    value={formData.whatsapp_number}
                    onChange={(e) => setFormData({...formData, whatsapp_number: e.target.value})}
                  />
                </div>
              </div>

              {/* Baris 2: Tipe Request & Tanggal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Type of Request</label>
                  <select 
                    required
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:border-slate-900 focus:bg-white focus:ring-0 outline-none transition-all text-sm appearance-none cursor-pointer rounded-none"
                    value={formData.request_type}
                    onChange={(e) => setFormData({...formData, request_type: e.target.value})}
                  >
                    <option value="" disabled>Select request type...</option>
                    <option value="Installation">Installation</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Spare Part Problem">Spare Part Problem</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Requested Visit Date</label>
                  <input 
                    type="date" 
                    required
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:border-slate-900 focus:bg-white focus:ring-0 outline-none transition-all text-sm cursor-pointer rounded-none"
                    value={formData.preferred_date}
                    onChange={(e) => setFormData({...formData, preferred_date: e.target.value})}
                  />
                </div>
              </div>

              {/* Baris 3: Deskripsi */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Description of Issue</label>
                <textarea 
                  required
                  rows={4}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:border-slate-900 focus:bg-white focus:ring-0 outline-none transition-all text-sm resize-none rounded-none"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                ></textarea>
              </div>

              {/* Tombol Submit Kaku & Hitam Elegan */}
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-slate-900 hover:bg-black text-white py-4 font-black transition-all duration-300 active:scale-95 text-xs tracking-[0.2em] uppercase mt-6 rounded-none shadow-xl shadow-slate-900/20"
              >
                {loading ? "PROCESSING..." : "SUBMIT SERVICE REQUEST"}
              </button>
            </form>
          ) : (
            
            /* TAMPILAN SUKSES - Gaya Industrial */
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-slate-900 text-white flex items-center justify-center mx-auto mb-6 rounded-sm shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
              </div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Request Confirmed</h2>
              <p className="text-sm text-slate-500 font-medium mb-10 leading-relaxed max-w-sm mx-auto">
                Your request has been successfully registered. Please wait for confirmation, our team will contact you shortly via WhatsApp.
              </p>
              <button 
                onClick={() => router.push('/')}
                className="bg-slate-100 border border-slate-300 text-slate-900 py-3 px-8 font-black hover:bg-slate-200 transition-all text-xs tracking-widest uppercase rounded-none"
              >
                RETURN TO HOME
              </button>
            </div>
          )}
{/* ======================================= */}
          {/* 🚨 KONTAK DARURAT (CLICKABLE) */}
          {/* ======================================= */}
          <div className="mt-12 pt-8 border-t-2 border-slate-100">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 text-center">Need Help ? Emergency Contact:</p>
            <div className="flex flex-col md:flex-row justify-center items-center gap-3">
              <span className="bg-slate-900 text-white px-4 py-2 text-xs font-black uppercase tracking-widest rounded-sm">
                ROY NUGROHO. K
              </span>
              
              {/* Link Telepon */}
              <a href="tel:+6281275599185" className="flex items-center gap-2 bg-slate-100 hover:bg-blue-100 border border-slate-200 hover:border-blue-300 text-slate-800 hover:text-blue-700 px-4 py-2 text-xs font-bold transition-all rounded-sm cursor-pointer">
                📞 +62 8xx-5559-xxxx
              </a>

              {/* Link Email */}
              <a href="mailto:Roydjitoe@gmail.com" className="flex items-center gap-2 bg-slate-100 hover:bg-red-100 border border-slate-200 hover:border-red-300 text-slate-800 hover:text-red-700 px-4 py-2 text-xs font-bold transition-all rounded-sm cursor-pointer">
                ✉️ Roydjitoe@xxxxx.xxxxxx
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}