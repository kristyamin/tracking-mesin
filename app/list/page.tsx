"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function MachineListPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const type = searchParams.get("type"); // Ambil jenis mesin dari URL
  const year = searchParams.get("year");

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (type) fetchData();
  }, [type, year]);

  const fetchData = async () => {
    setLoading(true);
    // Ambil data sesuai tipe mesin yang diklik
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("machine_type", type)
      .eq("year", year)
      .order("created_at", { ascending: false });

    if (data) setOrders(data);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Tombol Back */}
      <button onClick={() => router.back()} className="mb-4 text-gray-500 flex items-center text-sm">
        ← Kembali ke Dashboard
      </button>

      <h1 className="text-xl font-bold text-blue-900 mb-1">{type}</h1>
      <p className="text-sm text-gray-500 mb-6">Daftar Order Tahun {year}</p>

      {loading ? (
        <p className="text-center py-10">Loading data...</p>
      ) : orders.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg shadow-sm">
          <p className="text-gray-400">Belum ada order untuk mesin ini.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((item) => (
            <div 
              key={item.id}
              onClick={() => router.push(`/tracking/${item.order_id}`)} // Klik masuk ke detail log
              className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 active:bg-blue-50"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">
                  {item.order_id}
                </span>
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                  {item.status}
                </span>
              </div>
              <h3 className="font-bold text-gray-800 text-lg">{item.customer_name}</h3>
              <p className="text-xs text-gray-400 mt-1">Klik untuk lihat history log</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}