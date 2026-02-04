"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

// --- IMPORT COMPONENT ---
import TabIT from "./components/TabIT";
import TabGA from "./components/TabGA";
import TabMess from "./components/TabMess";
import TabVehicle from "./components/TabVehicle";
import TabAPAR from "./components/TabAPAR";
import TabSearch from "./components/TabSearch"; // KOMPONEN BARU

// --- CUSTOM SELECT COMPONENT (MESS) ---
const CustomSelectMess = ({ options, value, onChange, placeholder }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: any) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);
  const selectedItem = options.find((opt: any) => opt.id === value);
  return (
    <div className="relative w-full" ref={wrapperRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-left flex justify-between items-center focus:outline-none focus:border-blue-500 transition"><span className={`text-sm font-bold ${selectedItem ? "text-slate-800" : "text-slate-400"}`}>{selectedItem ? `📍 ${selectedItem.nama_mess}` : placeholder}</span><span className="text-xs text-slate-400">▼</span></button>
      {isOpen && (<div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto animate-in fade-in zoom-in-95">{options.length === 0 ? (<div className="p-3 text-xs text-slate-400 italic text-center">Data Kosong</div>) : (options.map((opt: any) => (<div key={opt.id} onClick={() => { onChange(opt.id); setIsOpen(false); }} className={`p-3 text-sm font-bold cursor-pointer hover:bg-blue-50 transition border-b border-slate-50 last:border-0 ${value === opt.id ? "bg-blue-100 text-blue-700" : "text-slate-700"}`}>📍 {opt.nama_mess}</div>)))}</div>)}
    </div>
  );
};

// --- CUSTOM SELECT STOCK (BARU: BIAR BISA SCROLL 4 ITEM) ---
const CustomSelectStock = ({ options, value, onChange, placeholder }: any) => {
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
        <button onClick={() => setIsOpen(!isOpen)} className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-left flex justify-between items-center focus:outline-none focus:border-blue-500 transition hover:bg-slate-100"><span className={`text-sm font-bold truncate ${selectedItem ? "text-slate-800" : "text-slate-400"}`}>{selectedItem ? `${selectedItem.item_name} (${selectedItem.size})` : placeholder}</span><span className="text-xs text-slate-400">▼</span></button>
        {isOpen && (<div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-40 overflow-y-auto animate-in fade-in zoom-in-95 custom-scrollbar">{options.length === 0 ? (<div className="p-3 text-xs text-slate-400 italic text-center">Stok Kosong</div>) : (options.map((opt: any) => { const isDisabled = opt.total_stock < 1; return (<div key={opt.id} onClick={() => { if(!isDisabled) { onChange(opt.id); setIsOpen(false); } }} className={`p-3 text-sm border-b border-slate-50 last:border-0 flex justify-between items-center transition ${isDisabled ? "bg-gray-50 text-gray-300 cursor-not-allowed" : "cursor-pointer hover:bg-orange-50 text-slate-700 hover:text-orange-700"} ${String(value) === String(opt.id) ? "bg-orange-100 text-orange-800" : ""}`}><span className="font-bold">{opt.item_name} <span className="font-normal text-xs">({opt.size})</span></span><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isDisabled ? 'bg-gray-200' : 'bg-green-100 text-green-700'}`}>{isDisabled ? "HABIS" : `Sisa: ${opt.total_stock}`}</span></div>); }))}</div>)}
      </div>
    );
};

export default function InventoryPage() {
  const router = useRouter();
  const [role, setRole] = useState("");
  // --- DEFAULT TAB: SEARCH (BIAR LANGSUNG KEREN PAS BUKA) ---
  const [activeTab, setActiveTab] = useState<"SEARCH" | "MESS" | "VEHICLE" | "IT" | "UNIFORM" | "APAR">("SEARCH");
  const [loading, setLoading] = useState(true);
  
  // PRINT STATE
  const [isReportMode, setIsReportMode] = useState(false);
  const [reportType, setReportType] = useState<"RESIDENT" | "VEHICLE" | "IT" | "UNIFORM">("RESIDENT");
  const [vehicleReportCategory, setVehicleReportCategory] = useState("");

  // DATA STATE
  const [messList, setMessList] = useState<any[]>([]);
  const [vehicleList, setVehicleList] = useState<any[]>([]);
  const [residentList, setResidentList] = useState<any[]>([]);
  const [itList, setItList] = useState<any[]>([]);
  const [uniformStockList, setUniformStockList] = useState<any[]>([]);
  const [uniformLoanList, setUniformLoanList] = useState<any[]>([]);
  const [aparList, setAparList] = useState<any[]>([]);
  const [employeeList, setEmployeeList] = useState<any[]>([]); // DATA MASTER KARYAWAN

  // VIEW STATE
  const [searchTerm, setSearchTerm] = useState("");

  // MODAL STATE
  const [selectedMess, setSelectedMess] = useState<any>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null); // PENTING BUAT CARD VEHICLE
  
  // MODAL FORM STATE
  const [showFormMess, setShowFormMess] = useState(false); 
  const [showFormVehicle, setShowFormVehicle] = useState(false); 
  const [showFormResident, setShowFormResident] = useState(false);
  const [showFormIT, setShowFormIT] = useState(false);
  const [showFormStock, setShowFormStock] = useState(false);
  const [showFormLoan, setShowFormLoan] = useState(false);
  const [showFormAPAR, setShowFormAPAR] = useState(false);
  
  // IMPORT EXCEL STATE
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState("");

  // RETURN GA STATE
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedLoanToReturn, setSelectedLoanToReturn] = useState<any>(null);
  const [returnCondition, setReturnCondition] = useState<"LAYAK" | "RUSAK">("LAYAK");

  // EDIT STATE IDs
  const [editingMessId, setEditingMessId] = useState<number | null>(null);
  const [editingVehicleId, setEditingVehicleId] = useState<number | null>(null);
  const [editingITId, setEditingITId] = useState<number | null>(null);
  const [editingStockId, setEditingStockId] = useState<number | null>(null);
  const [editingAPARId, setEditingAPARId] = useState<number | null>(null);

  // INPUT STATES
  const [formMessData, setFormMessData] = useState({ nama: "", pic: "", alamat: "", kamar: "", ac: "" });
  const [formVehicleData, setFormVehicleData] = useState({ mess_id: "", jenis: "MOBIL", nama: "", plat: "", pic: "", nik: "", kontak: "", pajak: "", pajak_tahunan: "", service: "", oli: "" });
  const [formResidentData, setFormResidentData] = useState({ mess_id: "", nama: "", nik: "", hp: "", kamar: "", jabatan: "" });
  const [formITData, setFormITData] = useState({ device: "", category: "LAPTOP", status: "TERSEDIA", holder: "", nik: "", dept: "" });
  const [formStockData, setFormStockData] = useState({ item: "", size: "", total: "" });
  const [formLoanData, setFormLoanData] = useState({ employee: "", nik: "", stock_id: "", qty: 1, notes: "" });
  const [formAPARData, setFormAPARData] = useState({ no: "", loc: "", type: "POWDER", kg: "", exp: "", cond: "BAIK" });

  useEffect(() => {
    const userRole = sessionStorage.getItem("user_role");
    if (userRole !== "mess_admin" && userRole !== "mess_viewer") { router.push("/"); } 
    else { setRole(userRole); fetchData(); }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: dataMess } = await supabase.from("mess_locations").select("*").order("nama_mess"); if (dataMess) setMessList(dataMess);
    const { data: dataVehicles } = await supabase.from("mess_vehicles").select("*, mess_locations(nama_mess)").order("tgl_service"); if (dataVehicles) setVehicleList(dataVehicles);
    const { data: dataResidents } = await supabase.from("mess_residents").select("*").order("nama_karyawan"); if (dataResidents) setResidentList(dataResidents);
    const { data: dataIT } = await supabase.from("it_assets").select("*").order("device_name"); if (dataIT) setItList(dataIT);
    const { data: dataStock } = await supabase.from("uniform_stocks").select("*").order("item_name"); if (dataStock) setUniformStockList(dataStock);
    const { data: dataLoan } = await supabase.from("uniform_loans").select("*").order("created_at", { ascending: false }); if (dataLoan) setUniformLoanList(dataLoan);
    const { data: dataAPAR } = await supabase.from("apar_assets").select("*").order("lokasi"); if (dataAPAR) setAparList(dataAPAR);
    const { data: dataEmp } = await supabase.from("company_employees").select("*").order("nama"); if (dataEmp) setEmployeeList(dataEmp);
    setLoading(false);
  };

  const handleRefresh = () => { fetchData(); };
  const formatDateIndo = (dateString: string) => { if (!dateString) return "-"; return new Date(dateString).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }); };
  const getStatusIndicator = (dateString: string, type: string) => {
    if (!dateString) return <span className="text-gray-300 text-[9px] font-mono">--</span>;
    const diffDays = Math.ceil((new Date(dateString).getTime() - new Date().setHours(0,0,0,0)) / (86400000));
    if (diffDays < 0) return <span className="bg-red-600 text-white px-2 py-0.5 rounded text-[9px] font-black animate-pulse shadow-md">🚨 TELAT {Math.abs(diffDays)} HR ({type})</span>;
    else if (diffDays <= 1) return <span className="bg-red-100 text-red-700 border border-red-300 px-2 py-0.5 rounded text-[9px] font-black animate-pulse">🔴 BESOK! ({type})</span>;
    else if (diffDays <= 30) return <span className="bg-orange-100 text-orange-700 border border-orange-300 px-2 py-0.5 rounded text-[9px] font-black">🟠 {diffDays} HR LAGI ({type})</span>;
    else return <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded text-[9px] font-bold border border-green-200">🟢 OK ({type})</span>;
  };

  // PRINT
  const handlePrintResidents = () => { setReportType("RESIDENT"); setIsReportMode(true); setTimeout(() => { window.print(); }, 500); };
  const handlePrintVehicles = (type: string) => { setReportType("VEHICLE"); setVehicleReportCategory(type); setIsReportMode(true); setTimeout(() => { window.print(); }, 500); };
  const handlePrintIT = () => { setReportType("IT"); setIsReportMode(true); setTimeout(() => { window.print(); }, 500); };
  const handlePrintGA = () => { setReportType("UNIFORM"); setIsReportMode(true); setTimeout(() => { window.print(); }, 500); };

  const finalITList = itList.filter(item => { if(!searchTerm) return true; const term = searchTerm.toLowerCase(); return item.device_name?.toLowerCase().includes(term) || item.current_holder?.toLowerCase().includes(term); });
  const finalVehicleList = vehicleList.filter(v => { if(!searchTerm) return true; const term = searchTerm.toLowerCase(); return v.nama_kendaraan?.toLowerCase().includes(term) || v.plat_nomor?.toLowerCase().includes(term); });

  // CRUD GENERIC
  const handleDelete = async (table: string, id: number) => { if (!confirm("⚠️ Yakin hapus data ini selamanya?")) return; await supabase.from(table).delete().eq("id", id); fetchData(); };

  // --- 🔥 FUNGSI SAPU JAGAT (GLOBAL RESIGN) 🔥 ---
  // Digunakan di TabSearch & TabGA
  const handleGlobalResign = async (profile: any) => {
      setLoading(true);
      const name = profile.name;
      // 1. Hapus Master (Jika ada)
      if (profile.id) await supabase.from('company_employees').delete().eq('id', profile.id);
      
      // 2. Hapus dari Mess (Paksa Keluar)
      await supabase.from('mess_residents').delete().match({ nama_karyawan: name });

      // 3. Reset IT (Kembalikan ke Gudang)
      await supabase.from('it_assets').update({ current_holder: null, nik: null, department: null, status: 'TERSEDIA' }).eq('current_holder', name);

      // 4. Reset Kendaraan (Copot PIC)
      await supabase.from('mess_vehicles').update({ pic_kendaraan: null, pic_nik: null, pic_kontak: null }).eq('pic_kendaraan', name);

      // 5. Hapus History GA (Bersih-bersih)
      await supabase.from('uniform_loans').delete().eq('employee_name', name);

      alert(`✅ Selesai! Data Sdr. ${name} telah dibersihkan dari seluruh sistem.`);
      fetchData();
  };

  // --- 🔥 FUNGSI HAPUS KARYAWAN (KHUSUS TAB GA) 🔥 ---
  const handleDeleteEmployee = async (emp: any) => {
      handleGlobalResign(emp); // Kita pakai logika Sapu Jagat juga biar aman
  };

  // --- 🔥 FUNGSI PINDAH MESS (GLOBAL) 🔥 ---
  const handleMoveMess = async (oldId: any, newMessId: string, newKamar: string, name: string) => {
      // Cek apakah sudah ada datanya di mess_residents
      const { data: existing } = await supabase.from('mess_residents').select('id').eq('nama_karyawan', name).single();
      
      if (existing) {
          // Update
          await supabase.from('mess_residents').update({ mess_id: newMessId, kamar_no: newKamar }).eq('id', existing.id);
      } else {
          // Insert Baru (Kalau sebelumnya hantu)
          await supabase.from('mess_residents').insert({ mess_id: newMessId, kamar_no: newKamar, nama_karyawan: name });
      }
      alert("✅ Berhasil pindah mess!");
      fetchData();
  };

  // OPENERS
  const openAddMess = () => { setEditingMessId(null); setFormMessData({ nama: "", pic: "", alamat: "", kamar: "", ac: "" }); setShowFormMess(true); };
  const openEditMess = (mess: any, e: any) => { e.stopPropagation(); setEditingMessId(mess.id); setFormMessData({ nama: mess.nama_mess, pic: mess.pic_utama, alamat: mess.alamat, kamar: mess.jumlah_kamar, ac: mess.tgl_cuci_ac || "" }); setShowFormMess(true); };
  const openAddVehicle = () => { setEditingVehicleId(null); setFormVehicleData({ mess_id: "", jenis: "MOBIL", nama: "", plat: "", pic: "", nik: "", kontak: "", pajak: "", pajak_tahunan: "", service: "", oli: "" }); setShowFormVehicle(true); };
  const openEditVehicle = (vehicle: any, e: any) => { e.stopPropagation(); setEditingVehicleId(vehicle.id); setFormVehicleData({ mess_id: vehicle.mess_id || "", jenis: vehicle.jenis, nama: vehicle.nama_kendaraan, plat: vehicle.plat_nomor, pic: vehicle.pic_kendaraan, nik: vehicle.pic_nik, kontak: vehicle.pic_kontak, pajak: vehicle.tgl_pajak || "", pajak_tahunan: vehicle.tgl_pajak_tahunan || "", service: vehicle.tgl_service || "", oli: vehicle.tgl_ganti_oli || "" }); setShowFormVehicle(true); };
  const openAddIT = () => { setEditingITId(null); setFormITData({ device: "", category: "LAPTOP", status: "TERSEDIA", holder: "", nik: "", dept: "" }); setShowFormIT(true); };
  const openEditIT = (item: any) => { setEditingITId(item.id); setFormITData({ device: item.device_name, category: item.category, status: item.status, holder: item.current_holder || "", nik: item.nik || "", dept: item.department || "" }); setShowFormIT(true); };
  const openAddStock = () => { setEditingStockId(null); setFormStockData({ item: "", size: "", total: "" }); setShowFormStock(true); };
  const openEditStock = (item: any) => { setEditingStockId(item.id); setFormStockData({ item: item.item_name, size: item.size, total: item.total_stock }); setShowFormStock(true); };
  const openLoanForm = (existingName = "", existingNik = "") => { setFormLoanData({ employee: existingName || "", nik: existingNik || "", stock_id: "", qty: 1, notes: "" }); setShowFormLoan(true); };
  const openReturnModal = (loan: any) => { setSelectedLoanToReturn(loan); setReturnCondition("LAYAK"); setShowReturnModal(true); };
  const openAddAPAR = () => { setEditingAPARId(null); setFormAPARData({ no: "", loc: "", type: "POWDER", kg: "", exp: "", cond: "BAIK" }); setShowFormAPAR(true); };
  const openEditAPAR = (item: any) => { setEditingAPARId(item.id); setFormAPARData({ no: item.nomor_tabung, loc: item.lokasi, type: item.jenis, kg: item.berat_kg, exp: item.tgl_exp || "", cond: item.kondisi }); setShowFormAPAR(true); };

  // SAVE HANDLERS
  const handleSaveMess = async () => { if (!formMessData.nama) return alert("Nama Mess Wajib!"); const payload = { nama_mess: formMessData.nama, pic_utama: formMessData.pic, alamat: formMessData.alamat, jumlah_kamar: parseInt(formMessData.kamar) || 0, tgl_cuci_ac: formMessData.ac || null }; if (editingMessId) await supabase.from("mess_locations").update(payload).eq("id", editingMessId); else await supabase.from("mess_locations").insert(payload); alert(editingMessId ? "✅ Data Mess Diperbarui!" : "✅ Mess Baru Ditambahkan!"); setShowFormMess(false); fetchData(); };
  const handleSaveVehicle = async () => { if (!formVehicleData.plat || !formVehicleData.nama) return alert("Nama & Plat Wajib!"); const payload = { mess_id: formVehicleData.mess_id || null, jenis: formVehicleData.jenis, nama_kendaraan: formVehicleData.nama, plat_nomor: formVehicleData.plat, pic_kendaraan: formVehicleData.pic, pic_nik: formVehicleData.nik, pic_kontak: formVehicleData.kontak, tgl_pajak: formVehicleData.pajak || null, tgl_pajak_tahunan: formVehicleData.pajak_tahunan || null, tgl_service: formVehicleData.service || null, tgl_ganti_oli: formVehicleData.oli || null }; if (editingVehicleId) await supabase.from("mess_vehicles").update(payload).eq("id", editingVehicleId); else await supabase.from("mess_vehicles").insert(payload); alert(editingVehicleId ? "✅ Data Kendaraan Diperbarui!" : "✅ Kendaraan Baru Ditambahkan!"); setShowFormVehicle(false); fetchData(); };
  const handleAddResident = async () => { if (!formResidentData.nama || !formResidentData.mess_id) return alert("Nama & Lokasi Mess Wajib!"); const { error } = await supabase.from("mess_residents").insert({ mess_id: formResidentData.mess_id, nama_karyawan: formResidentData.nama, nik: formResidentData.nik, no_hp: formResidentData.hp, kamar_no: formResidentData.kamar, jabatan: formResidentData.jabatan }); if(error) alert("Gagal: " + error.message); else { alert("✅ Penghuni Baru Ditambahkan"); setShowFormResident(false); fetchData(); } };
  const handleSaveIT = async () => { if (!formITData.device) return alert("Nama Perangkat Wajib!"); const payload = { device_name: formITData.device.toUpperCase(), category: formITData.category, status: formITData.status, current_holder: formITData.holder.toUpperCase(), nik: formITData.nik, department: formITData.dept.toUpperCase() }; if (editingITId) await supabase.from("it_assets").update(payload).eq("id", editingITId); else await supabase.from("it_assets").insert(payload); alert("✅ Data IT Saved!"); setShowFormIT(false); fetchData(); };
  const handleSaveStock = async () => { if (!formStockData.item) return alert("Nama Barang Wajib!"); const payload = { item_name: formStockData.item.toUpperCase(), size: formStockData.size.toUpperCase(), total_stock: parseInt(formStockData.total) || 0 }; if (editingStockId) await supabase.from("uniform_stocks").update(payload).eq("id", editingStockId); else await supabase.from("uniform_stocks").insert(payload); alert("✅ Stok Gudang Update!"); setShowFormStock(false); fetchData(); };
  const handleLoanItem = async () => { if (!formLoanData.employee || !formLoanData.stock_id) return alert("Pilih Karyawan & Barang!"); const selectedStock = uniformStockList.find(s => s.id === parseInt(formLoanData.stock_id)); if (!selectedStock) return alert("Barang tidak ditemukan"); if (selectedStock.total_stock < 1) return alert("STOK HABIS!"); const { error } = await supabase.from("uniform_loans").insert({ employee_name: formLoanData.employee.toUpperCase(), employee_nik: formLoanData.nik, stock_id: selectedStock.id, item_name_cached: selectedStock.item_name, size_cached: selectedStock.size, quantity: 1, notes: formLoanData.notes }); if (error) return alert("Gagal Pinjam: " + error.message); await supabase.from("uniform_stocks").update({ total_stock: selectedStock.total_stock - 1 }).eq("id", selectedStock.id); alert("✅ Peminjaman Berhasil Dicatat!"); setShowFormLoan(false); fetchData(); };
  const handleReturnItem = async () => { if (!selectedLoanToReturn) return; await supabase.from("uniform_loans").update({ status: 'DIKEMBALIKAN', return_date: new Date().toISOString(), return_condition: returnCondition }).eq("id", selectedLoanToReturn.id); if (returnCondition === "LAYAK") { const currentStock = uniformStockList.find(s => s.id === selectedLoanToReturn.stock_id); if (currentStock) { await supabase.from("uniform_stocks").update({ total_stock: currentStock.total_stock + 1 }).eq("id", currentStock.id); } } alert("✅ Barang Telah Dikembalikan!"); setShowReturnModal(false); fetchData(); };
  const handleSaveAPAR = async () => { if (!formAPARData.no) return alert("Nomor Tabung Wajib!"); const payload = { nomor_tabung: formAPARData.no.toUpperCase(), lokasi: formAPARData.loc.toUpperCase(), jenis: formAPARData.type, berat_kg: parseFloat(formAPARData.kg) || 0, tgl_exp: formAPARData.exp || null, kondisi: formAPARData.cond }; if (editingAPARId) await supabase.from("apar_assets").update(payload).eq("id", editingAPARId); else await supabase.from("apar_assets").insert(payload); alert("✅ Data APAR Saved!"); setShowFormAPAR(false); fetchData(); };

  const handleProcessImport = async () => {
      if (!importText.trim()) return alert("Data kosong! Paste dulu datanya.");
      const rows = importText.trim().split("\n");
      const cleanData: any[] = [];
      rows.forEach(row => { const cols = row.split("\t"); if (cols.length >= 1) { const nama = cols[0]?.trim().toUpperCase(); const nik = cols[1]?.trim() || ""; const divisi = cols[2]?.trim().toUpperCase() || ""; if (nama) cleanData.push({ nama, nik, divisi }); } });
      if (cleanData.length === 0) return alert("Format salah. Pastikan copy NAMA (Tab) NIK");
      const { error } = await supabase.from("company_employees").insert(cleanData);
      if (error) alert("Gagal Import: " + error.message); else { alert(`✅ Berhasil Import ${cleanData.length} Karyawan!`); setShowImportModal(false); setImportText(""); fetchData(); }
  };

  // --- TAMPILAN UTAMA ---
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 p-4 md:p-8 print:bg-white print:p-0">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 print:mb-4">
            <div><h1 className="text-2xl md:text-3xl font-black text-slate-800 uppercase tracking-tighter text-center md:text-left">GA & HRD CENTER</h1><p className="text-slate-500 font-bold text-[10px] md:text-xs uppercase tracking-widest mt-1 text-center md:text-left">PT DJITOE MESINDO - ASSET & FACILITY</p></div>
            <div className="flex flex-wrap gap-2 justify-center print:hidden">
                <button onClick={handleRefresh} className="bg-slate-100 border border-slate-300 text-slate-600 px-3 py-2 rounded-xl text-[10px] md:text-xs font-bold hover:bg-slate-200 transition flex items-center gap-1 shadow-sm">🔄</button>
                {role === "mess_admin" && (
                  <>
                    <button onClick={openAddMess} className="bg-slate-800 text-white px-3 py-2 rounded-xl text-[10px] md:text-xs font-bold hover:bg-black transition">+ MESS</button>
                    <button onClick={openAddVehicle} className="bg-blue-600 text-white px-3 py-2 rounded-xl text-[10px] md:text-xs font-bold hover:bg-blue-700 transition">+ KENDARAAN</button>
                    <button onClick={() => setShowFormResident(true)} className="bg-green-600 text-white px-3 py-2 rounded-xl text-[10px] md:text-xs font-bold hover:bg-green-700 transition">+ PENGHUNI</button>
                    <button onClick={openAddIT} className="bg-purple-600 text-white px-3 py-2 rounded-xl text-[10px] md:text-xs font-bold hover:bg-purple-700 transition">+ LAPTOP/IT</button>
                    <button onClick={openAddAPAR} className="bg-red-600 text-white px-3 py-2 rounded-xl text-[10px] md:text-xs font-bold hover:bg-red-700 transition">+ APAR</button>
                  </>
                )}
                <button onClick={() => router.push("/")} className="bg-white border border-slate-200 text-slate-500 px-3 py-2 rounded-xl text-[10px] md:text-xs font-bold hover:bg-slate-100 transition">LOGOUT</button>
            </div>
        </div>

        {/* TAB NAVIGATION (SEARCH DI DEPAN) */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 print:hidden">
            <div className="flex gap-2 bg-white p-1 rounded-2xl w-full overflow-x-auto shadow-sm border border-slate-200 no-scrollbar">
                
                {/* 🔍 GLOBAL SEARCH (TAB BARU) */}
                <button onClick={() => { setActiveTab("SEARCH"); setSearchTerm(""); }} className={`flex-1 min-w-[130px] px-4 py-3 rounded-xl text-[10px] md:text-xs font-black uppercase transition-all whitespace-nowrap ${activeTab === 'SEARCH' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>🔍 PENCARIAN</button>
                
                <button onClick={() => { setActiveTab("MESS"); setSearchTerm(""); }} className={`flex-1 min-w-[100px] px-4 py-3 rounded-xl text-[10px] md:text-xs font-black uppercase transition-all whitespace-nowrap ${activeTab === 'MESS' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>🏠 MESS</button>
                <button onClick={() => { setActiveTab("VEHICLE"); setSearchTerm(""); }} className={`flex-1 min-w-[120px] px-4 py-3 rounded-xl text-[10px] md:text-xs font-black uppercase transition-all whitespace-nowrap ${activeTab === 'VEHICLE' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>🚗 KENDARAAN</button>
                <button onClick={() => { setActiveTab("IT"); setSearchTerm(""); }} className={`flex-1 min-w-[100px] px-4 py-3 rounded-xl text-[10px] md:text-xs font-black uppercase transition-all whitespace-nowrap ${activeTab === 'IT' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>💻 IT ASSETS</button>
                <button onClick={() => { setActiveTab("UNIFORM"); setSearchTerm(""); }} className={`flex-1 min-w-[120px] px-4 py-3 rounded-xl text-[10px] md:text-xs font-black uppercase transition-all whitespace-nowrap ${activeTab === 'UNIFORM' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>👕 SERAGAM/GA</button>
                <button onClick={() => { setActiveTab("APAR"); setSearchTerm(""); }} className={`flex-1 min-w-[100px] px-4 py-3 rounded-xl text-[10px] md:text-xs font-black uppercase transition-all whitespace-nowrap ${activeTab === 'APAR' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>🔥 APAR</button>
            </div>
            
            {/* SEARCH BOX HANYA MUNCUL SELAIN TAB SEARCH */}
            {activeTab !== "SEARCH" && (
                <div className="relative w-full md:w-64 animate-in fade-in"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span><input type="text" placeholder="Cari Data..." className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-slate-200 font-bold text-slate-700 text-xs focus:outline-none focus:border-blue-500 transition shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
            )}
        </div>

        {/* --- RENDER COMPONENTS --- */}
        
        {/* 🔥 TAB SEARCH BARU 🔥 */}
        {activeTab === "SEARCH" && (
            <TabSearch 
                employees={employeeList}
                residents={residentList}
                vehicles={vehicleList}
                itAssets={itList}
                loans={uniformLoanList}
                messList={messList}
                role={role}
                onResign={handleGlobalResign}
                onMoveMess={handleMoveMess}
                onReturnGA={openReturnModal} 
                onSwitchTab={(tabName: any) => { setActiveTab(tabName); setSearchTerm(""); }}
            />
        )}

        {activeTab === "MESS" && <TabMess messList={messList} residentList={residentList} role={role} onSelectMess={setSelectedMess} onEdit={openEditMess} onDelete={handleDelete} searchTerm={searchTerm} />}
        {activeTab === "VEHICLE" && <TabVehicle vehicleList={vehicleList} role={role} onSelectVehicle={setSelectedVehicle} onEdit={openEditVehicle} onDelete={handleDelete} onPrint={handlePrintVehicles} searchTerm={searchTerm} />}
        {activeTab === "IT" && <TabIT data={itList} role={role} onAdd={openAddIT} onEdit={openEditIT} onDelete={handleDelete} onPrint={handlePrintIT} searchTerm={searchTerm} />}
        {activeTab === "APAR" && <TabAPAR aparList={aparList} role={role} onAdd={openAddAPAR} onEdit={openEditAPAR} onDelete={handleDelete} searchTerm={searchTerm} />}
        {activeTab === "UNIFORM" && (
            <TabGA 
              stocks={uniformStockList} 
              loans={uniformLoanList} 
              vehicles={vehicleList} 
              itAssets={itList}      
              employees={employeeList}
              role={role} 
              searchTerm={searchTerm} 
              onAddStock={openAddStock} 
              onEditStock={openEditStock} 
              onDelete={handleDelete} 
              onDeleteEmployee={handleDeleteEmployee} // LOGIKA HAPUS YANG BARU
              onLoan={() => openLoanForm()} 
              onAddMore={openLoanForm}
              onReturn={openReturnModal} 
              onPrint={handlePrintGA} 
              onImport={() => setShowImportModal(true)} 
            />
        )}
      </div>

      {/* --- MODAL IMPORT EXCEL --- */}
      {showImportModal && (
          <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center p-4 z-50 backdrop-blur-md animate-in zoom-in-95">
              <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl p-8">
                  <h3 className="text-xl font-black text-slate-800 mb-4 uppercase">📥 IMPORT DATA KARYAWAN</h3>
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 text-xs text-blue-700 mb-4">
                      <p className="font-bold mb-2">CARA PENGGUNAAN:</p>
                      <ol className="list-decimal list-inside space-y-1">
                          <li>Buka Excel Data Karyawan.</li>
                          <li>Copy Kolom <strong>NAMA</strong> dan <strong>NIK</strong> dan <strong>DIVISI</strong> (Opsional).</li>
                          <li>Paste ke kolom di bawah ini.</li>
                          <li>Klik tombol IMPORT.</li>
                      </ol>
                  </div>
                  <textarea 
                      className="w-full h-40 p-4 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder={`Contoh:\nBUDI SANTOSO\t12345\tPRODUKSI\nSITI AMINAH\t67890\tHRD`}
                      value={importText}
                      onChange={(e) => setImportText(e.target.value)}
                  />
                  <div className="flex gap-2">
                      <button onClick={handleProcessImport} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-black hover:bg-blue-700 transition">IMPORT SEKARANG</button>
                      <button onClick={() => { setShowImportModal(false); setImportText(""); }} className="flex-1 bg-slate-200 text-slate-600 py-3 rounded-xl font-black hover:bg-slate-300 transition">BATAL</button>
                  </div>
              </div>
          </div>
      )}

      {/* --- MODAL DETAIL MESS & VEHICLE (VERSI ASLI LAMA) --- */}
      {selectedMess && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in zoom-in-95 print:hidden">
              <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
                  <div className="bg-slate-800 p-4 md:p-6 flex justify-between items-center text-white shrink-0"><div><h2 className="text-lg md:text-2xl font-black uppercase tracking-tight">{selectedMess.nama_mess}</h2><p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase">{selectedMess.alamat}</p></div><button onClick={() => setSelectedMess(null)} className="w-8 h-8 md:w-10 md:h-10 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center transition">✕</button></div>
                  <div className="p-4 md:p-6 overflow-y-auto bg-slate-50 flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                      <div className="space-y-4">
                          <h3 className="font-black text-slate-800 text-sm uppercase border-b pb-2 flex justify-between"><span>👥 Daftar Penghuni</span><span className="bg-blue-100 text-blue-600 px-2 rounded text-xs">{residentList.filter(r => r.mess_id === selectedMess.id).length} / {selectedMess.jumlah_kamar} Kamar</span></h3>
                          <div className="space-y-3">{residentList.filter(r => r.mess_id === selectedMess.id).map((res) => (<div key={res.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center group hover:border-blue-400 transition"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-black text-xs shrink-0 border border-blue-100">{res.kamar_no || "?"}</div><div><p className="font-black text-slate-800 text-xs md:text-sm uppercase">{res.nama_karyawan}</p><div className="flex flex-wrap gap-x-3 gap-y-1 mt-1"><span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">💼 {res.jabatan || "Staff"}</span><span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">📞 {res.no_hp || "-"}</span></div><p className="text-[9px] text-slate-400 font-mono mt-1">NIK: {res.nik || "-"}</p></div></div>{role === 'mess_admin' && (<button onClick={() => handleDelete('mess_residents', res.id)} className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition opacity-100 md:opacity-0 md:group-hover:opacity-100">🗑️</button>)}</div>))}{residentList.filter(r => r.mess_id === selectedMess.id).length === 0 && <div className="text-center py-6 text-slate-400 text-xs italic bg-white rounded-xl border border-dashed">Mess Kosong</div>}</div>
                      </div>
                      <div className="space-y-4">
                          <h3 className="font-black text-slate-800 text-sm uppercase border-b pb-2 flex justify-between"><span>🚗 Aset Kendaraan</span><span className="bg-green-100 text-green-600 px-2 rounded text-xs">{vehicleList.filter(v => v.mess_id === selectedMess.id).length} Unit</span></h3>
                          <div className="space-y-3">{vehicleList.filter(v => v.mess_id === selectedMess.id).map((v) => (<div key={v.id} onClick={() => setSelectedVehicle(v)} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-2 cursor-pointer hover:border-blue-400"><div className="flex justify-between items-start"><div className="flex items-center gap-3"><div className="text-xl">{v.jenis === 'MOBIL' ? '🚙' : '🏍️'}</div><div><p className="font-black text-slate-800 text-xs uppercase">{v.nama_kendaraan} <span className="bg-slate-800 text-white px-1 rounded text-[9px]">{v.plat_nomor}</span></p></div></div></div><div className="flex gap-2 flex-wrap">{getStatusIndicator(v.tgl_service, "Svc")}{getStatusIndicator(v.tgl_pajak, "5Th")}</div></div>))}{vehicleList.filter(v => v.mess_id === selectedMess.id).length === 0 && <div className="text-center py-6 text-slate-400 text-xs italic bg-white rounded-xl border border-dashed">Tidak ada kendaraan.</div>}</div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {selectedVehicle && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in zoom-in-95 print:hidden">
              <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
                  <div className="bg-blue-600 p-6 text-white text-center relative"><div className="text-5xl mb-2">{selectedVehicle.jenis === 'MOBIL' ? '🚙' : '🏍️'}</div><h2 className="text-2xl font-black uppercase tracking-tight">{selectedVehicle.nama_kendaraan}</h2><span className="bg-white/20 px-3 py-1 rounded-full text-sm font-bold mt-2 inline-block">{selectedVehicle.plat_nomor}</span><button onClick={() => setSelectedVehicle(null)} className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center transition">✕</button></div>
                  <div className="p-6 bg-slate-50 space-y-6">
                      <div className="grid grid-cols-2 gap-4 text-center"><div className="bg-white p-3 rounded-xl border border-slate-200"><p className="text-[10px] uppercase font-bold text-slate-400">Lokasi</p><p className="font-bold text-slate-800 text-xs">{selectedVehicle.mess_locations ? selectedVehicle.mess_locations.nama_mess : "NON-MESS"}</p></div><div className="bg-white p-3 rounded-xl border border-slate-200"><p className="text-[10px] uppercase font-bold text-slate-400">PIC</p><p className="font-bold text-slate-800 text-xs">{selectedVehicle.pic_kendaraan || "-"}</p></div></div>
                      <div className="space-y-3">
                          <h3 className="font-black text-slate-700 text-xs uppercase border-b pb-2">📅 Jadwal Perawatan & Pajak</h3>
                          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                              <div className="flex justify-between items-center border-b border-dashed pb-2"><span className="text-xs font-bold text-slate-500">Service Rutin</span><div className="text-right"><span className="block font-black text-slate-800 text-sm">{formatDateIndo(selectedVehicle.tgl_service)}</span>{getStatusIndicator(selectedVehicle.tgl_service, "SVC")}</div></div>
                              <div className="flex justify-between items-center border-b border-dashed pb-2"><span className="text-xs font-bold text-slate-500">Ganti Oli</span><div className="text-right"><span className="block font-black text-slate-800 text-sm">{formatDateIndo(selectedVehicle.tgl_ganti_oli)}</span>{getStatusIndicator(selectedVehicle.tgl_ganti_oli, "OLI")}</div></div>
                              <div className="flex justify-between items-center border-b border-dashed pb-2"><span className="text-xs font-bold text-slate-500">Pajak Tahunan (STNK)</span><div className="text-right"><span className="block font-black text-slate-800 text-sm">{formatDateIndo(selectedVehicle.tgl_pajak_tahunan)}</span>{getStatusIndicator(selectedVehicle.tgl_pajak_tahunan, "1 TH")}</div></div>
                              <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-500">Pajak 5 Thn (Kaleng)</span><div className="text-right"><span className="block font-black text-slate-800 text-sm">{formatDateIndo(selectedVehicle.tgl_pajak)}</span>{getStatusIndicator(selectedVehicle.tgl_pajak, "5 TH")}</div></div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- MODAL RETURN ITEM --- */}
      {showReturnModal && selectedLoanToReturn && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white w-full max-w-sm p-6 rounded-[2rem] shadow-2xl animate-in zoom-in-95">
                <h3 className="text-xl font-black text-slate-800 mb-2 uppercase text-center">Pengembalian Barang</h3>
                <div className="bg-orange-50 p-4 rounded-xl text-center mb-6"><p className="font-bold text-orange-800 text-sm uppercase">{selectedLoanToReturn.item_name_cached}</p><p className="text-xs text-orange-600">Peminjam: {selectedLoanToReturn.employee_name}</p></div>
                <p className="text-xs font-bold text-slate-400 uppercase mb-2 text-center">Bagaimana kondisi barang?</p>
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div onClick={() => setReturnCondition("LAYAK")} className={`p-4 rounded-xl border-2 cursor-pointer text-center transition ${returnCondition === 'LAYAK' ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-100 text-slate-400'}`}><div className="text-2xl mb-1">✨</div><p className="font-black text-xs uppercase">Layak Pakai</p><p className="text-[9px] mt-1">(Stok Gudang +1)</p></div>
                    <div onClick={() => setReturnCondition("RUSAK")} className={`p-4 rounded-xl border-2 cursor-pointer text-center transition ${returnCondition === 'RUSAK' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-100 text-slate-400'}`}><div className="text-2xl mb-1">🗑️</div><p className="font-black text-xs uppercase">Rusak / Hilang</p><p className="text-[9px] mt-1">(Dibuang)</p></div>
                </div>
                <button onClick={handleReturnItem} className="w-full bg-slate-800 text-white py-3 rounded-xl font-black hover:bg-black transition">KONFIRMASI PENGEMBALIAN</button>
                <button onClick={() => setShowReturnModal(false)} className="w-full text-slate-400 font-bold text-xs mt-3 py-2">BATAL</button>
            </div>
          </div>
      )}

      {/* --- MODAL INPUT FORM (GABUNGAN SEMUA) --- */}
      {(showFormMess || showFormVehicle || showFormResident || showFormIT || showFormStock || showFormLoan || showFormAPAR) && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm print:hidden">
              <div className="bg-white w-full max-w-lg p-6 md:p-8 rounded-[2rem] shadow-2xl animate-in slide-in-from-bottom-10 max-h-[90vh] overflow-y-auto custom-scrollbar">
                  <h3 className="text-lg md:text-xl font-black text-slate-800 mb-6 uppercase border-b pb-4">
                      {showFormMess && (editingMessId ? "Edit Data Mess" : "Tambah Mess Baru")}
                      {showFormVehicle && (editingVehicleId ? "Edit Data Kendaraan" : "Tambah Kendaraan")}
                      {showFormResident && "Tambah Penghuni Mess"}
                      {showFormIT && (editingITId ? "Edit Aset IT" : "Tambah Aset IT")}
                      {showFormStock && (editingStockId ? "Edit Stok Gudang" : "Tambah Stok Baru")}
                      {showFormLoan && "Form Peminjaman GA"}
                      {showFormAPAR && (editingAPARId ? "Edit Data APAR" : "Tambah APAR Baru")}
                  </h3>
                  
                  {showFormMess && (<div className="space-y-4"><input className="w-full p-3 bg-slate-50 rounded-xl border text-sm font-bold" placeholder="Nama Mess" value={formMessData.nama} onChange={e => setFormMessData({...formMessData, nama: e.target.value})} /><div className="flex gap-2"><input className="w-2/3 p-3 bg-slate-50 rounded-xl border text-sm font-bold" placeholder="PIC Utama" value={formMessData.pic} onChange={e => setFormMessData({...formMessData, pic: e.target.value})} /><input className="w-1/3 p-3 bg-slate-50 rounded-xl border text-sm font-bold" type="number" placeholder="Jml Kamar" value={formMessData.kamar} onChange={e => setFormMessData({...formMessData, kamar: e.target.value})} /></div><input className="w-full p-3 bg-slate-50 rounded-xl border text-sm font-bold" placeholder="Alamat Lengkap" value={formMessData.alamat} onChange={e => setFormMessData({...formMessData, alamat: e.target.value})} /><div className="bg-teal-50 p-3 rounded-xl border border-teal-100"><label className="text-[10px] font-black text-teal-600 uppercase ml-1 mb-1 block">Jadwal Cuci AC Berikutnya</label><input type="date" className="w-full p-2 bg-white rounded-lg border text-sm font-bold text-slate-700" value={formMessData.ac} onChange={e => setFormMessData({...formMessData, ac: e.target.value})} /></div><button onClick={handleSaveMess} className="w-full bg-slate-800 text-white py-4 rounded-xl font-black mt-4 hover:bg-black transition shadow-lg">{editingMessId ? "SIMPAN PERUBAHAN" : "SIMPAN DATA MESS"}</button></div>)}
                  
                  {showFormVehicle && (<div className="space-y-3"><div><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Lokasi Kendaraan</label><CustomSelectMess options={[{id: "", nama_mess: "Tidak di Mess (Pribadi/Operasional)"}, ...messList]} value={formVehicleData.mess_id} onChange={(val: any) => setFormVehicleData({...formVehicleData, mess_id: val})} placeholder="-- Pilih Lokasi --" /></div><div className="flex gap-2"><div className="w-1/3 relative"><select className="w-full p-3 bg-slate-50 rounded-xl border text-sm font-bold appearance-none cursor-pointer" value={formVehicleData.jenis} onChange={e => setFormVehicleData({...formVehicleData, jenis: e.target.value})}><option value="MOBIL">🚙 Mobil</option><option value="MOTOR">🏍️ Motor</option></select><div className="absolute right-3 top-3 pointer-events-none text-xs">▼</div></div><input className="w-2/3 p-3 bg-slate-50 rounded-xl border text-sm font-bold" placeholder="Nama Kendaraan" value={formVehicleData.nama} onChange={e => setFormVehicleData({...formVehicleData, nama: e.target.value})} /></div><input className="w-full p-3 bg-slate-50 rounded-xl border text-sm font-bold" placeholder="Plat Nomor" value={formVehicleData.plat} onChange={e => setFormVehicleData({...formVehicleData, plat: e.target.value})} /><div className="bg-blue-50 p-3 rounded-xl space-y-2"><p className="text-[10px] font-black text-blue-500 uppercase">PIC:</p><input className="w-full p-2 bg-white rounded-lg border text-xs" placeholder="Nama Pegawai" value={formVehicleData.pic} onChange={e => setFormVehicleData({...formVehicleData, pic: e.target.value})} /><div className="flex gap-2"><input className="w-1/2 p-2 bg-white rounded-lg border text-xs" placeholder="NIK" value={formVehicleData.nik} onChange={e => setFormVehicleData({...formVehicleData, nik: e.target.value})} /><input className="w-1/2 p-2 bg-white rounded-lg border text-xs" placeholder="No HP" value={formVehicleData.kontak} onChange={e => setFormVehicleData({...formVehicleData, kontak: e.target.value})} /></div></div><div className="bg-yellow-50 p-3 rounded-xl space-y-2"><p className="text-[10px] font-black text-yellow-600 uppercase">Maintenance & Pajak:</p><div className="grid grid-cols-2 gap-2"><div><label className="text-[9px] font-bold text-slate-500">Pajak Tahunan (STNK)</label><input type="date" className="w-full p-1 text-xs rounded border border-yellow-200" value={formVehicleData.pajak_tahunan} onChange={e => setFormVehicleData({...formVehicleData, pajak_tahunan: e.target.value})} /></div><div><label className="text-[9px] font-bold text-slate-500">Pajak 5 Thn (Kaleng)</label><input type="date" className="w-full p-1 text-xs rounded border border-yellow-200" value={formVehicleData.pajak} onChange={e => setFormVehicleData({...formVehicleData, pajak: e.target.value})} /></div><div><label className="text-[9px] font-bold text-slate-500">Service Rutin</label><input type="date" className="w-full p-1 text-xs rounded border border-yellow-200" value={formVehicleData.service} onChange={e => setFormVehicleData({...formVehicleData, service: e.target.value})} /></div><div><label className="text-[9px] font-bold text-slate-500">Ganti Oli</label><input type="date" className="w-full p-1 text-xs rounded border border-yellow-200" value={formVehicleData.oli} onChange={e => setFormVehicleData({...formVehicleData, oli: e.target.value})} /></div></div></div><button onClick={handleSaveVehicle} className="w-full bg-blue-600 text-white py-3 rounded-xl font-black mt-2 hover:bg-blue-700 transition">{editingVehicleId ? "SIMPAN PERUBAHAN" : "SIMPAN KENDARAAN"}</button></div>)}
                  {showFormResident && (<div className="space-y-4"><div><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Pilih Mess</label><CustomSelectMess options={messList} value={formResidentData.mess_id} onChange={(val: any) => setFormResidentData({...formResidentData, mess_id: val})} placeholder="-- Pilih Lokasi Mess --" /></div><div className="flex gap-2"><input className="w-2/3 p-3 bg-slate-50 rounded-xl border text-sm font-bold" placeholder="Nama Karyawan" onChange={e => setFormResidentData({...formResidentData, nama: e.target.value})} /><input className="w-1/3 p-3 bg-slate-50 rounded-xl border text-sm font-bold" placeholder="Kamar No." onChange={e => setFormResidentData({...formResidentData, kamar: e.target.value})} /></div><div className="flex gap-2"><input className="w-1/2 p-3 bg-slate-50 rounded-xl border text-sm font-bold" placeholder="NIK" onChange={e => setFormResidentData({...formResidentData, nik: e.target.value})} /><input className="w-1/2 p-3 bg-slate-50 rounded-xl border text-sm font-bold" placeholder="Jabatan" onChange={e => setFormResidentData({...formResidentData, jabatan: e.target.value})} /></div><input className="w-full p-3 bg-slate-50 rounded-xl border text-sm font-bold" placeholder="No HP / WA" onChange={e => setFormResidentData({...formResidentData, hp: e.target.value})} /><button onClick={handleAddResident} className="w-full bg-green-600 text-white py-3 rounded-xl font-black mt-4 hover:bg-green-700 transition">SIMPAN PENGHUNI</button></div>)}
                  {showFormIT && (<div className="space-y-4"><input className="w-full p-3 bg-slate-50 rounded-xl border text-sm font-bold uppercase" placeholder="Nama Perangkat (Ex: Laptop Dell)" value={formITData.device} onChange={e => setFormITData({...formITData, device: e.target.value})} /><div className="flex gap-2"><select className="w-1/2 p-3 bg-slate-50 rounded-xl border text-sm font-bold" value={formITData.category} onChange={e => setFormITData({...formITData, category: e.target.value})}><option value="LAPTOP">Laptop</option><option value="KOMPUTER">Komputer</option><option value="HP">Handphone</option><option value="TABLET">Tablet</option><option value="PRINTER">Printer</option></select><select className="w-1/2 p-3 bg-slate-50 rounded-xl border text-sm font-bold" value={formITData.status} onChange={e => setFormITData({...formITData, status: e.target.value})}><option value="TERSEDIA">🟢 Tersedia</option><option value="DIPAKAI">🔵 Dipakai</option><option value="RUSAK">🔴 Rusak</option></select></div><input className="w-full p-3 bg-slate-50 rounded-xl border text-sm font-bold uppercase" placeholder="Nama Pengguna" value={formITData.holder} onChange={e => setFormITData({...formITData, holder: e.target.value})} /><div className="flex gap-2"><input className="w-1/2 p-3 bg-slate-50 rounded-xl border text-sm font-bold" placeholder="NIK" value={formITData.nik} onChange={e => setFormITData({...formITData, nik: e.target.value})} /><input className="w-1/2 p-3 bg-slate-50 rounded-xl border text-sm font-bold uppercase" placeholder="Divisi" value={formITData.dept} onChange={e => setFormITData({...formITData, dept: e.target.value})} /></div><button onClick={handleSaveIT} className="w-full bg-purple-600 text-white py-3 rounded-xl font-black mt-2 hover:bg-purple-700 transition">SIMPAN DATA IT</button></div>)}
                  {showFormStock && (<div className="space-y-4"><input className="w-full p-3 bg-slate-50 rounded-xl border text-sm font-bold uppercase" placeholder="Nama Barang (Ex: Kemeja Lapangan)" value={formStockData.item} onChange={e => setFormStockData({...formStockData, item: e.target.value})} /><div className="flex gap-2"><input className="w-1/2 p-3 bg-slate-50 rounded-xl border text-sm font-bold uppercase" placeholder="Size (L, XL, 42)" value={formStockData.size} onChange={e => setFormStockData({...formStockData, size: e.target.value})} /><input className="w-1/2 p-3 bg-slate-50 rounded-xl border text-sm font-bold" type="number" placeholder="Total Stok" value={formStockData.total} onChange={e => setFormStockData({...formStockData, total: e.target.value})} /></div><button onClick={handleSaveStock} className="w-full bg-slate-800 text-white py-3 rounded-xl font-black mt-2 hover:bg-black transition">SIMPAN STOK</button></div>)}
                  {showFormAPAR && (<div className="space-y-4"><input className="w-full p-3 bg-slate-50 rounded-xl border text-sm font-bold uppercase" placeholder="Nomor Tabung (APAR-01)" value={formAPARData.no} onChange={e => setFormAPARData({...formAPARData, no: e.target.value})} /><input className="w-full p-3 bg-slate-50 rounded-xl border text-sm font-bold uppercase" placeholder="Lokasi Penempatan" value={formAPARData.loc} onChange={e => setFormAPARData({...formAPARData, loc: e.target.value})} /><div className="flex gap-2"><select className="w-1/2 p-3 bg-slate-50 rounded-xl border text-sm font-bold" value={formAPARData.type} onChange={e => setFormAPARData({...formAPARData, type: e.target.value})}><option value="POWDER">POWDER</option><option value="CO2">CO2</option><option value="FOAM">FOAM</option></select><input className="w-1/2 p-3 bg-slate-50 rounded-xl border text-sm font-bold" type="number" placeholder="Berat (KG)" value={formAPARData.kg} onChange={e => setFormAPARData({...formAPARData, kg: e.target.value})} /></div><div className="flex gap-2 items-center"><div className="w-1/2 bg-slate-50 p-2 rounded-xl border border-slate-200"><label className="text-[9px] font-bold text-slate-400 block mb-1">Expired Date</label><input type="date" className="w-full bg-transparent text-sm font-bold" value={formAPARData.exp} onChange={e => setFormAPARData({...formAPARData, exp: e.target.value})} /></div><select className="w-1/2 p-3 bg-slate-50 rounded-xl border text-sm font-bold" value={formAPARData.cond} onChange={e => setFormAPARData({...formAPARData, cond: e.target.value})}><option value="BAIK">✓ BAIK</option><option value="KURANG TEKANAN">⚠ KURANG TEKANAN</option><option value="RUSAK">❌ RUSAK</option></select></div><button onClick={handleSaveAPAR} className="w-full bg-red-600 text-white py-3 rounded-xl font-black mt-2 hover:bg-red-700 transition">SIMPAN DATA APAR</button></div>)}

                  {showFormLoan && (
                      <div className="space-y-4">
                          <input className="w-full p-3 bg-slate-50 rounded-xl border text-sm font-bold uppercase" placeholder="Nama Karyawan Peminjam" value={formLoanData.employee} onChange={e => setFormLoanData({...formLoanData, employee: e.target.value})} />
                          <input className="w-full p-3 bg-slate-50 rounded-xl border text-sm font-bold" placeholder="NIK Karyawan" value={formLoanData.nik} onChange={e => setFormLoanData({...formLoanData, nik: e.target.value})} />
                          <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Pilih Barang dari Gudang</label>
                            {/* DROPDOWN CUSTOM BARU DI SINI */}
                            <CustomSelectStock 
                                options={uniformStockList} 
                                value={formLoanData.stock_id} 
                                onChange={(val: any) => setFormLoanData({...formLoanData, stock_id: val})} 
                                placeholder="-- Pilih Barang --" 
                            />
                          </div>
                          <input className="w-full p-3 bg-slate-50 rounded-xl border text-sm font-bold" placeholder="Catatan (Opsional)" value={formLoanData.notes} onChange={e => setFormLoanData({...formLoanData, notes: e.target.value})} />
                          <button onClick={handleLoanItem} className="w-full bg-orange-600 text-white py-3 rounded-xl font-black mt-2 hover:bg-orange-700 transition">CATAT PEMINJAMAN</button>
                      </div>
                  )}

                  <button onClick={() => {setShowFormMess(false); setShowFormVehicle(false); setShowFormResident(false); setShowFormIT(false); setShowFormStock(false); setShowFormLoan(false); setShowFormAPAR(false); setShowImportModal(false);}} className="w-full text-slate-400 font-bold text-xs mt-4 hover:text-slate-600 py-2">BATAL</button>
              </div>
          </div>
      )}
    </div>
  );
}