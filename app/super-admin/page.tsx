"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function SuperAdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State untuk Edit/Tambah
  const [showModal, setShowModal] = useState(false);
  const [formUser, setFormUser] = useState({ id: "", username: "", password: "", role: "admin" });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("users").select("*").order("id", { ascending: true });
    if (error) alert("Gagal ambil data user");
    else setUsers(data || []);
    setLoading(false);
  };

  // HAPUS USER
  const handleDelete = async (id: number) => {
    if(!confirm("Yakin hapus user ini?")) return;
    const { error } = await supabase.from("users").delete().eq("id", id);
    if(error) alert("Gagal hapus!");
    else fetchUsers();
  };

  // SIAPKAN EDIT
  const handleEditClick = (user: any) => {
    setFormUser(user);
    setIsEditing(true);
    setShowModal(true);
  };

  // SIAPKAN TAMBAH BARU
  const handleAddClick = () => {
    setFormUser({ id: "", username: "", password: "", role: "admin" });
    setIsEditing(false);
    setShowModal(true);
  };

  // SIMPAN DATA (BAIK BARU MAUPUN EDIT)
  const handleSave = async () => {
    if(!formUser.username || !formUser.password) return alert("Username & Password wajib diisi!");

    try {
        if(isEditing) {
            // Update
            const { error } = await supabase.from("users").update({
                username: formUser.username,
                password: formUser.password,
                role: formUser.role
            }).eq("id", formUser.id);
            if(error) throw error;
        } else {
            // Insert Baru
            const { error } = await supabase.from("users").insert({
                username: formUser.username,
                password: formUser.password,
                role: formUser.role
            });
            if(error) throw error;
        }
        alert("✅ Data User Berhasil Disimpan!");
        setShowModal(false);
        fetchUsers();
    } catch (err: any) {
        alert("Gagal: " + err.message);
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 p-6 font-sans text-slate-200">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                🔐 SUPER ADMIN <span className="text-sm bg-red-600 px-3 py-1 rounded-full font-bold">ROOT ACCESS</span>
            </h1>
            <button onClick={() => router.push("/")} className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl font-bold transition">
                🚪 Logout
            </button>
        </div>

        {/* Tabel User */}
        <div className="bg-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-700">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Daftar Akun Terdaftar</h2>
                <button onClick={handleAddClick} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-bold shadow-lg transition">
                    + Tambah User
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-slate-400 border-b border-slate-600 text-xs uppercase tracking-wider">
                            <th className="p-4">Role</th>
                            <th className="p-4">Username</th>
                            <th className="p-4">Password (Plain)</th>
                            <th className="p-4 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {users.map((user) => (
                            <tr key={user.id} className="border-b border-slate-700 hover:bg-slate-700/50 transition">
                                <td className="p-4">
                                    <span className={`px-3 py-1 rounded-lg font-black text-[10px] uppercase 
                                        ${user.role === 'super_admin' ? 'bg-red-500/20 text-red-400' : 
                                          user.role === 'boss' ? 'bg-purple-500/20 text-purple-400' : 
                                          'bg-blue-500/20 text-blue-400'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="p-4 font-bold text-white">{user.username}</td>
                                <td className="p-4 font-mono text-yellow-400 bg-slate-900/50 rounded">{user.password}</td>
                                <td className="p-4 flex justify-center gap-2">
                                    <button onClick={() => handleEditClick(user)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-bold text-xs">Edit</button>
                                    {user.role !== 'super_admin' && (
                                        <button onClick={() => handleDelete(user.id)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg font-bold text-xs">Hapus</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {loading && <p className="text-center p-4 animate-pulse">Memuat data...</p>}
            </div>
        </div>

        {/* MODAL EDIT / TAMBAH */}
        {showModal && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                <div className="bg-slate-800 w-full max-w-md p-8 rounded-3xl border border-slate-600 shadow-2xl">
                    <h3 className="text-2xl font-black text-white mb-6 uppercase">{isEditing ? "Edit Akun" : "Tambah Akun Baru"}</h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase ml-1">Username</label>
                            <input type="text" className="w-full p-4 bg-slate-900 border border-slate-600 rounded-xl font-bold text-white focus:outline-none focus:border-blue-500" 
                                value={formUser.username} onChange={(e) => setFormUser({...formUser, username: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase ml-1">Password</label>
                            <input type="text" className="w-full p-4 bg-slate-900 border border-slate-600 rounded-xl font-bold text-white focus:outline-none focus:border-blue-500" 
                                value={formUser.password} onChange={(e) => setFormUser({...formUser, password: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase ml-1">Role / Jabatan</label>
                            <select className="w-full p-4 bg-slate-900 border border-slate-600 rounded-xl font-bold text-white focus:outline-none focus:border-blue-500"
                                value={formUser.role} onChange={(e) => setFormUser({...formUser, role: e.target.value})}>
                                <option value="admin">Admin Staff</option>
                                <option value="boss">Boss / Direksi</option>
                                <option value="super_admin">Super Admin</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-8">
                        <button onClick={() => setShowModal(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-bold transition">Batal</button>
                        <button onClick={handleSave} className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-black transition shadow-lg shadow-blue-900/20">SIMPAN</button>
                    </div>
                </div>
            </div>
        )}

      </div>
    </main>
  );
}