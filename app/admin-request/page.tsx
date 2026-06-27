"use client";

import React, { useState, useEffect, Fragment } from "react";
import { useRouter } from "next/navigation";

export default function AdminRequestDashboard() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrint, setSelectedPrint] = useState<any>(null);

  // State Modal Assign Mekanik
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [mechanicName, setMechanicName] = useState("");
  const [mechanicNik, setMechanicNik] = useState("");
  const [assignDate, setAssignDate] = useState(""); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State Modal Edit Waktu & Mekanik
  const [isEditTimeModalOpen, setIsEditTimeModalOpen] = useState(false);
  const [editScheduledDate, setEditScheduledDate] = useState(""); 
  const [editCompletedAt, setEditCompletedAt] = useState("");
  const [editMechanicName, setEditMechanicName] = useState("");
  const [editMechanicNik, setEditMechanicNik] = useState("");
  
  const [printMode, setPrintMode] = useState<'TICKET' | 'REPORT' | null>(null);

  // ==========================================
  // 📅 LOGIK FILTER BULAN & TAHUN DINAMIS
  // ==========================================
  const currentYearNum = new Date().getFullYear();
  const currentMonthStr = (new Date().getMonth() + 1).toString().padStart(2, '0');
  
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [selectedYear, setSelectedYear] = useState(currentYearNum.toString());
  const [searchQuery, setSearchQuery] = useState(""); 
  const [activeCard, setActiveCard] = useState<string | null>(null);

  const startYear = 2026;
  const endYear = currentYearNum + 4;
  const yearsOptions = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);
  const monthsOptions = [
    { value: 'ALL', label: 'SEMUA BULAN' },
    { value: '01', label: 'Januari' }, { value: '02', label: 'Februari' }, { value: '03', label: 'Maret' },
    { value: '04', label: 'April' }, { value: '05', label: 'Mei' }, { value: '06', label: 'Juni' },
    { value: '07', label: 'Juli' }, { value: '08', label: 'Agustus' }, { value: '09', label: 'September' },
    { value: '10', label: 'Oktober' }, { value: '11', label: 'November' }, { value: '12', label: 'Desember' }
  ];

  // ==========================================
  // 🕵️‍♂️ MATA-MATA NINJA & CEK AKSES
  // ==========================================
  useEffect(() => {
    const role = sessionStorage.getItem("user_role");
    if (!role || (role !== "admin" && role !== "super_admin" && role !== "boss" && role !== "request_admin")) {
      alert("Akses Ditolak! Silakan login terlebih dahulu.");
      router.push("/");
    } else {
      // 1. Tarik data pertama kali buka web (muncul loading)
      fetchRequests(); 

      // 2. Jurus Ninja: Auto-Refresh diam-diam setiap 15 detik!
      const intervalId = setInterval(() => {
        fetchRequests(true); // true = mode ninja (tanpa loading UI)
      }, 15000); // 15000 milidetik = 15 detik

      // 3. Bersihkan memori timer kalau admin logout/pindah halaman
      return () => clearInterval(intervalId); 
    }
  }, []);

  const isToday = (dateString: string) => {
    if (!dateString) return false;
    const d = new Date(dateString);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  };

  const fetchRequests = async (isBackground = false) => {
    // Kalau background, jangan munculin tulisan "Loading Data..." biar layar gak kedip
    if (!isBackground) setLoading(true); 
    try {
      // 🚨 MANTRA ANTI-BASI: Tambahkan cache: 'no-store' dan parameter waktu!
      const response = await fetch(`/api/get-requests?t=${new Date().getTime()}`, { 
        cache: 'no-store' 
      });
      
      const result = await response.json();
      if (response.ok && result.data) setRequests(result.data);
    } catch (error) {
      console.error("Gagal memuat data", error);
    }
    if (!isBackground) setLoading(false);
  };

  // ==========================================
  // 🧠 LOGIKA STATUS CERDAS (AUTO-START)
  // ==========================================
  const getDerivedStatus = (item: any) => {
    if (item.status === 'New Request') return 'WAITING';
    if (item.status === 'Done') return 'DONE';
    
    const targetDateStr = item.scheduled_date || item.assigned_at;
    if (!targetDateStr) return 'WAITING';

    const today = new Date();
    today.setHours(0,0,0,0);
    
    const targetDate = new Date(targetDateStr);
    targetDate.setHours(0,0,0,0);
    
    if (targetDate > today) return 'SCHEDULED';
    return 'PROGRESS';
  };

  // --- HITUNG STATISTIK ---
   const stats = {
    today: requests.filter(item => isToday(item.created_at)).length,
    waiting: requests.filter(item => getDerivedStatus(item) === 'WAITING').length,
    scheduled: requests.filter(item => getDerivedStatus(item) === 'SCHEDULED').length,
    inProgress: requests.filter(item => getDerivedStatus(item) === 'PROGRESS').length,
    done: requests.filter(item => getDerivedStatus(item) === 'DONE').length,
  };

 // ==========================================
  // 🚨 SISTEM HUTANG KERJA & PENYARING
  // ==========================================
  const filteredRequests = requests.filter(item => {
    let matchCard = true; 
    const derivedStatus = getDerivedStatus(item);
    
    if (activeCard === 'TODAY') matchCard = isToday(item.created_at);
    if (activeCard === 'WAITING') matchCard = derivedStatus === 'WAITING';
    if (activeCard === 'SCHEDULED') matchCard = derivedStatus === 'SCHEDULED';
    if (activeCard === 'PROGRESS') matchCard = derivedStatus === 'PROGRESS';
    if (activeCard === 'DONE') matchCard = derivedStatus === 'DONE';

    // LOGIKA TAHUN (BERLAKU UNTUK SEMUA DATA)
    const date = new Date(item.created_at);
    const itemYear = date.getFullYear().toString();
    const matchYear = selectedYear === 'ALL' || itemYear === selectedYear;

    // LOGIKA BULAN (HANYA BERLAKU UNTUK STATUS SELESAI)
    // Kalau belum selesai, Bulan diabaikan (tetap muncul sebagai hutang kerja)
    let matchMonth = true;
    if (derivedStatus === 'DONE') {
      const itemMonth = (date.getMonth() + 1).toString().padStart(2, '0');
      matchMonth = selectedMonth === 'ALL' || itemMonth === selectedMonth;
    }

    const searchLower = searchQuery.toLowerCase();
    const matchSearch = item.id.toLowerCase().includes(searchLower) || (item.mechanic_name && item.mechanic_name.toLowerCase().includes(searchLower)) || item.customer_name.toLowerCase().includes(searchLower);

    return matchCard && matchYear && matchMonth && matchSearch;
  });

  // ==========================================
  // 📅 MENGELOMPOKKAN DATA BERDASARKAN BULAN (GRUPPING)
  // ==========================================
  // 1. Urutkan dari yang terbaru (Tahun & Bulan) ke yang paling lama
  const sortedRequests = [...filteredRequests].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  
  // 2. Kelompokkan ke dalam wadah per bulan
  const groupedRequests = sortedRequests.reduce((acc, item) => {
    const date = new Date(item.created_at);
    const monthNum = (date.getMonth() + 1).toString().padStart(2, '0');
    const monthName = monthsOptions.find(m => m.value === monthNum)?.label?.toUpperCase() || '';
    const groupKey = `${monthName} ${date.getFullYear()}`;
    
    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(item);
    return acc;
  }, {} as Record<string, any[]>);


  const handleDelete = async (id: string) => {
    if (!confirm("⚠️ PERINGATAN: Yakin ingin menghapus pengajuan ini secara permanen?")) return;
    try {
      const res = await fetch('/api/delete-request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      if (res.ok) fetchRequests(); 
    } catch (error) { alert("Gagal menghapus data."); }
  };

  const openAssignModal = (item: any) => {
    setSelectedRequest(item);
    setMechanicName("");
    setMechanicNik("");
    setAssignDate(""); 
    setIsModalOpen(true);
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/update-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedRequest.id,
          action: 'assign',
          mechanic_name: mechanicName,
          mechanic_nik: mechanicNik,
          scheduled_date: assignDate 
        }),
      });
      if (res.ok) { setIsModalOpen(false); fetchRequests(); }
    } catch (error: any) { alert("❌ ERROR: " + error.message); }
    setIsSubmitting(false);
  };

  const openEditTimeModal = (item: any) => {
    setSelectedRequest(item);
    setEditMechanicName(item.mechanic_name || "");
    setEditMechanicNik(item.mechanic_nik || "");

    const formatForInput = (dateString: string) => {
      if (!dateString) return "";
      return new Date(dateString).toISOString().split('T')[0]; 
    };

    setEditScheduledDate(formatForInput(item.scheduled_date || item.assigned_at));
    setEditCompletedAt(formatForInput(item.completed_at));
    setIsEditTimeModalOpen(true);
  };

  const handleEditTimeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/update-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedRequest.id,
          action: 'edit_time',
          scheduled_date: editScheduledDate, 
          completed_at: editCompletedAt,
          mechanic_name: editMechanicName,
          mechanic_nik: editMechanicNik    
        }),
      });
      if (res.ok) { setIsEditTimeModalOpen(false); fetchRequests(); }
    } catch (error: any) { alert("❌ ERROR: " + error.message); }
    setIsSubmitting(false);
  };

  const handleComplete = async (id: string) => {
    if (!confirm("Tandai tugas ini sebagai SELESAI? Tanggal penyelesaian akan dicatat.")) return;
    try {
      const res = await fetch('/api/update-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'complete' }),
      });
      if (res.ok) fetchRequests();
    } catch (error) { alert("Gagal menandai selesai."); }
  };

  const handlePrint = (item: any) => {
    setSelectedPrint(item);
    setPrintMode('TICKET');
    setTimeout(() => { window.print(); }, 500);
  };

  const formatDateOnly = (dateString: string) => {
    if (!dateString) return "-";
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  const formatDateWithTime = (dateString: string) => {
    if (!dateString) return "-";
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  const calculateDays = (start: string, end: string | null) => {
    if (!start) return "-";
    const startDate = new Date(start);
    startDate.setHours(0,0,0,0);
    
    const endDate = end ? new Date(end) : new Date();
    endDate.setHours(0,0,0,0);
    
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "Menunggu Jadwal";
    return `${diffDays + 1} Hari Kerja`; 
  };

  return (
    <div className="min-h-screen print:min-h-0 print:m-0 print:overflow-hidden bg-slate-100 font-sans text-slate-800 relative">
      <div className="print:hidden p-6 md:p-12 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8 bg-white p-6 shadow-sm border-t-4 border-slate-900 rounded-sm">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">📋 Request Management</h1>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Admin Portal - PT Djitoe Mesindo</p>
          </div>
          
          {/* GRUP TOMBOL KANAN ATAS */}
          <div className="flex items-center gap-3">
            
            <button 
              onClick={() => window.location.reload()} 
              className="hover:bg-blue-50 border border-blue-600 text-blue-700 px-4 md:px-6 py-2.5 text-xs font-black transition-colors uppercase tracking-widest rounded-none flex items-center gap-2"
            >
              🔄 Refresh Data
            </button>

            <button onClick={() => router.push('/')} className="border border-slate-300 hover:bg-slate-100 text-slate-900 px-4 md:px-6 py-2.5 text-xs font-black transition-colors uppercase tracking-widest rounded-none">
              Logout
            </button>
            
          </div>
        </div>

    {/* 🔍 BARIS FILTER & PENCARIAN (DESAIN TERPISAH) */}
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          
          {/* BLOK KIRI: Filter Global (Pencarian & Tahun) */}
          <div className="bg-white p-4 shadow-sm border border-slate-200 rounded-sm flex-1 flex flex-wrap items-center gap-3">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-100 px-3 py-2 border border-slate-200">🔍 Filter Data:</span>
            
            <input 
              type="text"
              placeholder="Cari Mekanik / ID / Customer..."
              className="p-2 bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold outline-none focus:border-blue-600 w-full md:w-64 rounded-none uppercase placeholder:text-slate-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(e.target.value)}
              className="p-2 bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold outline-none focus:border-blue-600 cursor-pointer uppercase tracking-wider rounded-none"
            >
              <option value="ALL">SEMUA TAHUN</option>
              {yearsOptions.map(y => ( <option key={y} value={y.toString()}>{y}</option> ))}
            </select>

            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-50 px-3 py-2 border border-dashed border-slate-300 ml-auto hidden md:block">
              Total: <span className="text-slate-900 text-sm">{filteredRequests.length}</span>
            </div>
          </div>

          {/* BLOK KANAN: Khusus Cetak Laporan (Bulan) */}
          <div className="bg-green-50 p-4 shadow-sm border border-green-200 rounded-sm flex flex-wrap items-center gap-3 border-l-4 border-l-green-500">
            <span className="text-[10px] font-black text-green-700 uppercase tracking-widest px-2">🖨️ Cetak Bulanan:</span>
            
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="p-2 bg-white border border-green-300 text-green-800 text-xs font-bold outline-none focus:border-green-600 cursor-pointer uppercase tracking-wider rounded-none shadow-sm"
            >
              {monthsOptions.map(m => ( <option key={m.value} value={m.value}>{m.label}</option> ))}
            </select>

            <button 
              onClick={() => { setPrintMode('REPORT'); setTimeout(() => window.print(), 500); }}
              className="p-2 bg-green-600 text-white text-xs font-black uppercase tracking-widest hover:bg-green-700 transition-all border border-green-700 rounded-none shadow-sm"
            >
              Cetak Selesai
            </button>
          </div>
          
        </div>

        {/* 📊 SUMMARY CARDS - 5 KARTU STATUS */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          
          <div onClick={() => setActiveCard(activeCard === 'TODAY' ? null : 'TODAY')} className={`p-4 shadow-sm flex justify-between items-center rounded-sm cursor-pointer transition-all border-b-4 duration-300 ${activeCard === 'TODAY' ? 'bg-red-50 border-red-600 scale-105 shadow-md' : 'bg-white border-transparent hover:border-red-300'}`}>
            <div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Entry Hari Ini</p>
              <h2 className="text-2xl font-black text-slate-900 mt-1">{stats.today}</h2>
            </div>
            <div className="bg-red-50 text-red-600 p-2 text-lg rounded-sm">🆕</div>
          </div>

          <div onClick={() => setActiveCard(activeCard === 'WAITING' ? null : 'WAITING')} className={`p-4 shadow-sm flex justify-between items-center rounded-sm cursor-pointer transition-all border-b-4 duration-300 ${activeCard === 'WAITING' ? 'bg-amber-50 border-amber-500 scale-105 shadow-md' : 'bg-white border-transparent hover:border-amber-300'}`}>
            <div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Menunggu</p>
              <h2 className="text-2xl font-black text-slate-900 mt-1">{stats.waiting}</h2>
            </div>
            <div className="bg-amber-50 text-amber-500 p-2 text-lg rounded-sm">⏳</div>
          </div>

          <div onClick={() => setActiveCard(activeCard === 'SCHEDULED' ? null : 'SCHEDULED')} className={`p-4 shadow-sm flex justify-between items-center rounded-sm cursor-pointer transition-all border-b-4 duration-300 ${activeCard === 'SCHEDULED' ? 'bg-purple-50 border-purple-500 scale-105 shadow-md' : 'bg-white border-transparent hover:border-purple-300'}`}>
            <div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Antrian Jadwal</p>
              <h2 className="text-2xl font-black text-slate-900 mt-1">{stats.scheduled}</h2>
            </div>
            <div className="bg-purple-50 text-purple-500 p-2 text-lg rounded-sm">🗓️</div>
          </div>

          <div onClick={() => setActiveCard(activeCard === 'PROGRESS' ? null : 'PROGRESS')} className={`p-4 shadow-sm flex justify-between items-center rounded-sm cursor-pointer transition-all border-b-4 duration-300 ${activeCard === 'PROGRESS' ? 'bg-blue-50 border-blue-600 scale-105 shadow-md' : 'bg-white border-transparent hover:border-blue-300'}`}>
            <div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Dikerjakan</p>
              <h2 className="text-2xl font-black text-slate-900 mt-1">{stats.inProgress}</h2>
            </div>
            <div className="bg-blue-50 text-blue-600 p-2 text-lg rounded-sm">🔧</div>
          </div>

          <div onClick={() => setActiveCard(activeCard === 'DONE' ? null : 'DONE')} className={`p-4 shadow-sm flex justify-between items-center rounded-sm cursor-pointer transition-all border-b-4 duration-300 ${activeCard === 'DONE' ? 'bg-green-50 border-green-600 scale-105 shadow-md' : 'bg-white border-transparent hover:border-green-300'}`}>
            <div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Selesai</p>
              <h2 className="text-2xl font-black text-slate-900 mt-1">{stats.done}</h2>
            </div>
            <div className="bg-green-50 text-green-600 p-2 text-lg rounded-sm">✅</div>
          </div>

        </div>

        <div className="bg-white shadow-xl border border-slate-200 overflow-hidden rounded-sm">
          {loading ? (
            <div className="p-10 text-center text-slate-500 font-bold animate-pulse uppercase tracking-widest">Loading Data...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-20 text-center">
              <span className="text-5xl mb-4 block">📭</span>
              <p className="text-slate-400 font-black uppercase tracking-widest">Data tidak ditemukan pada kategori ini</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-[10px] uppercase tracking-widest">
                    <th className="p-4 font-black">Date & Type</th>
                    <th className="p-4 font-black">Customer Detail</th>
                    <th className="p-4 font-black w-64">Status & Assignment</th>
                    <th className="p-4 font-black text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* LOOPING GRUP BULAN DAN TAHUN */}
                  {Object.entries(groupedRequests).map(([groupMonth, items]) => (
                    <Fragment key={groupMonth}>
                      
                      {/* BARIS PEMBATAS BULAN */}
                      <tr className="bg-slate-200 border-y-2 border-slate-300">
                        <td colSpan={4} className="p-3 px-4">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">📅</span>
                            <span className="font-black text-slate-800 text-xs uppercase tracking-widest">{groupMonth}</span>
                            <span className="bg-slate-800 text-white text-[9px] font-bold px-2 py-0.5 rounded-sm shadow-sm">{(items as any[]).length} TIKET</span>                          </div>
                        </td>
                      </tr>

                      {/* DATA TIKET PER BULAN */}
                        {(items as any[]).map((item: any) => {
                          const derivedStatus = getDerivedStatus(item);

                        return (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 align-top">
                            <p className="font-bold text-slate-900 text-sm">{formatDateWithTime(item.created_at)}</p>
                            <span className="inline-block mt-2 border border-slate-800 text-slate-800 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                              {item.request_type}
                            </span>
                          </td>
                          <td className="p-4 align-top">
                            <p className="font-black text-slate-900 text-sm uppercase">{item.customer_name}</p>
                            <p className="text-xs text-slate-600 font-medium mt-1">📞 {item.whatsapp_number}</p>
                          </td>
                          <td className="p-4 align-top">
                            {derivedStatus === 'WAITING' && (
                              <span className="bg-amber-100 text-amber-700 px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-sm border border-amber-200">Menunggu Mekanik</span>
                            )}
                            
                            {derivedStatus === 'SCHEDULED' && (
                              <div>
                                <span className="bg-purple-100 text-purple-700 px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-sm border border-purple-200">🗓️ Masuk Antrian</span>
                                <div className="mt-3 bg-slate-50 p-2 border border-slate-200 rounded-sm">
                                  <p className="text-[10px] font-bold text-slate-500 uppercase">Mekanik:</p>
                                  <p className="text-xs font-black text-slate-900 uppercase">{item.mechanic_name}</p>
                                  <p className="text-[10px] font-bold text-purple-600 mt-1 uppercase tracking-widest">Jadwal: {formatDateOnly(item.scheduled_date || item.assigned_at)}</p>
                                </div>
                              </div>
                            )}

                            {derivedStatus === 'PROGRESS' && (
                              <div>
                                <span className="bg-blue-100 text-blue-700 px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-sm border border-blue-200 animate-pulse">🔧 Sedang Dikerjakan</span>
                                <div className="mt-3 bg-slate-50 p-2 border border-slate-200 rounded-sm">
                                  <p className="text-[10px] font-bold text-slate-500 uppercase">Mekanik:</p>
                                  <p className="text-xs font-black text-slate-900 uppercase">{item.mechanic_name}</p>
                                  <div className="mt-2 text-[9px] font-bold text-slate-600">
                                    <p>Mulai Berjalan: {formatDateOnly(item.scheduled_date || item.assigned_at)}</p>
                                    <p className="text-[10px] font-black text-blue-600 mt-1">⏳ Durasi: {calculateDays(item.scheduled_date || item.assigned_at, null)}</p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {derivedStatus === 'DONE' && (
                              <div>
                                <span className="bg-green-100 text-green-700 px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-sm border border-green-200">✅ Selesai</span>
                                <div className="mt-3 bg-slate-50 p-2 border border-slate-200 rounded-sm">
                                  <p className="text-[10px] font-bold text-slate-500 uppercase">Mekanik:</p>
                                  <p className="text-xs font-black text-slate-900 uppercase">{item.mechanic_name}</p>
                                  <div className="mt-2 text-[9px] font-bold text-slate-600 space-y-0.5">
                                    <p>Mulai: {formatDateOnly(item.scheduled_date || item.assigned_at)}</p>
                                    <p>Selesai: {formatDateOnly(item.completed_at)}</p>
                                  </div>
                                  <div className="mt-2 border-t border-slate-200 pt-1">
                                    <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Total: <span className="text-green-600">{calculateDays(item.scheduled_date || item.assigned_at, item.completed_at)}</span></p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="p-4 align-top">
                            <div className="flex flex-col gap-2">
                              <button onClick={() => handlePrint(item)} className="bg-slate-900 hover:bg-black text-white px-3 py-2 text-[10px] font-black transition-all uppercase tracking-widest flex justify-center items-center gap-2 rounded-none">
                                🖨️ {derivedStatus === 'WAITING' ? 'PRINT AWAL' : derivedStatus === 'DONE' ? 'PRINT FINAL' : 'SURAT TUGAS'}
                              </button>
                              
                              {derivedStatus === 'WAITING' && (
                                <button onClick={() => openAssignModal(item)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 text-[10px] font-black transition-all uppercase tracking-widest rounded-none">
                                  👤 ASSIGN MEKANIK
                                </button>
                              )}
                              
                              {derivedStatus === 'PROGRESS' && (
                                <button onClick={() => handleComplete(item.id)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 text-[10px] font-black transition-all uppercase tracking-widest rounded-none">
                                  ✅ TANDAI SELESAI
                                </button>
                              )}

                              {(derivedStatus === 'SCHEDULED' || derivedStatus === 'PROGRESS' || derivedStatus === 'DONE') && (
                                <button onClick={() => openEditTimeModal(item)} className="border border-amber-500 text-amber-600 hover:bg-amber-50 px-3 py-2 text-[10px] font-black transition-all uppercase tracking-widest rounded-none mt-2">
                                  ✏️ EDIT DATA & NAMA
                                </button>
                              )}

                              <button onClick={() => handleDelete(item.id)} className="border border-red-500 text-red-600 hover:bg-red-50 px-3 py-2 text-[10px] font-black transition-all uppercase tracking-widest rounded-none mt-2">
                                🗑️ HAPUS
                              </button>
                            </div>
                          </td>
                        </tr>
                      )})}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* POP-UP ASSIGN MEKANIK (DENGAN TANGGAL JADWAL) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex justify-center items-center z-50 p-4 print:hidden">
          <div className="bg-white p-8 max-w-md w-full border-t-4 border-blue-600 shadow-2xl animate-in zoom-in duration-200 rounded-sm">
            <h2 className="text-xl font-black uppercase text-slate-900 mb-4">Assign Mekanik & Jadwal</h2>
            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Tanggal Berangkat / Target Mulai</label>
                <input 
                  type="date" required 
                  className="w-full p-3 bg-slate-50 border border-slate-300 text-blue-700 font-black outline-none focus:border-blue-600 text-sm rounded-none uppercase cursor-pointer"
                  value={assignDate} onChange={(e) => setAssignDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Nama Mekanik (Pisah Koma Jika &gt; 1)</label>
                <input type="text" required placeholder="Contoh: Budi, Joko" className="w-full p-3 bg-slate-50 border border-slate-300 text-slate-900 font-bold outline-none focus:border-blue-600 text-sm rounded-none uppercase" value={mechanicName} onChange={(e) => setMechanicName(e.target.value)} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">NIK Mekanik</label>
                <input type="text" required placeholder="Contoh: 102, 103" className="w-full p-3 bg-slate-50 border border-slate-300 text-slate-900 font-bold outline-none focus:border-blue-600 text-sm rounded-none uppercase" value={mechanicNik} onChange={(e) => setMechanicNik(e.target.value)} />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 border border-slate-300 text-slate-600 py-3 font-black text-xs uppercase tracking-widest hover:bg-slate-50 rounded-none">BATAL</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 bg-blue-600 text-white py-3 font-black text-xs uppercase tracking-widest hover:bg-blue-700 rounded-none">SIMPAN JADWAL</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POP-UP BARU: EDIT WAKTU & GANTI MEKANIK (HANYA HARI SAJA) */}
      {isEditTimeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex justify-center items-center z-50 p-4 print:hidden">
          <div className="bg-white p-8 max-w-md w-full border-t-4 border-amber-500 shadow-2xl animate-in zoom-in duration-200 rounded-sm">
            <h2 className="text-xl font-black uppercase text-slate-900 mb-4 border-b border-slate-100 pb-4">Koreksi Data (Hari)</h2>
            <form onSubmit={handleEditTimeSubmit} className="space-y-4">
              <div className="bg-amber-50 p-3 border border-amber-200 border-l-4 border-l-amber-500">
                <p className="text-[10px] font-black text-amber-700 uppercase mb-2">👤 Ganti/Edit Mekanik (Pisahkan koma jika &gt; 1)</p>
                <input type="text" placeholder="Nama (Ex: Budi, Joko)" className="w-full p-2 bg-white border border-amber-300 mb-2 font-bold text-xs uppercase rounded-none" value={editMechanicName} onChange={(e) => setEditMechanicName(e.target.value)} />
                <input type="text" placeholder="NIK (Ex: 123, 456)" className="w-full p-2 bg-white border border-amber-300 font-bold text-xs uppercase rounded-none" value={editMechanicNik} onChange={(e) => setEditMechanicNik(e.target.value)} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Tanggal Mulai / Jadwal</label>
                <input type="date" required className="w-full p-3 bg-slate-50 border border-slate-300 text-slate-900 font-bold outline-none focus:border-amber-500 text-sm rounded-none cursor-pointer" value={editScheduledDate} onChange={(e) => setEditScheduledDate(e.target.value)} />
              </div>
              {selectedRequest?.status === 'Done' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Tanggal Selesai</label>
                  <input type="date" required className="w-full p-3 bg-slate-50 border border-slate-300 text-slate-900 font-bold outline-none focus:border-amber-500 text-sm rounded-none cursor-pointer" value={editCompletedAt} onChange={(e) => setEditCompletedAt(e.target.value)} />
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsEditTimeModalOpen(false)} className="flex-1 border border-slate-300 text-slate-600 py-3 font-black text-xs uppercase tracking-widest hover:bg-slate-50 rounded-none">BATAL</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 bg-amber-500 text-white py-3 font-black text-xs uppercase tracking-widest hover:bg-amber-600 rounded-none">UPDATE DATA</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 🖨️ MODE PRINT 1: SURAT TUGAS / TICKET */}
      {/* ========================================== */}
      {printMode === 'TICKET' && selectedPrint && (
        <div className="hidden print:block bg-white text-black p-8 font-sans w-full max-w-[210mm] mx-auto print:min-h-0">
          <div className="flex justify-between items-end border-b-4 border-slate-900 pb-4 mb-6">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900">PT DJITOE MESINDO</h1>
              <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mt-1">Technical Support Form</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-black text-slate-800 uppercase">SERVICE TICKET</p>
              <p className="text-sm font-bold text-slate-500 uppercase mt-1">ID: #{selectedPrint.id.split('-')[0].toUpperCase()}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 border border-slate-300 p-4">
              <div><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status Laporan</p><p className="font-black text-sm text-slate-900 uppercase">{getDerivedStatus(selectedPrint)}</p></div>
              <div><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tanggal Dibuat</p><p className="font-black text-sm text-slate-900">{formatDateWithTime(selectedPrint.created_at)}</p></div>
            </div>

            <div className="border border-slate-300">
              <h2 className="bg-slate-100 p-2 text-[10px] font-black text-slate-800 uppercase tracking-widest border-b border-slate-300">Customer & Issue Details</h2>
              <div className="p-4">
                <div className="grid grid-cols-3 gap-6 border-b border-slate-200 pb-4 mb-4">
                  <div><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Service Type</p><p className="font-black text-sm text-slate-900 uppercase">{selectedPrint.request_type}</p></div>
                  <div><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Customer / Company</p><p className="font-black text-sm text-slate-900 uppercase">{selectedPrint.customer_name}</p></div>
                  <div><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Contact Number</p><p className="font-black text-sm text-slate-900 uppercase">{selectedPrint.whatsapp_number}</p></div>
                </div>
                <div><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Issue Description</p><div className="bg-slate-50 p-4 text-sm font-medium text-slate-800 border border-slate-200 leading-relaxed whitespace-pre-wrap min-h-[100px]">{selectedPrint.description}</div></div>
              </div>
            </div>

            {(selectedPrint.status === 'In Progress' || selectedPrint.status === 'Done') && (
              <div className="border border-slate-300">
                <h2 className="bg-slate-100 p-2 text-[10px] font-black text-slate-800 uppercase tracking-widest border-b border-slate-300">Assignment & Duration (HARI)</h2>
                <div className="p-4 grid grid-cols-2 gap-4">
                  <div><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Assigned Mechanic</p><p className="font-black text-lg text-slate-900 uppercase">{selectedPrint.mechanic_name} <span className="text-sm">({selectedPrint.mechanic_nik})</span></p></div>
                  <div><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Working Days</p><p className="font-black text-lg text-slate-900 uppercase">{selectedPrint.status === 'Done' ? calculateDays(selectedPrint.scheduled_date || selectedPrint.assigned_at, selectedPrint.completed_at) : 'ON GOING...'}</p></div>
                  <div className="col-span-2 grid grid-cols-2 gap-4 border-t border-slate-200 pt-3 mt-2">
                    <div><p className="text-[10px] font-bold text-slate-500 uppercase">Tanggal Mulai</p><p className="text-xs font-bold text-slate-800">{formatDateOnly(selectedPrint.scheduled_date || selectedPrint.assigned_at)}</p></div>
                    <div><p className="text-[10px] font-bold text-slate-500 uppercase">Tanggal Selesai</p><p className="text-xs font-bold text-slate-800">{selectedPrint.status === 'Done' ? formatDateOnly(selectedPrint.completed_at) : '-'}</p></div>
                  </div>
                </div>
              </div>
            )}

            {/* KOLOM TANDA TANGAN DINAMIS (1-3 ORANG) */}
            <div className="pt-12 flex justify-between gap-6 text-center w-full">
              <div className="flex-1 max-w-[150px]">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-20">Prepared By</p>
                <div className="border-b border-slate-800 w-full mb-1"></div>
                <p className="text-[9px] font-black text-slate-800 uppercase">ROY NUGROHO KESUMA</p>
              </div>

              {/* Looping Mekanik Berdasarkan Koma */}
              {selectedPrint.mechanic_name ? selectedPrint.mechanic_name.split(',').map((mekanik: string, idx: number) => (
                <div key={idx} className="flex-1 max-w-[150px]">
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-20">Technician {idx + 1}</p>
                  <div className="border-b border-slate-800 w-full mb-1"></div>
                  <p className="text-[9px] font-black text-slate-800 uppercase">{mekanik.trim()}</p>
                </div>
              )) : (
                <div className="flex-1 max-w-[150px]">
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-20">Technician</p>
                  <div className="border-b border-slate-800 w-full mb-1"></div>
                  <p className="text-[9px] font-black text-slate-800 uppercase">Name & Sign</p>
                </div>
              )}

              <div className="flex-1 max-w-[150px]">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-20">Approved By (Director)</p>
                <div className="border-b border-slate-800 w-full mb-1"></div>
                <p className="text-[9px] font-black text-slate-800 uppercase">STEFANUS</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 🖨️ MODE PRINT 2: LAPORAN BULANAN (HARI) */}
      {/* ========================================== */}
      {printMode === 'REPORT' && (
        <div className="hidden print:block bg-white text-black p-8 font-sans w-full max-w-[210mm] mx-auto print:min-h-0">
          <div className="text-center mb-8 border-b-4 border-slate-900 pb-4">
            <h1 className="text-3xl font-black uppercase tracking-tighter">PT DJITOE MESINDO</h1>
            <h2 className="text-lg font-bold uppercase mt-1">Laporan Service Selesai (Completed)</h2>
            <p className="text-sm font-bold mt-2 text-slate-600 uppercase tracking-widest">
              Periode: {selectedMonth === 'ALL' ? 'SEMUA BULAN' : monthsOptions.find(m => m.value === selectedMonth)?.label} {selectedYear}
            </p>
          </div>
          
          <table className="w-full text-left border-collapse border border-slate-800 text-xs">
            <thead>
              <tr className="bg-slate-200">
                <th className="border border-slate-800 p-2 font-black uppercase text-center">ID</th>
                <th className="border border-slate-800 p-2 font-black uppercase">Tgl Mulai & Selesai</th>
                <th className="border border-slate-800 p-2 font-black uppercase">Customer & Tipe</th>
                <th className="border border-slate-800 p-2 font-black uppercase">Mekanik</th>
                <th className="border border-slate-800 p-2 font-black uppercase text-center">Durasi</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.filter(r => r.status === 'Done').map((item, index) => (
                <tr key={item.id}>
                  <td className="border border-slate-800 p-2 text-center font-bold text-[10px]">#{item.id.split('-')[0].toUpperCase()}</td>
                  <td className="border border-slate-800 p-2 text-[10px] leading-tight">
                    M: {formatDateOnly(item.scheduled_date || item.assigned_at)} <br/>
                    S: {formatDateOnly(item.completed_at)}
                  </td>
                  <td className="border border-slate-800 p-2">
                    <span className="font-bold uppercase text-[10px]">{item.customer_name}</span><br/>
                    <span className="text-[9px] text-slate-600 uppercase">{item.request_type}</span>
                  </td>
                  <td className="border border-slate-800 p-2 font-bold uppercase text-[10px]">{item.mechanic_name}</td>
                  <td className="border border-slate-800 p-2 text-center font-black text-[10px] text-green-700">
                    {calculateDays(item.scheduled_date || item.assigned_at, item.completed_at)}
                  </td>
                </tr>
              ))}
              {filteredRequests.filter(r => r.status === 'Done').length === 0 && (
                <tr><td colSpan={5} className="border border-slate-800 p-6 text-center font-bold uppercase text-slate-400 tracking-widest">Tidak ada data selesai pada periode ini.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}