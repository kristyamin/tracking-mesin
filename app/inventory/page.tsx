"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function InventoryPage() {
  const router = useRouter();
  const [role, setRole] = useState("");
  const [activeTab, setActiveTab] = useState<"MESS" | "VEHICLE">("MESS");
  const [loading, setLoading] = useState(true);
  const [isReportMode, setIsReportMode] = useState(false);

  // DATA STATE
  const [messList, setMessList] = useState<any[]>([]);
  const [vehicleList, setVehicleList] = useState<any[]>([]);
  const [residentList, setResidentList] = useState<any[]>([]);
  
  // SEARCH STATE
  const [searchTerm, setSearchTerm] = useState("");

  // MODAL STATE
  const [selectedMess, setSelectedMess] = useState<any>(null); 
  const [showFormMess, setShowFormMess] = useState(false); 
  const [showFormVehicle, setShowFormVehicle] = useState(false); 
  const [showFormResident, setShowFormResident] = useState(false); 

  // EDIT STATE
  const [editingMessId, setEditingMessId] = useState<number | null>(null);
  const [editingVehicleId, setEditingVehicleId] = useState<number | null>(null);

  // INPUT STATE
  const [formMessData, setFormMessData] = useState({ nama: "", pic: "", alamat: "", kamar: "" });
  const [formVehicleData, setFormVehicleData] = useState({
      mess_id: "", jenis: "MOBIL", nama: "", plat: "", 
      pic: "", nik: "", kontak: "", 
      pajak: "", service: "", oli: ""
  });
  const [formResidentData, setFormResidentData] = useState({
      mess_id: "", nama: "", nik: "", hp: "", kamar: "", jabatan: ""
  });

  useEffect(() => {
    const userRole = sessionStorage.getItem("user_role");
    if (userRole !== "mess_admin" && userRole !== "mess_viewer") {
        router.push("/"); 
    } else {
        setRole(userRole);
        fetchData();
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: dataMess } = await supabase.from("mess_locations").select("*").order("nama_mess");
    if (dataMess) setMessList(dataMess);

    const { data: dataVehicles } = await supabase.from("mess_vehicles").select("*, mess_locations(nama_mess)").order("tgl_service");
    if (dataVehicles) setVehicleList(dataVehicles);

    const { data: dataResidents } = await supabase.from("mess_residents").select("*").order("nama_karyawan");
    if (dataResidents) setResidentList(dataResidents);
    
    setLoading(false);
  };

  // --- LOGIKA FILTER KENDARAAN ---
  const getFilteredAndSortedVehicles = () => {
      let filtered = vehicleList;
      if (searchTerm && activeTab === "VEHICLE") { // Hanya filter jika di tab vehicle
          const lowerTerm = searchTerm.toLowerCase();
          filtered = vehicleList.filter(v => 
              v.nama_kendaraan?.toLowerCase().includes(lowerTerm) || 
              v.plat_nomor?.toLowerCase().includes(lowerTerm) ||
              v.pic_kendaraan?.toLowerCase().includes(lowerTerm) ||
              v.mess_locations?.nama_mess?.toLowerCase().includes(lowerTerm)
          );
      }
      return filtered.sort((a, b) => new Date(a.tgl_service).getTime() - new Date(b.tgl_service).getTime());
  };

  // --- LOGIKA FILTER MESS (BARU) ---
  const getFilteredMessList = () => {
      let filtered = messList;
      if (searchTerm && activeTab === "MESS") { // Filter jalan saat di tab MESS
          const lowerTerm = searchTerm.toLowerCase();
          filtered = messList.filter(mess => {
              // 1. Cari berdasarkan Nama Mess
              const matchNama = mess.nama_mess?.toLowerCase().includes(lowerTerm);
              // 2. Cari berdasarkan PIC Mess
              const matchPic = mess.pic_utama?.toLowerCase().includes(lowerTerm);
              // 3. Cari berdasarkan Nama Penghuni di dalamnya
              const residentsInMess = residentList.filter(r => r.mess_id === mess.id);
              const matchPenghuni = residentsInMess.some(r => r.nama_karyawan?.toLowerCase().includes(lowerTerm));
              
              return matchNama || matchPic || matchPenghuni;
          });
      }
      return filtered;
  };

  const finalVehicleList = getFilteredAndSortedVehicles();
  const nonMessVehicles = finalVehicleList.filter(v => !v.mess_id); 
  const messVehicles = finalVehicleList.filter(v => v.mess_id);     
  const finalMessList = getFilteredMessList(); // Pakai list mess yang sudah difilter

  // LOGIKA INDIKATOR WARNA
  const getStatusIndicator = (dateString: string, type: string) => {
      if (!dateString) return <span className="text-gray-300 text-[9px] font-mono">--</span>;
      const today = new Date();
      today.setHours(0,0,0,0);
      const targetDate = new Date(dateString);
      const diffTime = targetDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return <span className="bg-red-600 text-white px-2 py-0.5 rounded text-[9px] font-black animate-pulse shadow-md">🚨 TELAT {Math.abs(diffDays)} HARI ({type})</span>;
      else if (diffDays <= 1) return <span className="bg-red-100 text-red-700 border border-red-300 px-2 py-0.5 rounded text-[9px] font-black animate-pulse">🔴 BESOK! ({type})</span>;
      else if (diffDays <= 3) return <span className="bg-orange-100 text-orange-700 border border-orange-300 px-2 py-0.5 rounded text-[9px] font-black">🟠 H-{diffDays} ({type})</span>;
      else if (diffDays <= 7) return <span className="bg-yellow-100 text-yellow-700 border border-yellow-300 px-2 py-0.5 rounded text-[9px] font-black">🟡 H-{diffDays} ({type})</span>;
      else return <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded text-[9px] font-bold border border-green-200">🟢 OK ({type})</span>;
  };

  const handlePrintResidents = () => {
    setIsReportMode(true);
    setTimeout(() => {
        window.print();
    }, 500);
  };

  // CRUD FUNCTIONS
  const openAddMess = () => { setEditingMessId(null); setFormMessData({ nama: "", pic: "", alamat: "", kamar: "" }); setShowFormMess(true); };
  const openAddVehicle = () => { setEditingVehicleId(null); setFormVehicleData({ mess_id: "", jenis: "MOBIL", nama: "", plat: "", pic: "", nik: "", kontak: "", pajak: "", service: "", oli: "" }); setShowFormVehicle(true); };

  const openEditMess = (mess: any, e: any) => {
      e.stopPropagation(); 
      setEditingMessId(mess.id);
      setFormMessData({ nama: mess.nama_mess, pic: mess.pic_utama, alamat: mess.alamat, kamar: mess.jumlah_kamar });
      setShowFormMess(true);
  };

  const openEditVehicle = (vehicle: any) => {
      setEditingVehicleId(vehicle.id);
      setFormVehicleData({ mess_id: vehicle.mess_id || "", jenis: vehicle.jenis, nama: vehicle.nama_kendaraan, plat: vehicle.plat_nomor, pic: vehicle.pic_kendaraan, nik: vehicle.pic_nik, kontak: vehicle.pic_kontak, pajak: vehicle.tgl_pajak, service: vehicle.tgl_service, oli: vehicle.tgl_ganti_oli });
      setShowFormVehicle(true);
  };

  const handleSaveMess = async () => {
      if (!formMessData.nama) return alert("Nama Mess Wajib!");
      const payload = { nama_mess: formMessData.nama, pic_utama: formMessData.pic, alamat: formMessData.alamat, jumlah_kamar: parseInt(formMessData.kamar) || 0 };
      if (editingMessId) await supabase.from("mess_locations").update(payload).eq("id", editingMessId);
      else await supabase.from("mess_locations").insert(payload);
      alert(editingMessId ? "✅ Data Mess Diperbarui!" : "✅ Mess Baru Ditambahkan!"); setShowFormMess(false); fetchData();
  };

  const handleSaveVehicle = async () => {
      if (!formVehicleData.plat || !formVehicleData.nama) return alert("Nama & Plat Wajib!");
      const payload = { mess_id: formVehicleData.mess_id || null, jenis: formVehicleData.jenis, nama_kendaraan: formVehicleData.nama, plat_nomor: formVehicleData.plat, pic_kendaraan: formVehicleData.pic, pic_nik: formVehicleData.nik, pic_kontak: formVehicleData.kontak, tgl_pajak: formVehicleData.pajak || null, tgl_service: formVehicleData.service || null, tgl_ganti_oli: formVehicleData.oli || null };
      if (editingVehicleId) await supabase.from("mess_vehicles").update(payload).eq("id", editingVehicleId);
      else await supabase.from("mess_vehicles").insert(payload);
      alert(editingVehicleId ? "✅ Data Kendaraan Diperbarui!" : "✅ Kendaraan Baru Ditambahkan!"); setShowFormVehicle(false); fetchData();
  };

  const handleAddResident = async () => {
      if (!formResidentData.nama || !formResidentData.mess_id) return alert("Nama & Lokasi Mess Wajib!");
      const { error } = await supabase.from("mess_residents").insert({ mess_id: formResidentData.mess_id, nama_karyawan: formResidentData.nama, nik: formResidentData.nik, no_hp: formResidentData.hp, kamar_no: formResidentData.kamar, jabatan: formResidentData.jabatan });
      if(error) alert("Gagal: " + error.message); else { alert("✅ Penghuni Baru Ditambahkan"); setShowFormResident(false); fetchData(); }
  };

  const handleDelete = async (table: string, id: number) => {
      if (!confirm("⚠️ Yakin hapus data ini selamanya?")) return;
      await supabase.from(table).delete().eq("id", id);
      fetchData();
  };

  // --- COMPONENT TABEL KENDARAAN ---
  const VehicleTable = ({ data, title, colorTheme }: any) => (
      <div className={`bg-white rounded-[2rem] border overflow-hidden shadow-sm flex flex-col h-full ${colorTheme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className={`p-4 border-b flex items-center gap-2 ${colorTheme === 'dark' ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-700'}`}>
              <h3 className="font-black uppercase text-sm tracking-wider flex-1">{title} <span className="opacity-70 text-xs ml-1">({data.length} Unit)</span></h3>
          </div>
          <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm">
                  <thead className="bg-white text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-50">
                      <tr>
                          <th className="p-3">Info Aset</th>
                          <th className="p-3">Lokasi/PIC</th>
                          <th className="p-3">Jadwal</th>
                          {role === 'mess_admin' && <th className="p-3 text-center">Aksi</th>}
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                      {data.map((v: any) => (
                          <tr key={v.id} className="hover:bg-slate-50 transition">
                              <td className="p-3">
                                  <div className="flex items-center gap-2">
                                      <span className="text-xl" title={v.jenis}>{v.jenis === 'MOBIL' ? '🚙' : '🏍️'}</span>
                                      <div>
                                          <p className="font-black text-slate-800 uppercase text-xs">{v.nama_kendaraan}</p>
                                          <p className="font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded-[4px] text-[9px] w-fit mt-1">{v.plat_nomor}</p>
                                      </div>
                                  </div>
                              </td>
                              <td className="p-3">
                                  <p className="font-bold text-slate-700 text-[10px] uppercase">{v.mess_locations ? v.mess_locations.nama_mess : "NON-MESS"}</p>
                                  <p className="text-[10px] text-slate-400">👤 {v.pic_kendaraan || "-"}</p>
                              </td>
                              <td className="p-3 space-y-1">
                                  <div>{getStatusIndicator(v.tgl_service, "Svc")}</div>
                                  <div>{getStatusIndicator(v.tgl_ganti_oli, "Oli")}</div>
                                  <div>{getStatusIndicator(v.tgl_pajak, "Pjk")}</div>
                              </td>
                              {role === 'mess_admin' && (
                                  <td className="p-3 text-center">
                                      <div className="flex justify-center gap-1">
                                          <button onClick={() => openEditVehicle(v)} className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white p-1.5 rounded-lg transition text-xs">✏️</button>
                                          <button onClick={() => handleDelete('mess_vehicles', v.id)} className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white p-1.5 rounded-lg transition text-xs">🗑️</button>
                                      </div>
                                  </td>
                              )}
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
  );

  // --- TAMPILAN MODE LAPORAN (KHUSUS PRINT) ---
  if (isReportMode) {
    return (
        <div className="bg-white min-h-screen p-8 font-sans text-black">
            <div className="print:hidden mb-6 flex justify-between items-center bg-slate-100 p-4 rounded-xl">
                <p className="font-bold text-slate-700">Mode Pratinjau Cetak</p>
                <button onClick={() => setIsReportMode(false)} className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 transition">
                    ❌ KEMBALI KE DASHBOARD
                </button>
            </div>
            <div className="text-center mb-8 border-b-2 border-black pb-4">
                <h1 className="text-2xl font-black uppercase tracking-widest">PT DJITOE MESINDO</h1>
                <h2 className="text-xl font-bold uppercase mt-1">LAPORAN DATA PENGHUNI MESS</h2>
                <p className="text-sm mt-2">Dicetak pada: {new Date().toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <div className="space-y-8">
                {messList.map((mess) => {
                    const residents = residentList.filter(r => r.mess_id === mess.id);
                    if (residents.length === 0) return null; 

                    return (
                        <div key={mess.id} className="break-inside-avoid">
                            <div className="flex justify-between items-end mb-2 border-b border-black pb-1">
                                <h3 className="font-black text-lg uppercase">📍 {mess.nama_mess}</h3>
                                <p className="text-xs font-mono">{mess.alamat}</p>
                            </div>
                            <table className="w-full text-left text-sm border-collapse border border-black">
                                <thead>
                                    <tr className="bg-gray-200 text-black">
                                        <th className="border border-black p-2 w-10 text-center">No</th>
                                        <th className="border border-black p-2">Nama Karyawan</th>
                                        <th className="border border-black p-2">NIK</th>
                                        <th className="border border-black p-2">Jabatan</th>
                                        <th className="border border-black p-2 text-center">Kamar</th>
                                        <th className="border border-black p-2">Kontak HP</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {residents.map((r, idx) => (
                                        <tr key={r.id}>
                                            <td className="border border-black p-2 text-center">{idx + 1}</td>
                                            <td className="border border-black p-2 font-bold uppercase">{r.nama_karyawan}</td>
                                            <td className="border border-black p-2 font-mono">{r.nik || "-"}</td>
                                            <td className="border border-black p-2">{r.jabatan || "-"}</td>
                                            <td className="border border-black p-2 text-center">{r.kamar_no || "-"}</td>
                                            <td className="border border-black p-2">{r.no_hp || "-"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="mt-2 text-right text-xs italic">Total: {residents.length} Penghuni</div>
                        </div>
                    );
                })}
            </div>
            <div className="mt-16 flex justify-end print:mt-10 break-inside-avoid">
                <div className="text-center w-64">
                    <p className="mb-16">Mengetahui,</p>
                    <p className="font-bold underline uppercase">( ....................................... )</p>
                    <p className="text-xs mt-1">HRD / Pimpinan</p>
                </div>
            </div>
        </div>
    );
  }

  // --- TAMPILAN DASHBOARD UTAMA (NORMAL) ---
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 p-4 md:p-8 print:bg-white print:p-0">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 print:mb-4">
            <div>
                <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">INVENTARIS PERUSAHAAN</h1>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">PT DJITOE MESINDO - ASSET MANAGEMENT</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center print:hidden">
                {role === "mess_admin" && (
                    <>
                        <button onClick={openAddMess} className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-black transition">+ MESS</button>
                        <button onClick={openAddVehicle} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition">+ KENDARAAN</button>
                        <button onClick={() => setShowFormResident(true)} className="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-green-700 transition">+ PENGHUNI</button>
                    </>
                )}
                <button onClick={() => router.push("/")} className="bg-white border border-slate-200 text-slate-500 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-100 transition">LOGOUT</button>
            </div>
        </div>

        {/* TAB MENU */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 print:hidden">
            <div className="flex gap-2 bg-white p-1 rounded-2xl w-fit shadow-sm border border-slate-200">
                <button onClick={() => { setActiveTab("MESS"); setSearchTerm(""); }} className={`px-6 py-3 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'MESS' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
                    🏠 LIST MESS
                </button>
                <button onClick={() => { setActiveTab("VEHICLE"); setSearchTerm(""); }} className={`px-6 py-3 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'VEHICLE' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
                    🚗 LIST KENDARAAN
                </button>
            </div>

            <div className="flex gap-2 items-center">
                {/* TOMBOL CETAK SPESIFIK (HANYA MUNCUL DI TAB MESS) */}
                <div className="flex gap-2">
                    {activeTab === "MESS" && (
                        <button onClick={handlePrintResidents} className="bg-emerald-600 text-white px-4 py-3 rounded-xl text-xs font-bold hover:bg-emerald-700 transition flex items-center gap-2 shadow-lg animate-in fade-in">
                            📄 <span className="hidden md:inline">CETAK DATA PENGHUNI</span>
                        </button>
                    )}
                    <button onClick={() => window.print()} className="bg-slate-800 text-white px-4 py-3 rounded-xl text-xs font-bold hover:bg-black transition flex items-center gap-2 shadow-lg">
                        🖨️ <span className="hidden md:inline">PRINT LAYAR</span>
                    </button>
                </div>

                {/* SEARCH BAR (SELALU MUNCUL TAPI PLACEHOLDER BERUBAH) */}
                <div className="relative w-full md:w-64 animate-in fade-in">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                    <input 
                        type="text" 
                        placeholder={activeTab === 'MESS' ? "Cari Mess / PIC / Penghuni..." : "Cari Mobil / Motor / PIC..."} 
                        className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-slate-200 font-bold text-slate-700 text-xs focus:outline-none focus:border-blue-500 transition shadow-sm" 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                    />
                </div>
            </div>
        </div>

        {/* CONTENT MIAN */}
        {activeTab === "MESS" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
                {finalMessList.map((mess) => {
                    const totalOrang = residentList.filter(r => r.mess_id === mess.id).length;
                    const totalKamar = mess.jumlah_kamar || 0;
                    return (
                        <div key={mess.id} onClick={() => setSelectedMess(mess)} 
                             className="bg-white rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-300 hover:scale-[1.02] transition-all cursor-pointer group relative overflow-hidden flex flex-col h-full">
                            <div className="relative h-32 bg-slate-200 flex items-center justify-center overflow-hidden">
                                <img src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=500&auto=format&fit=crop" alt="Mess" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent z-10"></div>
                                <div className="absolute bottom-3 left-4 z-20">
                                    <h3 className="text-lg font-black text-white uppercase tracking-tight shadow-black drop-shadow-md">{mess.nama_mess}</h3>
                                    <p className="text-[10px] text-slate-300 font-medium">{mess.alamat || "Alamat belum diisi"}</p>
                                </div>
                                {role === 'mess_admin' && (
                                    <div className="absolute top-3 right-3 z-30 flex gap-2">
                                        <button onClick={(e) => openEditMess(mess, e)} className="w-8 h-8 bg-white/20 backdrop-blur-sm hover:bg-blue-600 hover:text-white rounded-full flex items-center justify-center transition shadow-lg text-white">✏️</button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete('mess_locations', mess.id); }} className="w-8 h-8 bg-white/20 backdrop-blur-sm hover:bg-red-500 hover:text-white rounded-full flex items-center justify-center transition shadow-lg text-white">🗑️</button>
                                    </div>
                                )}
                            </div>
                            <div className="p-5 flex-1 flex flex-col justify-between">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-2 py-1 rounded-lg uppercase">PIC: {mess.pic_utama}</span>
                                    <div className={`text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1 ${totalOrang >= totalKamar ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                        <span>🛏️</span><span>{totalOrang} / {totalKamar} Terisi</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {finalMessList.length === 0 && (
                    <div className="col-span-full text-center py-10 text-slate-400 italic">Mess tidak ditemukan.</div>
                )}
            </div>
        )}

        {/* CONTENT KENDARAAN (SPLIT 2) */}
        {activeTab === "VEHICLE" && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4">
                <VehicleTable data={nonMessVehicles} title="KENDARAAN NON-MESS (PRIBADI/OPERASIONAL)" colorTheme="dark" />
                <VehicleTable data={messVehicles} title="KENDARAAN DI LOKASI MESS" colorTheme="light" />
            </div>
        )}

      </div>

      {/* DETAIL MESS MODAL */}
      {selectedMess && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in zoom-in-95 print:hidden">
              <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
                  <div className="bg-slate-800 p-6 flex justify-between items-center text-white shrink-0">
                      <div><h2 className="text-2xl font-black uppercase tracking-tight">{selectedMess.nama_mess}</h2><p className="text-slate-400 text-xs font-bold uppercase">{selectedMess.alamat}</p></div>
                      <button onClick={() => setSelectedMess(null)} className="w-10 h-10 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center transition">✕</button>
                  </div>
                  <div className="p-6 overflow-y-auto bg-slate-50 flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="space-y-4">
                          <h3 className="font-black text-slate-800 text-sm uppercase border-b pb-2 flex justify-between"><span>👥 Daftar Penghuni</span><span className="bg-blue-100 text-blue-600 px-2 rounded text-xs">{residentList.filter(r => r.mess_id === selectedMess.id).length} Orang / {selectedMess.jumlah_kamar} Kamar</span></h3>
                          <div className="space-y-3">
                              {residentList.filter(r => r.mess_id === selectedMess.id).map((res) => (
                                  <div key={res.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center group">
                                      <div className="flex items-center gap-3"><div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs">{res.kamar_no || "?"}</div><div><p className="font-bold text-slate-800 text-sm uppercase">{res.nama_karyawan}</p><p className="text-[10px] text-slate-500">{res.jabatan} • NIK: {res.nik}</p><p className="text-[10px] text-blue-600 font-mono">📞 {res.no_hp}</p></div></div>
                                      {role === 'mess_admin' && <button onClick={() => handleDelete('mess_residents', res.id)} className="text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">🗑️</button>}
                                  </div>
                              ))}
                              {residentList.filter(r => r.mess_id === selectedMess.id).length === 0 && <div className="text-center py-6 text-slate-400 text-xs italic bg-white rounded-xl border border-dashed">Mess Kosong</div>}
                          </div>
                      </div>
                      <div className="space-y-4">
                          <h3 className="font-black text-slate-800 text-sm uppercase border-b pb-2 flex justify-between"><span>🚗 Aset Kendaraan</span><span className="bg-green-100 text-green-600 px-2 rounded text-xs">{vehicleList.filter(v => v.mess_id === selectedMess.id).length} Unit</span></h3>
                          <div className="space-y-3">
                              {vehicleList.filter(v => v.mess_id === selectedMess.id).map((v) => (
                                  <div key={v.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-2">
                                      <div className="flex justify-between items-start"><div className="flex items-center gap-3"><div className="text-2xl">{v.jenis === 'MOBIL' ? '🚙' : '🏍️'}</div><div><p className="font-black text-slate-800 text-xs uppercase">{v.nama_kendaraan} <span className="bg-slate-800 text-white px-1 rounded text-[9px]">{v.plat_nomor}</span></p><p className="text-[10px] text-slate-500">PIC: {v.pic_kendaraan}</p></div></div></div>
                                      <div className="flex gap-2">{getStatusIndicator(v.tgl_service, "Svc")}{getStatusIndicator(v.tgl_ganti_oli, "Oli")}</div>
                                  </div>
                              ))}
                              {vehicleList.filter(v => v.mess_id === selectedMess.id).length === 0 && <div className="text-center py-6 text-slate-400 text-xs italic bg-white rounded-xl border border-dashed">Tidak ada kendaraan.</div>}
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* MODAL FORM (TETAP ADA) */}
      {(showFormMess || showFormVehicle || showFormResident) && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm print:hidden">
              <div className="bg-white w-full max-w-lg p-8 rounded-[2rem] shadow-2xl animate-in slide-in-from-bottom-10">
                  <h3 className="text-xl font-black text-slate-800 mb-6 uppercase border-b pb-4">
                      {showFormMess && (editingMessId ? "Edit Data Mess" : "Tambah Mess Baru")}
                      {showFormVehicle && (editingVehicleId ? "Edit Data Kendaraan" : "Tambah Kendaraan")}
                      {showFormResident && "Tambah Penghuni Mess"}
                  </h3>
                  
                  {/* FORM MESS */}
                  {showFormMess && (
                      <div className="space-y-4">
                          <input className="w-full p-3 bg-slate-50 rounded-xl border text-sm font-bold" placeholder="Nama Mess" value={formMessData.nama} onChange={e => setFormMessData({...formMessData, nama: e.target.value})} />
                          <div className="flex gap-2"><input className="w-2/3 p-3 bg-slate-50 rounded-xl border text-sm font-bold" placeholder="PIC Utama" value={formMessData.pic} onChange={e => setFormMessData({...formMessData, pic: e.target.value})} /><input className="w-1/3 p-3 bg-slate-50 rounded-xl border text-sm font-bold" type="number" placeholder="Jml Kamar" value={formMessData.kamar} onChange={e => setFormMessData({...formMessData, kamar: e.target.value})} /></div>
                          <input className="w-full p-3 bg-slate-50 rounded-xl border text-sm font-bold" placeholder="Alamat Lengkap" value={formMessData.alamat} onChange={e => setFormMessData({...formMessData, alamat: e.target.value})} />
                          <button onClick={handleSaveMess} className="w-full bg-slate-800 text-white py-4 rounded-xl font-black mt-4 hover:bg-black transition shadow-lg">{editingMessId ? "SIMPAN PERUBAHAN" : "SIMPAN DATA MESS"}</button>
                      </div>
                  )}

                  {/* FORM PENGHUNI */}
                  {showFormResident && (
                      <div className="space-y-4">
                          <div><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Pilih Mess</label><select className="w-full p-3 bg-slate-50 rounded-xl border text-sm font-bold focus:border-green-500 outline-none" onChange={e => setFormResidentData({...formResidentData, mess_id: e.target.value})}><option value="">-- Pilih Lokasi Mess --</option>{messList.map(m => <option key={m.id} value={m.id}>📍 {m.nama_mess}</option>)}</select></div>
                          <div className="flex gap-2"><input className="w-2/3 p-3 bg-slate-50 rounded-xl border text-sm font-bold" placeholder="Nama Karyawan" onChange={e => setFormResidentData({...formResidentData, nama: e.target.value})} /><input className="w-1/3 p-3 bg-slate-50 rounded-xl border text-sm font-bold" placeholder="Kamar No." onChange={e => setFormResidentData({...formResidentData, kamar: e.target.value})} /></div>
                          <div className="flex gap-2"><input className="w-1/2 p-3 bg-slate-50 rounded-xl border text-sm font-bold" placeholder="NIK" onChange={e => setFormResidentData({...formResidentData, nik: e.target.value})} /><input className="w-1/2 p-3 bg-slate-50 rounded-xl border text-sm font-bold" placeholder="Jabatan" onChange={e => setFormResidentData({...formResidentData, jabatan: e.target.value})} /></div>
                          <input className="w-full p-3 bg-slate-50 rounded-xl border text-sm font-bold" placeholder="No HP / WA" onChange={e => setFormResidentData({...formResidentData, hp: e.target.value})} />
                          <button onClick={handleAddResident} className="w-full bg-green-600 text-white py-3 rounded-xl font-black mt-4 hover:bg-green-700 transition">SIMPAN PENGHUNI</button>
                      </div>
                  )}

                  {/* FORM KENDARAAN */}
                  {showFormVehicle && (
                      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                          <select className="w-full p-3 bg-slate-50 rounded-xl border text-sm font-bold" value={formVehicleData.mess_id} onChange={e => setFormVehicleData({...formVehicleData, mess_id: e.target.value})}><option value="">-- Tidak di Mess (Pribadi/Operasional) --</option>{messList.map(m => <option key={m.id} value={m.id}>📍 {m.nama_mess}</option>)}</select>
                          <div className="flex gap-2"><select className="w-1/3 p-3 bg-slate-50 rounded-xl border text-sm font-bold" value={formVehicleData.jenis} onChange={e => setFormVehicleData({...formVehicleData, jenis: e.target.value})}><option value="MOBIL">🚙 Mobil</option><option value="MOTOR">🏍️ Motor</option></select><input className="w-2/3 p-3 bg-slate-50 rounded-xl border text-sm font-bold" placeholder="Nama Kendaraan" value={formVehicleData.nama} onChange={e => setFormVehicleData({...formVehicleData, nama: e.target.value})} /></div>
                          <input className="w-full p-3 bg-slate-50 rounded-xl border text-sm font-bold" placeholder="Plat Nomor" value={formVehicleData.plat} onChange={e => setFormVehicleData({...formVehicleData, plat: e.target.value})} />
                          <div className="bg-blue-50 p-3 rounded-xl space-y-2"><p className="text-[10px] font-black text-blue-500 uppercase">PIC:</p><input className="w-full p-2 bg-white rounded-lg border text-xs" placeholder="Nama Pegawai" value={formVehicleData.pic} onChange={e => setFormVehicleData({...formVehicleData, pic: e.target.value})} /><div className="flex gap-2"><input className="w-1/2 p-2 bg-white rounded-lg border text-xs" placeholder="NIK" value={formVehicleData.nik} onChange={e => setFormVehicleData({...formVehicleData, nik: e.target.value})} /><input className="w-1/2 p-2 bg-white rounded-lg border text-xs" placeholder="No HP" value={formVehicleData.kontak} onChange={e => setFormVehicleData({...formVehicleData, kontak: e.target.value})} /></div></div>
                          <div className="bg-yellow-50 p-3 rounded-xl space-y-2"><p className="text-[10px] font-black text-yellow-600 uppercase">Maintenance:</p><div className="grid grid-cols-3 gap-2"><div><label className="text-[9px] font-bold">Pajak</label><input type="date" className="w-full p-1 text-xs rounded border" value={formVehicleData.pajak} onChange={e => setFormVehicleData({...formVehicleData, pajak: e.target.value})} /></div><div><label className="text-[9px] font-bold">Service</label><input type="date" className="w-full p-1 text-xs rounded border" value={formVehicleData.service} onChange={e => setFormVehicleData({...formVehicleData, service: e.target.value})} /></div><div><label className="text-[9px] font-bold">Oli</label><input type="date" className="w-full p-1 text-xs rounded border" value={formVehicleData.oli} onChange={e => setFormVehicleData({...formVehicleData, oli: e.target.value})} /></div></div></div>
                          <button onClick={handleSaveVehicle} className="w-full bg-blue-600 text-white py-3 rounded-xl font-black mt-2 hover:bg-blue-700 transition">{editingVehicleId ? "SIMPAN PERUBAHAN" : "SIMPAN KENDARAAN"}</button>
                      </div>
                  )}

                  <button onClick={() => {setShowFormMess(false); setShowFormVehicle(false); setShowFormResident(false);}} className="w-full text-slate-400 font-bold text-xs mt-4 hover:text-slate-600">BATAL</button>
              </div>
          </div>
      )}

    </div>
  );
}