"use client";

export default function TabMess({ messList, residentList, role, onSelectMess, onEdit, onDelete, searchTerm }: any) {
  // Filter Logic
  const filteredMess = messList.filter((mess: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return mess.nama_mess?.toLowerCase().includes(term) || mess.pic_utama?.toLowerCase().includes(term);
  });

  // Helper Status
  const getStatusIndicator = (dateString: string, type: string) => {
    
      if (!dateString) return <span className="text-gray-300 text-[9px] font-mono">--</span>;
      const diffDays = Math.ceil((new Date(dateString).getTime() - new Date().setHours(0,0,0,0)) / (86400000));
      if (diffDays < 0) return <span className="bg-red-600 text-white px-2 py-0.5 rounded text-[9px] font-black animate-pulse">🚨 TELAT {Math.abs(diffDays)} HR ({type})</span>;
      else if (diffDays <= 1) return <span className="bg-red-100 text-red-700 border border-red-300 px-2 py-0.5 rounded text-[9px] font-black animate-pulse">🔴 BESOK! ({type})</span>;
      else if (diffDays <= 30) return <span className="bg-orange-100 text-orange-700 border border-orange-300 px-2 py-0.5 rounded text-[9px] font-black">🟠 {diffDays} HR LAGI ({type})</span>;
      else return <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded text-[9px] font-bold border border-green-200">🟢 OK ({type})</span>;
  };

  const formatDateIndo = (dateString: string) => {
      if (!dateString) return "-";
      try {
          const d = new Date(dateString);
          if (isNaN(d.getTime())) return "-"; 
          return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
      } catch (error) {
          // Kalau browser komputer admin jadul dan gagal nge-format, jangan crash!
          return dateString;
      }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in pb-20">
        {filteredMess.map((mess: any) => {
            const totalOrang = residentList.filter((r: any) => r.mess_id === mess.id).length;
            const totalKamar = mess.jumlah_kamar || 0;
            return (
                <div key={mess.id} onClick={() => onSelectMess(mess)} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-300 hover:scale-[1.02] transition-all cursor-pointer group relative overflow-hidden flex flex-col h-full">
                    <div className="relative h-36 bg-slate-200 flex items-center justify-center overflow-hidden">
                        <img src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=500&auto=format&fit=crop" alt="Mess" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent z-10"></div>
                        <div className="absolute bottom-3 left-4 z-20"><h3 className="text-lg font-black text-white uppercase tracking-tight shadow-black drop-shadow-md">{mess.nama_mess}</h3><p className="text-[10px] text-slate-300 font-medium">{mess.alamat || "Alamat belum diisi"}</p></div>
                        <div className="absolute bottom-3 right-4 z-20 flex flex-col items-end gap-1">
                            {mess.tgl_cuci_ac ? (
                                <>
                                    <span className="text-[9px] text-white font-bold bg-slate-900/60 px-2 py-0.5 rounded backdrop-blur-sm border border-slate-600/50">
                                        📅 {formatDateIndo(mess.tgl_cuci_ac)}
                                    </span>
                                    <div className="scale-90 origin-right">
                                        {getStatusIndicator(mess.tgl_cuci_ac, "AC")}
                                    </div>
                                </>
                            ) : (
                                <span className="bg-slate-800/50 text-white px-2 py-0.5 rounded text-[9px] font-bold backdrop-blur-sm">AC Belum Ada Jadwal</span>
                            )}
                        </div>                        {role === 'mess_admin' && (<div className="absolute top-3 right-3 z-30 flex gap-2"><button onClick={(e) => onEdit(mess, e)} className="w-8 h-8 bg-white/20 backdrop-blur-sm hover:bg-blue-600 hover:text-white rounded-full flex items-center justify-center transition shadow-lg text-white">✏️</button><button onClick={(e) => { e.stopPropagation(); onDelete('mess_locations', mess.id); }} className="w-8 h-8 bg-white/20 backdrop-blur-sm hover:bg-red-500 hover:text-white rounded-full flex items-center justify-center transition shadow-lg text-white">🗑️</button></div>)}
                    </div>
<div className="p-5 flex-1 flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex flex-col">
                                <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-2 py-1 rounded-lg uppercase w-fit">
                                    👤 PIC: {mess.pic_utama}
                                </span>
                                {/* 👇 INI TAMBAHAN NO HP DI BAWAH PIC */}
                                <span className="text-[10px] font-bold text-slate-400 mt-1 ml-1 flex items-center gap-1">
                                    📞 {mess.pic_hp || "-"}
                                </span>
                            </div>
                    <div className={`text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1 ${totalOrang >= totalKamar ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}><span>🛏️</span><span>{totalOrang} / {totalKamar} Isi</span></div></div></div>
                </div>
            );
        })}
    </div>
  );
}