import { NextResponse } from "next/server";
import { z } from "zod";
import { formatSlot } from "@/lib/campusbite";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const updateStatusSchema = z.object({
  order_id: z.number().int().positive(),
  status: z.enum(["preparing", "ready", "collected"]),
});

export async function GET() {
  const { data, error } = await getSupabase()
    .from("orders")
    .select("id, status, total, created_at, wallets(name), pickup_slots(slot_time), order_items(quantity, price, menu_items(name))")
    .in("status", ["placed", "preparing", "ready"])
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[GET /api/kitchen]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const orders = data.map((order) => {
    const student = Array.isArray(order.wallets) ? order.wallets[0] : order.wallets;
    const slot = Array.isArray(order.pickup_slots) ? order.pickup_slots[0] : order.pickup_slots;
    const items = Array.isArray(order.order_items) ? order.order_items : [];
    return {
      id: order.id,
      status: order.status,
      total: order.total,
      student_name: student?.name ?? "Student",
      pickup_time: slot ? formatSlot(slot.slot_time) : null,
      items: items.map((item) => {
        const menuItem = Array.isArray(item.menu_items) ? item.menu_items[0] : item.menu_items;
        return { name: menuItem?.name ?? "Unknown item", quantity: item.quantity };
      }),
    };
  });
  return NextResponse.json({ orders });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = updateStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid kitchen update", details: parsed.error.issues }, { status: 400 });
  }
  const { order_id, status } = parsed.data;
  const { data: order, error: findError } = await getSupabase()
    .from("orders")
    .select("status")
    .eq("id", order_id)
    .maybeSingle();
  if (findError) {
    console.error("[POST /api/kitchen]", findError.message);
    return NextResponse.json({ error: findError.message }, { status: 500 });
  }
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  const nextStatus: Record<string, string> = { placed: "preparing", preparing: "ready", ready: "collected" };
  if (nextStatus[order.status] !== status) {
    return NextResponse.json({ error: `Cannot change ${order.status} to ${status}` }, { status: 409 });
  }
  const { data, error } = await getSupabase().from("orders").update({ status }).eq("id", order_id).select("id, status").single();
  if (error) {
    console.error("[POST /api/kitchen]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ order: data });
}
