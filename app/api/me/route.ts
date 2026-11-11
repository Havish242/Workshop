import { NextResponse } from "next/server";
import { CURRENT_STUDENT_ID, formatSlot } from "@/lib/campusbite";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabase();
  const [walletResult, ordersResult] = await Promise.all([
    supabase.from("wallets").select("name, balance").eq("student_id", CURRENT_STUDENT_ID).single(),
    supabase
      .from("orders")
      .select("id, status, total, created_at, pickup_slots(slot_time), order_items(quantity, price, menu_items(name))")
      .eq("student_id", CURRENT_STUDENT_ID)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);
  if (walletResult.error || ordersResult.error) {
    const message = walletResult.error?.message ?? ordersResult.error?.message ?? "Could not load student data";
    console.error("[GET /api/me]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const orders = ordersResult.data.map((order) => {
    const slot = Array.isArray(order.pickup_slots) ? order.pickup_slots[0] : order.pickup_slots;
    const items = Array.isArray(order.order_items) ? order.order_items : [];
    return {
      id: order.id,
      status: order.status,
      total: order.total,
      pickup_time: slot ? formatSlot(slot.slot_time) : null,
      items: items.map((item) => {
        const menuItem = Array.isArray(item.menu_items) ? item.menu_items[0] : item.menu_items;
        return { name: menuItem?.name ?? "Unknown item", quantity: item.quantity };
      }),
    };
  });
  return NextResponse.json({ student: walletResult.data, orders });
}
