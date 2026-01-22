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

  // 1. CEK KEAMANAN & AMBIL DATA
  useEffect(() => {
    const role = sessionStorage.getItem("user_role");
    if (role !== "super_admin") {
      router.push("/");
    } else {
      fetchUsers();
    }
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    // Ambil data dan urutkan berdasarkan yang terakhir login (paling aktif di atas)
    const { data, error } = await supabase.from("users").select("*").order("last_seen", { ascending: false });
    if (error) alert("Gagal ambil data user");
    else setUsers(data || []);
    setLoading(false);
  };

  // 2. FUNGSI CRUD
  const handleDelete = async (id: number) => {
    if(!confirm("⚠️ Yakin hapus user ini selamanya?")) return;
    const { error } = await supabase.from("users").delete().eq("id", id);
    if(error) alert("Gagal hapus!");
    else fetchUsers();
  };

  const handleEditClick = (user: any) => {
    setFormUser(user);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleAddClick = () => {
    setFormUser({ id: "", username: "", password: "", role: "admin" });
    setIsEditing(false);
    setShowModal(true);
  };

  const handleSave = async () => {
    if(!formUser.username || !formUser.password) return alert("Username & Password wajib diisi!");

    try {
        if(isEditing) {
            const { error } = await supabase.from("users").update({
                username: formUser.username,
                password: formUser.password,
                role: formUser.role
            }).eq("id", formUser.id);
            if(error) throw error;
        } else {
            const { error } = await supabase.from("users").insert({
                username: formUser.username,
                password: formUser.password,
                role: formUser.role,
                login_count: 0
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

  // FUNGSI CEK STATUS ONLINE (Batas 30 Menit)
  const getOnlineStatus = (lastSeen: string | null) => {
      if (!lastSeen) return <span className="text-slate-500 text-[10px]">Belum pernah login</span>;
      
      const last = new Date(lastSeen).getTime();
      const now = new Date().getTime();
      const diffMinutes = (now - last) / (1000 * 60);

      if (diffMinutes <= 30) {
          return <span className="text-green-400 font-bold text-[10px] animate-pulse">● ONLINE</span>;
      } else if (diffMinutes <= 60) {
          return <span className="text-yellow-400 font-bold text-[10px]">● {Math.floor(diffMinutes)}m ago</span>;
      } else {
          return <span className="text-slate-500 text-[10px]">{new Date(lastSeen).toLocaleDateString("id-ID")} {new Date(lastSeen).toLocaleTimeString("id-ID").slice(0,5)}</span>;
      }
  };

  // Grouping Logic
  const groupSuperAdmin = users.filter(u => u.role === 'super_admin');
  const groupBoss = users.filter(u => u.role === 'boss');
  const groupAdmin = users.filter(u => u.role === 'admin');

  // Komponen Kartu User
  const UserCard = ({ user, icon, colorClass, badgeColor }: any) => (
    <div className={`bg-slate-800 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 border border-slate-700 hover:border-${colorClass}-500 transition group shadow-lg relative overflow-hidden`}>
        <div className={`absolute top-0 left-0 w-1 h-full bg-${colorClass}-500`}></div>
        
        <div className="flex items-center gap-5 w-full md:w-auto">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold bg-slate-900 shadow-inner ${colorClass === 'purple' ? 'text-purple-400' : (colorClass === 'yellow' ? 'text-yellow-400' : 'text-blue-400')}`}>
                {icon}
            </div>
            <div>
                <div className="flex items-center gap-2">
                    <p className="font-black text-xl text-white tracking-wide">{user.username}</p>
                    {getOnlineStatus(user.last_seen)}
                </div>
                <div className="flex gap-2 mt-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${badgeColor}`}>
                        {user.role}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                        Logins: {user.login_count || 0}x
                    </span>
                </div>
            </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto justify-end">
            <div className="flex flex-col text-right mr-4">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Password</span>
                <span className="font-mono text-slate-300 bg-black/30 px-3 py-1 rounded-lg border border-slate-700/50">
                    {user.password}
                </span>
            </div>
            <button onClick={() => handleEditClick(user)} className="bg-slate-700 hover:bg-blue-600 text-white p-3 rounded-xl transition shadow-md">
                ✏️
            </button>
            <button onClick={() => handleDelete(user.id)} className="bg-slate-700 hover:bg-red-600 text-white p-3 rounded-xl transition shadow-md">
                🗑️
            </button>
        </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-950 p-6 font-sans text-slate-200 pb-20">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-4">
            <div>
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 tracking-tighter uppercase">
                    Super Admin Panel
                </h1>
                <p className="text-slate-500 font-bold text-sm tracking-widest mt-1">ACCESS MANAGEMENT SYSTEM V2.0</p>
            </div>
            <div className="flex gap-3">
                <button onClick={handleAddClick} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-black shadow-lg shadow-blue-900/50 transition flex items-center gap-2 active:scale-95">
                    <span>+</span> NEW USER
                </button>
                <button onClick={() => router.push("/")} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-3 rounded-xl font-bold transition border border-slate-700 active:scale-95">
                    🚪 LOGOUT
                </button>
            </div>
        </div>

        {/* LOADING STATE */}
        {loading && <div className="text-center py-20 animate-pulse text-slate-500 font-mono">Memuat data users...</div>}

        {/* --- GROUP 1: SUPER ADMIN --- */}
        {!loading && groupSuperAdmin.length > 0 && (
            <div className="mb-10 animate-in fade-in slide-in-from-bottom duration-500">
                <h3 className="text-purple-400 font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span> Root Access ({groupSuperAdmin.length})
                </h3>
                <div className="space-y-3">
                    {groupSuperAdmin.map(u => <UserCard key={u.id} user={u} icon="👑" colorClass="purple" badgeColor="bg-purple-500/20 text-purple-300" />)}
                </div>
            </div>
        )}

        {/* --- GROUP 2: BOSS / DIREKSI --- */}
        {!loading && groupBoss.length > 0 && (
            <div className="mb-10 animate-in fade-in slide-in-from-bottom duration-700">
                <h3 className="text-yellow-500 font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span> Management / Boss ({groupBoss.length})
                </h3>
                <div className="space-y-3">
                    {groupBoss.map(u => <UserCard key={u.id} user={u} icon="💼" colorClass="yellow" badgeColor="bg-yellow-500/20 text-yellow-300" />)}
                </div>
            </div>
        )}

        {/* --- GROUP 3: STAFF ADMIN --- */}
        {!loading && groupAdmin.length > 0 && (
            <div className="mb-10 animate-in fade-in slide-in-from-bottom duration-1000">
                <h3 className="text-blue-500 font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span> Staff Admin ({groupAdmin.length})
                </h3>
                <div className="space-y-3">
                    {groupAdmin.map(u => <UserCard key={u.id} user={u} icon="🧑‍💻" colorClass="blue" badgeColor="bg-blue-500/20 text-blue-300" />)}
                </div>
            </div>
        )}

        {/* MODAL EDIT / TAMBAH */}
        {showModal && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in zoom-in-95 duration-200">
                <div className="bg-slate-900 w-full max-w-md p-8 rounded-[2rem] border border-slate-700 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                    <h3 className="text-2xl font-black text-white mb-1 uppercase tracking-tight">{isEditing ? "Edit Access" : "Create Access"}</h3>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-8">Management User System</p>
                    
                    <div className="space-y-5">
                        <div>
                            <label className="text-[10px] font-black text-blue-500 uppercase ml-1 mb-1 block">Username Login</label>
                            <input type="text" className="w-full p-4 bg-slate-950 border border-slate-700 rounded-xl font-bold text-white focus:outline-none focus:border-blue-500 transition focus:ring-1 focus:ring-blue-500" 
                                value={formUser.username} onChange={(e) => setFormUser({...formUser, username: e.target.value})} placeholder="Ex: KRISTYAMIN" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-blue-500 uppercase ml-1 mb-1 block">Password Access</label>
                            <input type="text" className="w-full p-4 bg-slate-950 border border-slate-700 rounded-xl font-bold text-white focus:outline-none focus:border-blue-500 transition focus:ring-1 focus:ring-blue-500" 
                                value={formUser.password} onChange={(e) => setFormUser({...formUser, password: e.target.value})} placeholder="Ex: RAHASIA123" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-blue-500 uppercase ml-1 mb-1 block">Role / Jabatan</label>
                            <div className="relative">
                                <select className="w-full p-4 bg-slate-950 border border-slate-700 rounded-xl font-bold text-white focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
                                    value={formUser.role} onChange={(e) => setFormUser({...formUser, role: e.target.value})}>
                                    <option value="admin">🔵 ADMIN STAFF</option>
                                    <option value="boss">🟡 BOSS / DIREKSI</option>
                                    <option value="super_admin">🟣 SUPER ADMIN</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">▼</div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-10">
                        <button onClick={() => setShowModal(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-4 rounded-xl font-bold transition text-xs uppercase tracking-wider">Cancel</button>
                        <button onClick={handleSave} className="flex-[2] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white py-4 rounded-xl font-black transition shadow-lg shadow-purple-900/20 text-xs uppercase tracking-wider">
                            {isEditing ? "Save Changes" : "Create User"}
                        </button>
                    </div>
                </div>
            </div>
        )}

      </div>
    </main>
  );
}