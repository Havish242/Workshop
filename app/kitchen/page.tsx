"use client";

import { useEffect, useState } from "react";

type KitchenOrder = {
  id: number;
  status: "placed" | "preparing" | "ready";
  total: number;
  student_name: string;
  pickup_time: string | null;
  items: { name: string; quantity: number }[];
};

const columns: { status: KitchenOrder["status"]; title: string; next: string; button: string }[] = [
  { status: "placed", title: "New orders", next: "preparing", button: "Start preparing" },
  { status: "preparing", title: "Preparing", next: "ready", button: "Mark ready" },
  { status: "ready", title: "Ready for pickup", next: "collected", button: "Collected" },
];

export default function KitchenPage() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      const response = await fetch("/api/kitchen", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not load kitchen orders");
      setOrders(data.orders);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load kitchen orders");
    }
  }

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 3000);
    return () => window.clearInterval(timer);
  }, []);

  async function advance(order: KitchenOrder, status: string) {
    const response = await fetch("/api/kitchen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: order.id, status }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Could not update order");
      return;
    }
    await load();
  }

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-white md:p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-400">CampusBite · SRM Canteen</p>
          <h1 className="text-2xl font-bold">Kitchen screen</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-sm text-emerald-300">● Live</span>
          <a href="/" className="text-sm text-slate-400 hover:text-white">Student view</a>
        </div>
      </header>
      {error && <p className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
      <div className="grid gap-4 md:grid-cols-3">
        {columns.map((column) => (
          <section key={column.status} className="rounded-xl bg-slate-900 p-3">
            <h2 className="mb-3 font-semibold">{column.title} <span className="text-sm text-slate-500">({orders.filter((order) => order.status === column.status).length})</span></h2>
            <div className="space-y-3">
              {orders.filter((order) => order.status === column.status).map((order) => (
                <article key={order.id} className="rounded-lg border border-slate-700 bg-slate-800 p-3">
                  <div className="flex justify-between text-sm"><span className="font-semibold">Order #{order.id}</span><span className="text-amber-300">{order.pickup_time}</span></div>
                  <p className="mt-2 text-sm text-slate-300">{order.student_name}</p>
                  <p className="mt-1 text-sm text-slate-400">{order.items.map((item) => `${item.quantity}× ${item.name}`).join(", ")}</p>
                  <div className="mt-3 flex items-center justify-between"><span className="text-sm font-semibold">Rs {order.total}</span><button onClick={() => advance(order, column.next)} className="rounded-md bg-emerald-500 px-2.5 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400">{column.button}</button></div>
                </article>
              ))}
              {orders.filter((order) => order.status === column.status).length === 0 && <p className="py-8 text-center text-sm text-slate-600">No orders</p>}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
