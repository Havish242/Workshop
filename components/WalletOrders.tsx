"use client";

import { useEffect, useState } from "react";

type Order = {
  id: number;
  status: string;
  total: number;
  pickup_time: string | null;
  items: { name: string; quantity: number }[];
};

export default function WalletOrders({ refreshKey }: { refreshKey: number }) {
  const [student, setStudent] = useState<{ name: string; balance: number } | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/me", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Could not load orders");
        if (active) {
          setStudent(data.student);
          setOrders(data.orders);
          setError("");
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Could not load orders");
      }
    }
    load();
    const timer = window.setInterval(load, 5000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [refreshKey]);

  return (
    <div className="mb-4 rounded-xl bg-slate-900 p-4 text-white shadow-sm">
      {error ? <p className="text-sm text-red-300">{error}</p> : (
        <>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Wallet</p>
              <p className="mt-1 text-2xl font-semibold">Rs {student?.balance ?? "--"}</p>
              <p className="text-sm text-slate-300">{student?.name ?? "Loading..."}</p>
            </div>
            <span className="rounded-full bg-emerald-400/20 px-2 py-1 text-xs text-emerald-300">Student · S001</span>
          </div>
          <div className="mt-4 border-t border-slate-700 pt-3">
            <h2 className="font-semibold">My orders today</h2>
            {orders.length === 0 ? <p className="mt-2 text-sm text-slate-400">No orders yet.</p> : (
              <ul className="mt-2 space-y-3">
                {orders.map((order) => (
                  <li key={order.id} className="rounded-lg bg-slate-800 p-3 text-sm">
                    <div className="flex justify-between gap-2">
                      <span className="font-medium">Order #{order.id}</span>
                      <span className="rounded bg-emerald-400/20 px-2 py-0.5 text-xs text-emerald-300">{order.status}</span>
                    </div>
                    <p className="mt-1 text-slate-300">{order.items.map((item) => `${item.quantity}× ${item.name}`).join(", ")}</p>
                    <p className="mt-1 text-xs text-slate-400">{order.pickup_time ?? "No pickup time"} · Rs {order.total}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
