"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";

export default function KaryawanPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  
  // State Step 1 (Pencarian NIK)
  const [searchQuery, setSearchQuery] = useState("");
  const [foundUser, setFoundUser] = useState<{ nik: string; nama: string; dept?: string } | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // State Pengatur Tab Form
  const [formType, setFormType] = useState("gatepass");

  // State Data Universal
  const [tujuan, setTujuan] = useState(""); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    setTujuan(""); 
  }, [formType]);
  // ========================================================
  // TUKANG SAPU 2.0 (RESET SAAT USER KEMBALI KE STEP 1)
  // ========================================================
  useEffect(() => {
    // Kalau user balik ke halaman awal (Step 1 / Cari NIK)
    if (step === 1) {
      setTujuan(""); 
      setFormType("gatepass"); 
    }
  }, [step]); 

  // ================= FUNGSI GENERATE NOMOR SURAT OTOMATIS =================
  const generateNomorSurat = async (tipeForm: string) => {
    const date = new Date();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);

    let kodeTipe = "";
    if (tipeForm === "gatepass") kodeTipe = "BK";
    else if (tipeForm === "ijin_keluar") kodeTipe = "IK";
    else if (tipeForm === "setengah_hari") kodeTipe = "ISH";
    else if (tipeForm === "ket_hadir") kodeTipe = "SKH";

    const prefixSurat = `DM/GP-${month}-${year}/${kodeTipe}-`;

    try {
      const { data, error } = await supabase
        .from('form_pengajuan')
        .select('nomor_surat')
        .like('nomor_surat', `${prefixSurat}%`)
        .order('nomor_surat', { ascending: false })
        .limit(1);

      let urutan = 1;

      if (data && data.length > 0) {
        const lastNumber = data[0].nomor_surat.split('-').pop();
        if (lastNumber) urutan = parseInt(lastNumber) + 1;
      }

      const finalUrutan = String(urutan).padStart(3, '0');
      return `${prefixSurat}${finalUrutan}`;
    } catch (err) {
      console.error("Gagal generate nomor surat:", err);
      return `${prefixSurat}999`;
    }
  };

  // State Khusus Gate Pass
  const [barangList, setBarangList] = useState([
    { id: 1, namaBarang: "", jumlah: "", fotoPreview: "", fotoFile: null as File | null }
  ]);

  // State Khusus HRD
  const [tanggalIjin, setTanggalIjin] = useState("");
  const [department, setDepartment] = useState("");
  const [jamMulai, setJamMulai] = useState("");
  const [jamSelesai, setJamSelesai] = useState("");
  const [kendaraan, setKendaraan] = useState("");

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setTanggalIjin(today);
  }, []);

  // ================= FUNGSI GATE PASS =================
  const updateBarang = (id: number, field: 'namaBarang' | 'jumlah', value: string) => {
    const newList = barangList.map(item => {
      if (item.id === id) return { ...item, [field]: value };
      return item;
    });
    setBarangList(newList);
  };

  const handleUploadFoto = async (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const options = { maxSizeMB: 0.2, maxWidthOrHeight: 1024, useWebWorker: true };
    try {
      const compressedFile = await imageCompression(file, options);
      const previewUrl = URL.createObjectURL(compressedFile);
      const newList = barangList.map(item => {
        if (item.id === id) return { ...item, fotoPreview: previewUrl, fotoFile: compressedFile };
        return item;
      });
      setBarangList(newList);
    } catch (error) {
      console.error("Gagal kompres gambar:", error);
      alert("⚠️ Gagal memproses gambar, silakan coba lagi.");
    }
  };

  const tambahBarang = () => {
    const lastItem = barangList[barangList.length - 1];
    if (lastItem.namaBarang.trim() === "" || lastItem.jumlah.trim() === "" || !lastItem.fotoFile) {
      alert("⚠️ Nama barang, Jumlah, dan Foto tidak boleh kosong sebelum menambah barang baru!");
      return;
    }
    setBarangList([...barangList, { id: Date.now(), namaBarang: "", jumlah: "", fotoPreview: "", fotoFile: null }]);
  };

  const hapusBarang = (idHapus: number) => {
    if (barangList.length === 1) {
      alert("⚠️ Minimal harus ada 1 barang di Surat Jalan!");
      return;
    }
    setBarangList(barangList.filter(item => item.id !== idHapus));
  };

  // ==================== FUNGSI PENCARIAN ====================
  const handleSearch = async () => {
    if (!searchQuery) return;
    setIsSearching(true);
    setFoundUser(null);

    try {
      const { data, error } = await supabase
        .from('company_employees') 
        .select('*')
        .eq('nik', searchQuery)
        .single();
        
      if (error || !data) {
        alert("❌ NIK tidak ditemukan di sistem!");
      } else {
        setFoundUser({ 
          nik: data.nik, 
          nama: data.nama, 
          dept: data.department 
        });
        if(data.department) setDepartment(data.department);
      }
    } catch (err) {
      console.log("Error cek NIK:", err);
      alert("❌ Terjadi kesalahan jaringan saat mengecek NIK.");
    }

    setIsSearching(false);
  };

  // ==================== FUNGSI KIRIM KE SUPABASE ====================
  const handleKirim = async () => {
    if (!foundUser) {
      alert("⚠️ Silakan cari NIK Karyawan terlebih dahulu!");
      return;
    }

    // 1. Validasi Gate Pass
    if (formType === 'gatepass') {
      const adaBarangKosong = barangList.some((item: any) => item.namaBarang.trim() === "" || !item.fotoFile);
      if (adaBarangKosong || barangList.length === 0) {
        alert("⚠️ Lengkapi semua kolom: Nama Barang, Jumlah, DAN FOTO untuk setiap barang!");
        return;
      }
    }

    if (tujuan.trim() === "") {
      alert("⚠️ Kolom Tujuan / Alasan dibawah harus diisi!");
      return;
    }

    // 2. Validasi HRD & Ket Hadir
    if (formType === 'ijin_keluar' || formType === 'setengah_hari') {
       if (!tanggalIjin || !department || !jamMulai || !tujuan) {
         alert("⚠️ Mohon lengkapi Tanggal, Dept, Jam, dan Alasan!");
         return;
       }
    }
    if (formType === 'ket_hadir') {
      if (!tanggalIjin || !department || !jamMulai || !tujuan) {
        alert("⚠️ Mohon lengkapi Tanggal, Dept, Jam Kerja, dan Alasan!");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // 3. Bikin Nomor Surat
      const nomorSuratBaru = await generateNomorSurat(formType);

      // 4. Upload Foto ke Gudang Supabase (Khusus Gatepass)
      let finalBarangList = null;
      if (formType === 'gatepass' && barangList.length > 0) {
        finalBarangList = await Promise.all(
          barangList.map(async (item: any, index: number) => {
            if (item.fotoFile) {
              const fileExt = item.fotoFile.name ? item.fotoFile.name.split('.').pop() : 'jpg';
              const namaFileUnik = `foto-barang-${Date.now()}-${index}.${fileExt}`;

              const { error: uploadError } = await supabase.storage
                .from('gatepass-images')
                .upload(namaFileUnik, item.fotoFile);

              if (uploadError) throw new Error("Gagal mengunggah foto ke server.");

              const { data: publicUrlData } = supabase.storage
                .from('gatepass-images')
                .getPublicUrl(namaFileUnik);
              return { 
                namaBarang: item.namaBarang, 
                jumlah: item.jumlah, 
                foto: publicUrlData.publicUrl 
              };
            }
            return item; 
          })
        );
      }

      // Siapkan Data Waktu
      const date = new Date();
      const tglSkrg = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
      const jamSkrg = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
      const blnSkrg = String(date.getMonth() + 1).padStart(2, '0');
      const thnSkrg = String(date.getFullYear());

      // 5. Lempar semua data ke Tabel 'form_pengajuan'
      const { error } = await supabase.from('form_pengajuan').insert({
        nomor_surat: nomorSuratBaru,
        tipe_form: formType,
        pemohon: foundUser.nama,
        nik: foundUser.nik,
        department: foundUser.dept || department,
        tujuan: tujuan,
        tanggal: tglSkrg,
        jam: jamSkrg,
        bulan: blnSkrg,
        tahun: thnSkrg,
        barang: formType === 'gatepass' ? finalBarangList : null,
        tanggal_ijin: tanggalIjin || null,
        jam_mulai: jamMulai || null,
        jam_selesai: jamSelesai || null,
        kendaraan: kendaraan || null
      });

      if (error) throw error;

      // 6. Kalau Sukses
      alert(`✅ PENGAJUAN BERHASIL!\n\nNomor Surat: ${nomorSuratBaru}\n\nSilakan lapor ke Manajer untuk ACC.`);
      
      // Bersihin form
      setStep(1);
      setTujuan("");
      setSearchQuery("");
      setFoundUser(null);
      setBarangList([{ id: 1, namaBarang: "", jumlah: "", fotoPreview: "", fotoFile: null }]);

    } catch (err) {
      console.error("Gagal simpan:", err);
      alert("❌ Gagal mengirim data. Pastikan koneksi internet stabil.");
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
      
      {/* HEADER UMUM */}
      <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-sm mb-6 border-t-4 border-blue-500">
        <h1 className="text-2xl font-bold text-blue-800 mb-2">📋 DJITOE MESINDO</h1>
        <p className="text-gray-500 text-sm">Sistem Pengajuan Barang Keluar & Izin</p>
      </div>

      <div className="w-full max-w-md">
        
        {/* ================= STEP 1: PENCARIAN NIK ================= */}
        {step === 1 && (
          <div className="bg-white p-6 rounded-2xl shadow-sm animate-fade-in border border-gray-100">
            <label className="block text-gray-700 font-bold mb-2 text-lg">Verifikasi Identitas</label>
            <p className="text-sm text-gray-400 mb-4">Masukkan NIK anda</p>
            
            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                placeholder="Ketik NIK" 
                className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-black"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button 
                onClick={handleSearch} 
                disabled={isSearching} 
                className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 w-16 flex items-center justify-center font-bold text-xl active:scale-95 transition"
              >
                {isSearching ? "⏳" : "🔍"}
              </button>
            </div>

            {foundUser && (
              <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-xl mt-6 animate-fade-in">
                <p className="text-xs text-blue-600 font-extrabold mb-1 tracking-wider">DATA DITEMUKAN:</p>
                <p className="font-bold text-black text-lg mb-4">{foundUser.nik} - {foundUser.nama}</p>
                
                <button onClick={() => setStep(2)} className="w-full bg-green-600 text-white font-bold py-3.5 rounded-xl hover:bg-green-700 active:scale-95 transition text-lg shadow-md shadow-green-200">
                  Lanjut Isi Form ➔
                </button>
              </div>
            )}
          </div>
        )}

        {/* ================= STEP 2: PILIHAN TAB & ISI FORM ================= */}
        {step === 2 && (
          <div className="bg-white p-6 rounded-2xl shadow-sm animate-fade-in border border-gray-100">
             
             {/* PROFIL SINGKAT */}
             <div className="bg-gray-100 p-3 rounded-xl mb-6 flex justify-between items-center border border-gray-200">
                <div>
                  <span className="text-xs text-gray-500 font-bold">KARYAWAN:</span>
                  <p className="font-bold text-black">{foundUser?.nama}</p>
                </div>
                <button onClick={() => setStep(1)} className="text-blue-600 text-sm font-bold underline bg-blue-50 px-3 py-1 rounded-lg">Ganti NIK</button>
             </div>

             {/* TAB MENU PINTAR */}
             <div className="flex gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide">
               <button 
                 onClick={() => setFormType('gatepass')} 
                 className={`px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition border-2 ${formType === 'gatepass' ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-white text-gray-400 border-gray-100 hover:bg-gray-50'}`}
               >
                 Barang Keluar
               </button>
               <button 
                 onClick={() => setFormType('ijin_keluar')} 
                 className={`px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition border-2 ${formType === 'ijin_keluar' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-white text-gray-400 border-gray-100 hover:bg-gray-50'}`}
               >
                 Izin Keluar
               </button>
               <button 
                 onClick={() => setFormType('setengah_hari')} 
                 className={`px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition border-2 ${formType === 'setengah_hari' ? 'bg-indigo-100 text-indigo-700 border-indigo-300' : 'bg-white text-gray-400 border-gray-100 hover:bg-gray-50'}`}
               >
                 Izin Setengah Hari
               </button>
               <button 
                 onClick={() => setFormType('ket_hadir')} 
                 className={`px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition border-2 ${formType === 'ket_hadir' ? 'bg-rose-100 text-rose-700 border-rose-300' : 'bg-white text-gray-400 border-gray-100 hover:bg-gray-50'}`}
               >
                 Ket. Hadir
               </button>
             </div>

             {/* ================= AREA FORM DINAMIS ================= */}
             
             {/* 1. FORM GATE PASS */}
             {formType === 'gatepass' && (
               <div className="animate-fade-in">
                 <h2 className="text-lg font-bold text-gray-800 mb-6 border-b-2 border-gray-100 pb-2">Daftar Barang Bawaan</h2>
                 {barangList.map((item, index) => (
                    <div key={item.id} className="mb-8 p-4 bg-gray-50 border border-gray-200 rounded-xl relative">
                      <span className="absolute -top-3 left-4 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">Barang {index + 1}</span>
                      {barangList.length > 1 && (
                        <button onClick={() => hapusBarang(item.id)} className="absolute -top-3 right-4 bg-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-full shadow-sm hover:bg-red-200 active:scale-95 transition">❌ Hapus</button>
                      )}
                      <div className="flex flex-col gap-3 mt-2 mb-3">
                        <textarea rows={2} placeholder="Nama barang rinci..." className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium text-black resize-y leading-relaxed" value={item.namaBarang} onChange={(e) => updateBarang(item.id, 'namaBarang', e.target.value)}></textarea>
                        <input type="text" placeholder="Jumlah (Cth: 2 Pcs)" className="w-1/2 border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium text-black" value={item.jumlah} onChange={(e) => updateBarang(item.id, 'jumlah', e.target.value)} />
                      </div>
                      <div className="mt-4">
                        {item.fotoPreview ? (
                          <div className="relative w-full h-40 rounded-xl overflow-hidden border-2 border-dashed border-blue-400 group">
                            <img src={item.fotoPreview} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                              <span className="text-white font-bold mb-2">Ganti Foto</span>
                              <input type="file" accept="image/*" capture="environment" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleUploadFoto(item.id, e)} />
                            </div>
                          </div>
                        ) : (
                          <label className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-amber-400 bg-amber-50 text-amber-700 p-3 rounded-xl cursor-pointer hover:bg-amber-100 transition font-bold relative">
                            📸 Upload Foto Fisik
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" capture="environment" onChange={(e) => handleUploadFoto(item.id, e)} />
                          </label>
                        )}
                      </div>
                    </div>
                 ))}
                 <button onClick={tambahBarang} className="w-full border-2 border-gray-300 text-gray-700 font-bold py-3 rounded-xl mb-8 bg-white hover:bg-gray-50 active:scale-95 transition">➕ Tambah Barang Lain</button>
                 <label className="block text-gray-800 font-bold mb-2">Tujuan / Alasan Dibawa</label>
                 <textarea rows={2} placeholder="Tulis alasan di sini..." className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 mb-6 font-medium text-black" value={tujuan} onChange={(e) => setTujuan(e.target.value)}></textarea>
               </div>
             )}

             {/* 2. FORM IJIN KELUAR & SETENGAH HARI */}
             {(formType === 'ijin_keluar' || formType === 'setengah_hari') && (
               <div className="animate-fade-in space-y-4 mb-6 mt-4">
                 <h2 className="text-lg font-bold text-gray-800 border-b-2 border-gray-100 pb-2 mb-4">
                   {formType === 'ijin_keluar' ? 'Form Ijin Keluar' : 'Form Ijin Setengah Hari'}
                 </h2>
                 <div className="flex gap-3">
                   <div className="w-1/2">
                     <label className="block text-gray-700 font-bold mb-1 text-sm">Tanggal Ijin</label>
                     <input type="date" className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold text-black" value={tanggalIjin} onChange={(e) => setTanggalIjin(e.target.value)} />
                   </div>
                   <div className="w-1/2">
                     <label className="block text-gray-700 font-bold mb-1 text-sm">Department</label>
                     <input type="text" className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold text-black bg-gray-50" value={department} onChange={(e) => setDepartment(e.target.value)} />
                   </div>
                 </div>
                 
                 <div className="flex gap-3">
                   <div className="w-1/2">
                     <label className="block text-gray-700 font-bold mb-1 text-sm">{formType === 'ijin_keluar' ? 'Jam Ijin Keluar' : 'Jam Kerja (Dari)'}</label>
                     <input type="time" className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold text-black" value={jamMulai} onChange={(e) => setJamMulai(e.target.value)} />
                   </div>
                   <div className="w-1/2">
                     <label className="block text-gray-700 font-bold mb-1 text-sm">S/d Jam</label>
                     <input type="time" className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold text-black" value={jamSelesai} onChange={(e) => setJamSelesai(e.target.value)} />
                   </div>
                 </div>

                 <div>
                   <label className="block text-gray-700 font-bold mb-1 text-sm">Alasan Ijin</label>
                   <textarea rows={2} placeholder="Sebutkan alasan detail..." className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium text-black resize-y" value={tujuan} onChange={(e) => setTujuan(e.target.value)}></textarea>
                 </div>

                 <div>
                   <label className="block text-gray-700 font-bold mb-1 text-sm">No. Motor / Mobil (Opsional)</label>
                   <input type="text" placeholder="Contoh: BP 1234 XY" className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold text-black uppercase" value={kendaraan} onChange={(e) => setKendaraan(e.target.value)} />
                 </div>
               </div>
             )}

             {/* 3. FORM KETERANGAN HADIR */}
             {formType === 'ket_hadir' && (
               <div className="animate-fade-in space-y-4 mb-6 mt-4">
                 <h2 className="text-lg font-bold text-gray-800 border-b-2 border-gray-100 pb-2 mb-4">Form Keterangan Hadir</h2>
                 
                 <div className="flex gap-3">
                   <div className="w-1/2">
                     <label className="block text-gray-700 font-bold mb-1 text-sm">Tanggal Kejadian</label>
                     <input type="date" className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-rose-500 font-bold text-black" value={tanggalIjin} onChange={(e) => setTanggalIjin(e.target.value)} />
                   </div>
                   <div className="w-1/2">
                     <label className="block text-gray-700 font-bold mb-1 text-sm">Bagian / Dept</label>
                     <input type="text" className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-rose-500 font-bold text-black bg-gray-50" value={department} onChange={(e) => setDepartment(e.target.value)} />
                   </div>
                 </div>
                 
                 <div>
                    <label className="block text-gray-700 font-bold mb-1 text-sm">Jam Kerja / Shift</label>
                    <input type="text" placeholder="Contoh: Shift 1 (08.00 - 17.00)" className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-rose-500 font-medium text-black" value={jamMulai} onChange={(e) => setJamMulai(e.target.value)} />
                 </div>

                 <div>
                   <label className="block text-gray-700 font-bold mb-1 text-sm">Alasan</label>
                   <textarea rows={2} placeholder="Contoh: Lupa Absen / Mesin Finger Rusak" className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-rose-500 font-medium text-black resize-y" value={tujuan} onChange={(e) => setTujuan(e.target.value)}></textarea>
                 </div>
               </div>
             )}

             {/* ================= TOMBOL KIRIM UNIVERSAL ================= */}
             <button 
                onClick={handleKirim}
                disabled={isSubmitting}
                className={`w-full text-white font-bold py-4 rounded-xl text-lg shadow-md transition ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 active:scale-95'}`}
             >
                {isSubmitting ? '⏳ Mengirim Data & Foto...' : ' Kirim Pengajuan'}
             </button>
          </div>
        )}

        <div className="mt-8 text-center pb-8">
          <Link href="/" className="text-gray-400 underline font-medium hover:text-gray-600">
            ⬅ Kembali ke Menu Utama
          </Link>
        </div>

      </div>
    </div>
  );
}