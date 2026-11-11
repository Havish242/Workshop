"use client";

import { useEffect, useState } from "react";

type MenuItem = { id: number; name: string; category: string; price: number; is_veg: boolean; stock: number; description: string };

const categories = ["meal", "snack", "sweet", "drink"];

export default function MenuPanel({ refreshKey }: { refreshKey: number }) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/menu", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Could not load menu");
        if (active) {
          setItems(data.items);
          setError("");
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Could not load menu");
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
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="font-semibold">Today&apos;s menu</h2>
        <p className="text-xs text-slate-500">Live availability · prices in rupees</p>
      </div>
      {error ? <p className="p-4 text-sm text-red-600">{error}</p> : categories.map((category) => {
        const categoryItems = items.filter((item) => item.category === category);
        return (
          <section key={category} className="border-b border-slate-100 last:border-0">
            <h3 className="px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{category}s</h3>
            <ul className="divide-y divide-slate-100">
              {categoryItems.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium"><span className={item.is_veg ? "mr-1.5 text-emerald-600" : "mr-1.5 text-red-600"}>●</span>{item.name}</p>
                    <p className="truncate text-xs text-slate-500">{item.description}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold">Rs {item.price}</p>
                    {item.stock === 0 ? <span className="text-xs text-red-600">Sold out</span> : item.stock <= 3 ? <span className="text-xs text-amber-600">Only {item.stock} left</span> : <span className="text-xs text-slate-400">Available</span>}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
