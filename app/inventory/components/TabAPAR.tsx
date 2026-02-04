"use client";

export default function TabAPAR({ aparList, role, onAdd, onEdit, onDelete, searchTerm }: any) {
  
  // Filter Data
  const filteredData = aparList.filter((item: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.lokasi?.toLowerCase().includes(term) ||
      item.nomor_tabung?.toLowerCase().includes(term) ||
      item.jenis?.toLowerCase().includes(term)
    );
  });

  // Helper Cek Expired
  const getExpStatus = (dateString: string) => {
      if (!dateString) return <span className="text-gray-300">--</span>;
      const today = new Date();
      const expDate = new Date(dateString);
      const diffTime = expDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return <span className="bg-red-600 text-white px-2 py-1 rounded text-[10px] font-black animate-pulse">EXPIRED ({Math.abs(diffDays)} hari)</span>;
      if (diffDays < 30) return <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded text-[10px] font-black">WARNING ({diffDays} hari)</span>;
      return <span className="bg-green-100 text-green-600 px-2 py-1 rounded text-[10px] font-black">AMAN</span>;
  };

  return (
    <div className="animate-in slide-in-from-bottom-4 pb-20">
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-red-600 text-white flex justify-between items-center">
          <div>
            <h3 className="font-black uppercase tracking-widest">🔥 DAFTAR APAR (FIRE SAFETY)</h3>
            <p className="text-xs font-medium opacity-80">Total: {filteredData.length} Tabung</p>
          </div>
          {role === 'mess_admin' && (
            <button onClick={onAdd} className="bg-white text-red-600 px-4 py-2 rounded-xl text-xs font-black hover:bg-slate-100 transition shadow-lg">+ TAMBAH APAR</button>
          )}
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-red-50 text-red-800 uppercase text-[10px] font-bold border-b border-red-100">
              <tr>
                <th className="p-4">No. Tabung / Lokasi</th>
                <th className="p-4">Jenis & Berat</th>
                <th className="p-4">Expired Date</th>
                <th className="p-4 text-center">Kondisi</th>
                {role === 'mess_admin' && <th className="p-4 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredData.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50 transition group">
                  <td className="p-4">
                    <p className="font-black text-slate-800 uppercase text-lg">{item.nomor_tabung || "NO-ID"}</p>
                    <p className="text-xs font-bold text-slate-500 uppercase mt-1">📍 {item.lokasi}</p>
                  </td>
                  <td className="p-4">
                    <span className="bg-slate-800 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase">{item.jenis}</span>
                    <p className="font-bold text-slate-700 mt-1 text-sm">{item.berat_kg} KG</p>
                  </td>
                  <td className="p-4">
                    <p className="font-mono text-xs font-bold text-slate-700">{item.tgl_exp ? new Date(item.tgl_exp).toLocaleDateString('id-ID') : '-'}</p>
                    <div className="mt-1">{getExpStatus(item.tgl_exp)}</div>
                  </td>
                  <td className="p-4 text-center">
                    {item.kondisi === 'BAIK' ? <span className="text-green-600 font-black text-xs">✓ BAIK</span> : <span className="text-red-600 font-black text-xs">⚠ {item.kondisi}</span>}
                  </td>
                  {role === 'mess_admin' && (
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => onEdit(item)} className="bg-blue-50 text-blue-600 p-2 rounded-lg hover:bg-blue-600 hover:text-white transition">✏️</button>
                        <button onClick={() => onDelete('apar_assets', item.id)} className="bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-600 hover:text-white transition">🗑️</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}