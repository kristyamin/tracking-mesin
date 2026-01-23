"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function InventoryPage() {
  const router = useRouter();
  const [role, setRole] = useState("");
  const [activeTab, setActiveTab] = useState<"MESS" | "VEHICLE">("MESS");
  const [loading, setLoading] = useState(true);

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

  // --- 1. CEK AKSES & FETCH DATA ---
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

  // --- 2. LOGIKA SEARCH & SORTING ---
  const getFilteredAndSortedVehicles = () => {
      let filtered = vehicleList;
      if (searchTerm) {
          const lowerTerm = searchTerm.toLowerCase();
          filtered = vehicleList.filter(v => 
              v.nama_kendaraan?.toLowerCase().includes(lowerTerm) || 
              v.plat_nomor?.toLowerCase().includes(lowerTerm) ||
              v.pic_kendaraan?.toLowerCase().includes(lowerTerm) ||
              v.mess_locations?.nama_mess?.toLowerCase().includes(lowerTerm)
          );
      }
      return filtered.sort((a, b) => {
          if (!a.mess_id && b.mess_id) return -1;
          if (a.mess_id && !b.mess_id) return 1;
          return new Date(a.tgl_service).getTime() - new Date(b.tgl_service).getTime();
      });
  };

  const finalVehicleList = getFilteredAndSortedVehicles();
  const mobilList = finalVehicleList.filter(v => v.jenis === 'MOBIL');
  const motorList = finalVehicleList.filter(v => v.jenis === 'MOTOR');

  // --- 3. INDIKATOR JADWAL ---
  const getStatusIndicator = (dateString: string, type: string) => {
      if (!dateString) return <span className="text-gray-300 text-[9px] font-mono">--</span>;
      const today = new Date();
      const targetDate = new Date(dateString);
      const diffTime = targetDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded text-[9px] font-black border border-red-200 animate-pulse print:border-none print:text-black print:animate-none">🔴 TELAT {Math.abs(diffDays)} HARI ({type})</span>;
      else if (diffDays <= 7) return <span className="bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded text-[9px] font-black border border-yellow-200 print:border-none print:text-black">🟡 H-{diffDays} ({type})</span>;
      else return <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded text-[9px] font-bold border border-green-200 print:border-none print:text-black">🟢 OK ({type})</span>;
  };

  // --- 4. PREPARE EDIT & ADD FUNCTIONS ---
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

  // --- 5. SAVE & DELETE LOGIC ---
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

  // KOMPONEN TABEL KENDARAAN
  const VehicleTable = ({ data, title, icon }: any) => (
      <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm mb-8 animate-in slide-in-from-right print:shadow-none print:border-black print:rounded-none">
          <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center gap-2 print:bg-white print:border-black">
              <span className="text-xl">{icon}</span>
              <h3 className="font-black text-slate-700 uppercase text-sm tracking-wider">{title} ({data.length})</h3>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                  <thead className="bg-white text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-50 print:text-black print:border-black">
                      <tr>
                          <th className="p-4">Identitas Kendaraan</th>
                          <th className="p-4">Penanggung Jawab</th>
                          <th className="p-4">Lokasi Aset</th>
                          <th className="p-4">Jadwal Maintenance</th>
                          {role === 'mess_admin' && <th className="p-4 text-center print:hidden">Aksi</th>}
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 print:divide-black">
                      {data.map((v: any) => (
                          <tr key={v.id} className={`transition ${!v.mess_locations ? 'bg-yellow-50/30 hover:bg-yellow-50 print:bg-white' : 'hover:bg-blue-50/30 print:bg-white'}`}>
                              <td className="p-4">
                                  <div className="flex items-center gap-2">
                                      {!v.mess_locations && <span className="text-yellow-500 text-xs print:hidden" title="Kendaraan Pribadi/Non-Mess">★</span>}
                                      <div>
                                          <p className="font-black text-slate-800 uppercase text-sm">{v.nama_kendaraan}</p>
                                          <p className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded text-[10px] w-fit tracking-wider mt-1 print:bg-white print:text-black print:border print:border-black">{v.plat_nomor}</p>
                                      </div>
                                  </div>
                              </td>
                              <td className="p-4">
                                  <p className="font-bold text-slate-700 text-xs uppercase">{v.pic_kendaraan || "Tanpa PIC"}</p>
                                  <div className="flex flex-col gap-0.5 mt-1">
                                      <span className="text-[10px] text-slate-400 font-mono bg-slate-50 px-1 rounded w-fit print:bg-white print:text-black">NIK: {v.pic_nik || "-"}</span>
                                      <span className="text-[10px] text-slate-400 print:text-black">📞 {v.pic_kontak || "-"}</span>
                                  </div>
                              </td>
                              <td className="p-4">
                                  {v.mess_locations ? (
                                      <div className="flex items-center gap-1.5"><span className="text-lg print:hidden">🏢</span><div><p className="font-bold text-slate-700 text-xs">{v.mess_locations.nama_mess}</p><p className="text-[9px] text-slate-400 print:text-black">Fasilitas Mess</p></div></div>
                                  ) : (
                                      <div className="flex items-center gap-1.5 opacity-70 print:opacity-100"><span className="text-lg print:hidden">🏠</span><div><p className="font-bold text-yellow-700 text-xs print:text-black">NON-MESS</p><p className="text-[9px] text-yellow-600 print:text-black">Dipegang Pribadi</p></div></div>
                                  )}
                              </td>
                              <td className="p-4 space-y-1">
                                  <div>{getStatusIndicator(v.tgl_service, "Service")}</div>
                                  <div>{getStatusIndicator(v.tgl_ganti_oli, "Ganti Oli")}</div>
                                  <div className="text-[10px] text-slate-400 mt-1 font-mono print:text-black">Pajak: {v.tgl_pajak ? new Date(v.tgl_pajak).toLocaleDateString("id-ID") : "-"}</div>
                              </td>
                              {role === 'mess_admin' && (
                                  <td className="p-4 text-center print:hidden">
                                      <div className="flex justify-center gap-2">
                                          <button onClick={() => openEditVehicle(v)} className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white p-2 rounded-lg transition" title="Edit">✏️</button>
                                          <button onClick={() => handleDelete('mess_vehicles', v.id)} className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white p-2 rounded-lg transition" title="Hapus">🗑️</button>
                                      </div>
                                  </td>
                              )}
                          </tr>
                      ))}
                      {data.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-slate-400 text-xs italic">Tidak ada data.</td></tr>}
                  </tbody>
              </table>
          </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 p-4 md:p-8 print:bg-white print:p-0">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER (Tombol Hilang saat Print) */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 print:mb-4">
            <div>
                <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">INVENTARIS PERUSAHAAN</h1>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">PT DJITOE MESINDO - ASSET MANAGEMENT</p>
                <p className="hidden print:block text-[10px] mt-1 text-slate-400">Dicetak pada: {new Date().toLocaleDateString("id-ID")}</p>
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

        {/* TAB MENU & SEARCH & PRINT (Hilang saat Print) */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 print:hidden">
            <div className="flex gap-2 bg-white p-1 rounded-2xl w-fit shadow-sm border border-slate-200">
                <button onClick={() => setActiveTab("MESS")} className={`px-6 py-3 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'MESS' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
                    🏠 LIST MESS ({messList.length})
                </button>
                <button onClick={() => setActiveTab("VEHICLE")} className={`px-6 py-3 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'VEHICLE' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
                    🚗 LIST KENDARAAN ({vehicleList.length})
                </button>
            </div>

            <div className="flex gap-2 items-center">
                {/* TOMBOL PRINT (BARU) */}
                <button onClick={() => window.print()} className="bg-slate-800 text-white px-4 py-3 rounded-xl text-xs font-bold hover:bg-black transition flex items-center gap-2 shadow-lg">
                    🖨️ <span className="hidden md:inline">PRINT LAPORAN</span>
                </button>

                {activeTab === "VEHICLE" && (
                    <div className="relative w-full md:w-64 animate-in fade-in">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                        <input type="text" placeholder="Cari Mobil / Motor / PIC..." className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-slate-200 font-bold text-slate-700 text-xs focus:outline-none focus:border-blue-500 transition shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                )}
            </div>
        </div>

        {/* === TAB 1: LIST MESS === */}
        {activeTab === "MESS" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in print:grid-cols-2">
                {messList.map((mess) => {
                    const totalMotor = vehicleList.filter(v => v.mess_id === mess.id && v.jenis === 'MOTOR').length;
                    const totalMobil = vehicleList.filter(v => v.mess_id === mess.id && v.jenis === 'MOBIL').length;
                    const totalOrang = residentList.filter(r => r.mess_id === mess.id).length;
                    const totalKamar = mess.jumlah_kamar || 0;
                    const isFull = totalOrang >= totalKamar && totalKamar > 0;

                    return (
                        <div key={mess.id} onClick={() => setSelectedMess(mess)} 
                             className="bg-white rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-300 hover:scale-[1.02] transition-all cursor-pointer group relative overflow-hidden flex flex-col h-full print:shadow-none print:border-black print:rounded-xl">
                            
                            <div className="relative h-32 bg-slate-200 flex items-center justify-center overflow-hidden print:grayscale">
                                <img src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=500&auto=format&fit=crop" 
                                     alt="Mess Building" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent z-10"></div>
                                
                                <div className="absolute bottom-3 left-4 z-20">
                                    <h3 className="text-lg font-black text-white uppercase tracking-tight shadow-black drop-shadow-md">{mess.nama_mess}</h3>
                                    <p className="text-[10px] text-slate-300 font-medium">{mess.alamat || "Alamat belum diisi"}</p>
                                </div>

                                {role === 'mess_admin' && (
                                    <div className="absolute top-3 right-3 z-30 flex gap-2 print:hidden">
                                        <button onClick={(e) => openEditMess(mess, e)} className="w-8 h-8 bg-white/20 backdrop-blur-sm hover:bg-blue-600 hover:text-white rounded-full flex items-center justify-center transition shadow-lg text-white">✏️</button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete('mess_locations', mess.id); }} className="w-8 h-8 bg-white/20 backdrop-blur-sm hover:bg-red-500 hover:text-white rounded-full flex items-center justify-center transition shadow-lg text-white">🗑️</button>
                                    </div>
                                )}
                            </div>

                            <div className="p-5 flex-1 flex flex-col justify-between">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-2 py-1 rounded-lg uppercase print:bg-white print:border print:border-black print:text-black">PIC: {mess.pic_utama}</span>
                                    <div className={`text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1 ${isFull ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'} print:bg-white print:border print:border-black print:text-black`}>
                                        <span>🛏️</span>
                                        <span>{totalOrang} / {totalKamar} Terisi</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 border-t pt-3 border-slate-100 mt-auto">
                                    <div className="text-center bg-blue-50 p-2 rounded-xl print:bg-white print:border print:border-black"><p className="text-[9px] text-blue-400 font-bold uppercase print:text-black">Mobil</p><p className="text-lg font-black text-blue-700 print:text-black">{totalMobil}</p></div>
                                    <div className="text-center bg-green-50 p-2 rounded-xl print:bg-white print:border print:border-black"><p className="text-[9px] text-green-500 font-bold uppercase print:text-black">Motor</p><p className="text-lg font-black text-green-700 print:text-black">{totalMotor}</p></div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}

        {/* === TAB 2: LIST KENDARAAN === */}
        {activeTab === "VEHICLE" && (
            <div className="space-y-8">
                <VehicleTable data={mobilList} title="DATA MOBIL PERUSAHAAN" icon="🚙" />
                <VehicleTable data={motorList} title="DATA MOTOR PERUSAHAAN" icon="🏍️" />
            </div>
        )}

      </div>

      {/* === MODAL DETAIL MESS (HIDDEN WHEN PRINTING) === */}
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

      {/* === MODAL FORM (HIDDEN WHEN PRINTING) === */}
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