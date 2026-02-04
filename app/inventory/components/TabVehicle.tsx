"use client";
import { useState } from "react";

export default function TabVehicle({ vehicleList, role, onSelectVehicle, onEdit, onDelete, onPrint, searchTerm }: any) {
  const [viewMode, setViewMode] = useState<"SELECTION" | "LIST">("SELECTION");
  const [selectedType, setSelectedType] = useState<"MOBIL" | "MOTOR">("MOBIL");

  // Filter Logic
  const getFilteredVehicles = () => {
    let filtered = vehicleList;
    if (searchTerm) { 
        const lower = searchTerm.toLowerCase();
        filtered = vehicleList.filter((v:any) => 
            v.nama_kendaraan?.toLowerCase().includes(lower) || 
            v.plat_nomor?.toLowerCase().includes(lower) ||
            v.pic_kendaraan?.toLowerCase().includes(lower) ||
            v.mess_locations?.nama_mess?.toLowerCase().includes(lower)
        );
    }
    return filtered.filter((v:any) => v.jenis === selectedType).sort((a:any, b:any) => new Date(a.tgl_service).getTime() - new Date(b.tgl_service).getTime());
  };

  const finalData = getFilteredVehicles();
  const nonMessVehicles = finalData.filter((v:any) => !v.mess_id); 
  const messVehicles = finalData.filter((v:any) => v.mess_id);

  // Helper Status
  const getStatusIndicator = (dateString: string, type: string) => {
      if (!dateString) return <span className="text-gray-300 text-[9px] font-mono">--</span>;
      const diffDays = Math.ceil((new Date(dateString).getTime() - new Date().setHours(0,0,0,0)) / (86400000));
      if (diffDays < 0) return <span className="bg-red-600 text-white px-2 py-0.5 rounded text-[9px] font-black animate-pulse shadow-md">🚨 TELAT {Math.abs(diffDays)} HR ({type})</span>;
      else if (diffDays <= 1) return <span className="bg-red-100 text-red-700 border border-red-300 px-2 py-0.5 rounded text-[9px] font-black animate-pulse">🔴 BESOK! ({type})</span>;
      else if (diffDays <= 30) return <span className="bg-orange-100 text-orange-700 border border-orange-300 px-2 py-0.5 rounded text-[9px] font-black">🟠 {diffDays} HR LAGI ({type})</span>;
      else return <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded text-[9px] font-bold border border-green-200">🟢 OK ({type})</span>;
  };

  // Internal Component Table
  const VehicleTable = ({ data, title, colorTheme }: any) => (
    <div className={`bg-white rounded-[2rem] border overflow-hidden shadow-sm flex flex-col h-full ${colorTheme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className={`p-4 border-b flex items-center gap-2 ${colorTheme === 'dark' ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-700'}`}><h3 className="font-black uppercase text-sm tracking-wider flex-1">{title} <span className="opacity-70 text-xs ml-1">({data.length} Unit)</span></h3></div>
        <div className="overflow-x-auto flex-1"><table className="w-full text-left text-sm"><thead className="bg-white text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-50"><tr><th className="p-3">Info Aset</th><th className="p-3">Lokasi/PIC</th><th className="p-3">Jadwal (Status)</th>{role === 'mess_admin' && <th className="p-3 text-center">Aksi</th>}</tr></thead><tbody className="divide-y divide-slate-50">{data.map((v: any) => (<tr key={v.id} onClick={() => onSelectVehicle(v)} className="hover:bg-slate-50 transition cursor-pointer group"><td className="p-3"><div className="flex items-center gap-2"><span className="text-xl">{v.jenis === 'MOBIL' ? '🚙' : '🏍️'}</span><div><p className="font-black text-slate-800 uppercase text-xs group-hover:text-blue-600 transition">{v.nama_kendaraan}</p><p className="font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded-[4px] text-[9px] w-fit mt-1">{v.plat_nomor}</p></div></div></td><td className="p-3"><p className="font-bold text-slate-700 text-[10px] uppercase">{v.mess_locations ? v.mess_locations.nama_mess : "NON-MESS"}</p><p className="text-[10px] text-slate-500 font-bold mt-0.5">👤 {v.pic_kendaraan || "-"}</p>{v.pic_kontak && <p className="text-[9px] text-emerald-600 font-mono mt-0.5">📞 {v.pic_kontak}</p>}</td><td className="p-3 space-y-1"><div>{getStatusIndicator(v.tgl_service, "Svc")}</div><div>{getStatusIndicator(v.tgl_pajak, "5Th")}</div></td>{role === 'mess_admin' && (<td className="p-3 text-center"><div className="flex justify-center gap-1"><button onClick={(e) => onEdit(v, e)} className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white p-1.5 rounded-lg transition text-xs">✏️</button><button onClick={(e) => {e.stopPropagation(); onDelete('mess_vehicles', v.id)}} className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white p-1.5 rounded-lg transition text-xs">🗑️</button></div></td>)}</tr>))}{data.length === 0 && (<tr><td colSpan={4} className="p-4 text-center text-xs text-slate-400 italic">Tidak ada data.</td></tr>)}</tbody></table></div>
    </div>
  );

  return (
    <div className="animate-in slide-in-from-bottom-4 pb-20">
        {viewMode === "SELECTION" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4 h-auto md:h-[50vh]">
                <div onClick={() => { setSelectedType("MOBIL"); setViewMode("LIST"); }} className="bg-white border-4 border-slate-100 rounded-[3rem] shadow-sm hover:shadow-2xl hover:border-blue-500 hover:-translate-y-2 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 group py-10 md:py-0"><div className="text-6xl md:text-8xl group-hover:scale-110 transition duration-300">🚙</div><div className="text-center"><h2 className="text-2xl md:text-3xl font-black text-slate-700 uppercase tracking-widest group-hover:text-blue-600">Mobil</h2><p className="text-slate-400 font-bold text-sm mt-1">{vehicleList.filter((v:any) => v.jenis === 'MOBIL').length} Unit</p></div></div>
                <div onClick={() => { setSelectedType("MOTOR"); setViewMode("LIST"); }} className="bg-white border-4 border-slate-100 rounded-[3rem] shadow-sm hover:shadow-2xl hover:border-blue-500 hover:-translate-y-2 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 group py-10 md:py-0"><div className="text-6xl md:text-8xl group-hover:scale-110 transition duration-300">🏍️</div><div className="text-center"><h2 className="text-2xl md:text-3xl font-black text-slate-700 uppercase tracking-widest group-hover:text-blue-600">Motor</h2><p className="text-slate-400 font-bold text-sm mt-1">{vehicleList.filter((v:any) => v.jenis === 'MOTOR').length} Unit</p></div></div>
            </div>
        )}
        {viewMode === "LIST" && (
            <div className="animate-in fade-in">
                <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                    <div className="flex items-center gap-4"><button onClick={() => setViewMode("SELECTION")} className="bg-white border border-slate-200 text-slate-500 w-10 h-10 rounded-full font-bold hover:bg-slate-100 transition shadow-sm flex items-center justify-center">⬅</button><h2 className="text-xl md:text-2xl font-black text-slate-800 uppercase">LIST {selectedType}</h2></div>
                    <button onClick={() => onPrint(selectedType)} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-700 transition flex items-center gap-2 shadow-lg animate-in fade-in">🖨️ CETAK DATA {selectedType}</button>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <VehicleTable data={nonMessVehicles} title={`NON-MESS / PRIBADI (${selectedType})`} colorTheme="dark" />
                    <VehicleTable data={messVehicles} title={`DI LOKASI MESS (${selectedType})`} colorTheme="light" />
                </div>
            </div>
        )}
    </div>
  );
}