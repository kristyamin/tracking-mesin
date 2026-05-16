"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function SuperAdminGPPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formUser, setFormUser] = useState({ id: "", username: "", password: "", role: "admin_req" });

  useEffect(() => {
    // 👇 KUNCINYA GANTI JADI "role_gatepass"
    const role = localStorage.getItem("role_gatepass"); 
    
    if (role !== "super_admin_gp") {
      router.push("/");
    } else {
      fetchGatepassUsers(); // Ini biarin jalan buat narik data
    }
  }, [router]);

  const fetchGatepassUsers = async () => {
    setLoading(true);
    // Kita filter: Cuma ambil user yang rolenya admin_req atau manager_gp
    const { data, error } = await supabase
      .from("users_gp") // 👈 Ngambilnya dari tabel baru ya!
      .select("*")
      .in("role", ["admin_req", "manager_gp"])
      .order("username", { ascending: true });

    if (!error) setUsers(data || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if(!formUser.username || !formUser.password) return alert("Lengkapi data beb!");
    try {
      if(isEditing) {
        await supabase.from("users_gp").update({
          username: formUser.username.toUpperCase(),
          password: formUser.password,
          role: formUser.role
        }).eq("id", formUser.id);
      } else {
        await supabase.from("users_gp").insert({
          username: formUser.username.toUpperCase(),
          password: formUser.password,
          role: formUser.role
        });
      }
      setShowModal(false);
      fetchGatepassUsers();
      alert("✅ Berhasil disimpan!");
    } catch (e) { alert("Gagal Simpan"); }
  };

  const handleLogout = () => {
    // 👇 KUNCINYA GANTI JADI "role_gatepass"
    localStorage.removeItem("role_gatepass"); 
    sessionStorage.clear();
    router.push("/");
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Gatepass Controller</h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Management User Portal</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setFormUser({id:"", username:"", password:"", role:"admin_req"}); setIsEditing(false); setShowModal(true); }} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg active:scale-95 transition">+ AKUN BARU</button>
            <button onClick={handleLogout} className="bg-white text-slate-400 px-5 py-2.5 rounded-xl font-bold text-xs border border-slate-200 active:scale-95 transition">LOGOUT</button>
          </div>
        </div>

        {loading ? (
           <div className="text-center py-20 text-slate-300 font-bold animate-pulse">MEMUAT DATA...</div>
        ) : (
          <div className="grid gap-4">
            {users.length === 0 && (
                <div className="text-center py-10 text-slate-400 font-bold">Belum ada data Manajer / Admin Gatepass.</div>
            )}
            {users.map(u => (
              <div key={u.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center group hover:border-blue-200 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${u.role === 'manager_gp' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                    {u.role === 'manager_gp' ? 'M' : 'A'}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 uppercase">{u.username}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{u.role === 'manager_gp' ? 'Manager Gatepass' : 'Admin Gatepass'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <p className="text-[9px] font-bold text-slate-300 uppercase">Password</p>
                    <p className="font-mono text-sm text-slate-600">{u.password}</p>
                  </div>
                  <button onClick={() => { setFormUser(u); setIsEditing(true); setShowModal(true); }} className="p-2.5 bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white rounded-lg transition">✏️</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MODAL EDIT / TAMBAH */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-white w-full max-w-sm p-8 rounded-3xl shadow-2xl relative">
               <h2 className="text-xl font-black text-slate-800 mb-6 uppercase">{isEditing ? 'Ubah Akun' : 'Akun Baru'}</h2>
               <div className="space-y-4">
                  <input type="text" placeholder="USERNAME" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase text-sm text-slate-900" value={formUser.username} onChange={e => setFormUser({...formUser, username: e.target.value.toUpperCase()})} />

<input type="password" placeholder="PASSWORD" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-slate-900" value={formUser.password} onChange={e => setFormUser({...formUser, password: e.target.value})} />

<select className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-slate-900" value={formUser.role} onChange={e => setFormUser({...formUser, role: e.target.value})}>
  <option value="admin_req">ADMIN GATEPASS</option>
  <option value="manager_gp">MANAJER GATEPASS</option>
</select>
               </div>
               <div className="flex gap-2 mt-8">
                  <button onClick={() => setShowModal(false)} className="flex-1 py-3 text-xs font-bold text-slate-400 uppercase">Batal</button>
                  <button onClick={handleSave} className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase shadow-lg">Simpan</button>
               </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}