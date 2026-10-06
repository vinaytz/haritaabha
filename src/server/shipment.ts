import "server-only";
import { connectDB } from "@/lib/db";
import { env, integrations, shippingMocked } from "@/lib/env";
import { shiprocket, ShiprocketError } from "@/lib/shiprocket";
import type { HydratedDocument } from "mongoose";
import { Order, Product, Settings, type OrderDoc, type OrderStatus } from "@/models";

export class ShipmentError extends Error {}

const rupees = (paise: number) => Math.round(paise) / 100;

function srDate(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  const ist = new Date(d.getTime() + 5.5 * 3600 * 1000);
  return `${ist.getUTCFullYear()}-${p(ist.getUTCMonth() + 1)}-${p(ist.getUTCDate())} ${p(ist.getUTCHours())}:${p(ist.getUTCMinutes())}`;
}

type CourierRate = { courier_company_id?: number; freight_charge?: number; cod_charges?: number; rate?: number };

/** What Shiprocket will charge the store for this courier (freight + COD charge), in paise. Best effort. */
async function courierCost(courierId: number | undefined, pincode: string, weightKg: number, cod: boolean) {
  if (!courierId) return undefined;
  try {
    const s = await Settings.findOne({ key: "store" }).select("pickupPincode").lean();
    if (!s?.pickupPincode) return undefined;
    const res = await shiprocket<{ data?: { available_courier_companies?: CourierRate[] } }>("/courier/serviceability/", {
      query: { pickup_postcode: s.pickupPincode, delivery_postcode: pincode, weight: Math.max(0.5, weightKg), cod: cod ? 1 : 0 },
    });
    const c = res.data?.available_courier_companies?.find((x) => x.courier_company_id === courierId);
    if (!c) return undefined;
    const total = c.rate ?? (c.freight_charge ?? 0) + (cod ? (c.cod_charges ?? 0) : 0);
    return total > 0 ? Math.round(total * 100) : undefined;
  } catch {
    return undefined;
  }
}

/** Create the shipment on Shiprocket: order → AWB (auto courier) → pickup → label. Safe to retry after a partial failure. */
export async function createShipment(orderId: string) {
  await connectDB();
  const order = await Order.findById(orderId);
  if (!order) throw new ShipmentError("Order not found.");
  if (!["confirmed", "packed"].includes(order.status)) throw new ShipmentError("Only confirmed or packed orders can be shipped.");
  if (order.shipment?.awb) throw new ShipmentError("This order already has a shipment.");

  // Package: total weight, largest box among the items.
  const products = await Product.find({ _id: { $in: order.items.map((i) => i.product) } }).select("shipping").lean();
  const dims = products.reduce(
    (acc, p) => ({
      l: Math.max(acc.l, p.shipping?.lengthCm ?? 20),
      b: Math.max(acc.b, p.shipping?.breadthCm ?? 20),
      h: Math.max(acc.h, p.shipping?.heightCm ?? 30),
    }),
    { l: 10, b: 10, h: 10 },
  );
  const weight = order.items.reduce((n, item) => {
    const p = products.find((x) => String(x._id) === String(item.product));
    return n + (p?.shipping?.weightKg ?? 1) * item.quantity;
  }, 0);

  if (shippingMocked) {
    const awb = `MOCK${Date.now().toString().slice(-9)}`;
    order.shipment = {
      provider: "mock",
      shiprocketOrderId: `mock-${order.orderNumber}`,
      shipmentId: `mock-${order._id}`,
      awb,
      courier: "Demo Express",
      labelUrl: "",
      trackingUrl: "",
      etd: new Date(Date.now() + 5 * 86400000),
      lastEvent: "Pickup scheduled",
      lastEventAt: new Date(),
      issue: "",
    };
    order.status = "shipped";
    order.timeline.push({ status: "shipped", note: `Shipped with Demo Express · AWB ${awb} (mock mode)`, by: "admin", at: new Date() });
    await order.save();
    return { awb, courier: "Demo Express", mock: true };
  }

  const a = order.address!;
  const cod = order.payment!.method === "cod";
  const [first, ...rest] = a.name.trim().split(/\s+/);
  try {
    // A previous attempt may have created the Shiprocket order and then failed at AWB (e.g. empty wallet). Reuse it.
    let shipmentId = order.shipment?.provider === "shiprocket" ? order.shipment.shipmentId : undefined;
    if (!shipmentId) {
      // Shiprocket keeps cancelled orders, so a re-ship needs a fresh channel order id.
      const reships = order.timeline.filter((t) => t.note?.startsWith("Shipment cancelled")).length;
      const created = await shiprocket<{ order_id: number; shipment_id: number; status?: string }>("/orders/create/adhoc", {
        body: {
          order_id: reships ? `${order.orderNumber}-R${reships}` : order.orderNumber,
          order_date: srDate(order.createdAt),
          pickup_location: env.shiprocket.pickupLocation,
          billing_customer_name: first,
          billing_last_name: rest.join(" ") || ".",
          billing_address: a.line1,
          billing_address_2: [a.line2, a.landmark].filter(Boolean).join(", "),
          billing_city: a.city,
          billing_pincode: a.pincode,
          billing_state: a.state,
          billing_country: "India",
          billing_email: order.email,
          billing_phone: a.phone,
          shipping_is_billing: true,
          order_items: order.items.map((i) => ({
            name: i.name,
            sku: i.sku || i.slug,
            units: i.quantity,
            selling_price: rupees(i.price),
            discount: 0,
            tax: 0,
            hsn: "",
          })),
          payment_method: cod ? "COD" : "Prepaid",
          shipping_charges: rupees(order.amounts.shipping + order.amounts.codFee),
          sub_total: rupees(order.amounts.subtotal),
          length: Math.ceil(dims.l),
          breadth: Math.ceil(dims.b),
          height: Math.ceil(dims.h),
          weight: Math.max(0.5, Number(weight.toFixed(2))),
        },
      });
      if (!created.shipment_id) throw new ShipmentError("Shiprocket didn’t return a shipment. Check the order in the Shiprocket dashboard.");
      shipmentId = String(created.shipment_id);
      order.shipment = { provider: "shiprocket", shiprocketOrderId: String(created.order_id), shipmentId, issue: "" };
      await order.save();
    }

    const awbRes = await shiprocket<{
      awb_assign_status?: number;
      message?: string;
      response?: { data?: { awb_code?: string; courier_name?: string; courier_company_id?: number; awb_assign_error?: string } };
    }>("/courier/assign/awb", { body: { shipment_id: shipmentId } });
    const data = awbRes.response?.data;
    const awb = data?.awb_code;
    if (!awb) {
      const why = data?.awb_assign_error || awbRes.message;
      throw new ShipmentError(
        `Shiprocket created the order but couldn’t assign a courier${why ? `: ${why}` : ""}. Check your wallet balance and KYC, then click Ship again.`,
      );
    }
    const courier = data?.courier_name ?? "";

    const pickupOk = await shiprocket("/courier/generate/pickup", { body: { shipment_id: [shipmentId] } })
      .then(() => true)
      .catch((e) => {
        console.warn("pickup request failed", e);
        return false;
      });
    const label = await shiprocket<{ label_url?: string }>("/courier/generate/label", { body: { shipment_id: [shipmentId] } }).catch(() => ({ label_url: "" }));
    const cost = await courierCost(data?.courier_company_id, a.pincode, weight, cod);

    order.shipment = {
      ...order.shipment,
      provider: "shiprocket",
      awb,
      courier,
      cost,
      labelUrl: label.label_url ?? "",
      trackingUrl: `https://shiprocket.co/tracking/${awb}`,
      lastEvent: pickupOk ? "Pickup scheduled" : "AWB assigned",
      lastEventAt: new Date(),
      issue: pickupOk ? "" : "Pickup couldn’t be scheduled automatically. Schedule it from Shiprocket → Orders → Ready to ship.",
    };
    order.status = "shipped";
    order.timeline.push({ status: "shipped", note: `Shipped with ${courier || "courier"} · AWB ${awb}`, by: "admin", at: new Date() });
    await order.save();
    return { awb, courier, mock: false };
  } catch (err) {
    if (err instanceof ShiprocketError) throw new ShipmentError(`Shiprocket: ${err.message}`);
    throw err;
  }
}

/** Cancel the courier booking (before pickup) and put the order back to "packed" so it can be re-shipped or cancelled. */
export async function cancelShipment(orderId: string) {
  await connectDB();
  const order = await Order.findById(orderId);
  if (!order?.shipment?.awb) throw new ShipmentError("This order has no shipment to cancel.");
  if (order.status !== "shipped") throw new ShipmentError("The courier already has this parcel. Ask Shiprocket support to stop it.");
  if (order.shipment.provider === "shiprocket" && order.shipment.shiprocketOrderId) {
    try {
      await shiprocket("/orders/cancel", { body: { ids: [Number(order.shipment.shiprocketOrderId)] } });
    } catch (err) {
      if (err instanceof ShiprocketError) throw new ShipmentError(`Shiprocket: ${err.message}`);
      throw err;
    }
  }
  revertToPacked(order, `Shipment cancelled by admin (AWB ${order.shipment.awb})`, "admin");
  await order.save();
}

type OrderDocument = HydratedDocument<OrderDoc>;

function revertToPacked(order: OrderDocument, note: string, by: string) {
  order.shipment = { provider: "", issue: "" };
  order.status = "packed";
  order.timeline.push({ status: "packed", note, by, at: new Date() });
}

export type CourierEvent =
  | { kind: "status"; status: OrderStatus }
  | { kind: "cancelled" }
  | { kind: "issue"; issue: string }
  | { kind: "info" };

/** Classify a Shiprocket status ("IN TRANSIT", "RTO INITIATED", "UNDELIVERED"…) into what it means for the order. */
export function classifyCourierStatus(raw: string): CourierEvent {
  const s = raw.toUpperCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  if (s.startsWith("RTO") || s.includes("RETURN")) {
    if (s.includes("DELIVERED") && !s.includes("UNDELIVERED")) return { kind: "status", status: "returned" };
    return { kind: "issue", issue: `Returning to you (RTO): ${raw}. The customer refused it or couldn’t be reached.` };
  }
  if (s.includes("CANCEL")) return { kind: "cancelled" };
  if (s.includes("UNDELIVERED") || s.includes("NDR") || s.includes("DELIVERY FAILED") || s.includes("FAILED DELIVERY") || s.includes("CONTACT CUSTOMER CARE"))
    return { kind: "issue", issue: `Delivery attempt failed: ${raw}. Act on it in Shiprocket → NDR (reattempt or return).` };
  if (s.includes("LOST") || s.includes("DAMAGED") || s.includes("DESTROYED") || s.includes("DISPOSED"))
    return { kind: "issue", issue: `Courier reported the parcel ${raw.toLowerCase()}. Raise a claim from Shiprocket and contact the customer.` };
  if (s.includes("PICKUP EXCEPTION") || s.includes("PICKUP ERROR")) return { kind: "issue", issue: `Pickup problem: ${raw}. Check Shiprocket → Pickups.` };
  if (s.includes("OUT FOR DELIVERY")) return { kind: "status", status: "out_for_delivery" };
  if (s === "DELIVERED" || s === "SHIPMENT DELIVERED") return { kind: "status", status: "delivered" };
  if (s.includes("PICKED UP") || s.includes("IN TRANSIT") || s === "SHIPPED" || s.includes("REACHED") || s.includes("DELAYED") || s.includes("MISROUTED"))
    return { kind: "status", status: "shipped" };
  return { kind: "info" }; // AWB ASSIGNED, PICKUP SCHEDULED, OUT FOR PICKUP, LABEL GENERATED…
}

const RANK: Partial<Record<OrderStatus, number>> = { confirmed: 1, packed: 2, shipped: 3, out_for_delivery: 4, delivered: 5, returned: 6 };

/** Apply a courier tracking event (webhook or manual refresh). Status only moves forward; problems are flagged for the admin. */
export async function applyTrackingEvent(awb: string, rawStatus: string, at?: Date, etd?: Date) {
  await connectDB();
  const order = await Order.findOne({ "shipment.awb": awb });
  if (!order) return false;
  const when = at ?? new Date();
  const event = classifyCourierStatus(rawStatus);
  const current = order.status as OrderStatus;

  if (event.kind === "cancelled") {
    // Cancelled in Shiprocket before the courier collected it: back to packed so the admin can re-ship or cancel.
    if (current === "shipped") revertToPacked(order, `Shipment cancelled on Shiprocket (AWB ${awb}). Ship again or cancel the order.`, "courier");
    await order.save();
    return true;
  }

  order.shipment!.lastEvent = rawStatus;
  order.shipment!.lastEventAt = when;
  if (etd) order.shipment!.etd = etd;

  if (event.kind === "issue" && order.shipment!.issue !== event.issue) {
    order.shipment!.issue = event.issue;
    order.timeline.push({ status: current, note: rawStatus, by: "courier", at: when });
  }

  if (event.kind === "status") {
    const next = event.status;
    if ((RANK[next] ?? 0) >= (RANK[current] ?? 0)) order.shipment!.issue = ""; // moving again — earlier problem resolved
    if ((RANK[next] ?? 0) > (RANK[current] ?? 0)) {
      order.status = next;
      order.timeline.push({ status: next, note: rawStatus, by: "courier", at: when });
      if (next === "delivered" && order.payment!.method === "cod") order.payment!.status = "cod_collected";
      if (next === "returned") {
        // A refund owed is tracked separately (paid + returned); this flag is about the parcel itself.
        order.shipment!.issue = "Parcel returned to you. Check the plant and restock it from Products if it’s healthy, then mark this as handled.";
      }
    }
  }
  await order.save();
  return true;
}

/** Admin marks a courier problem as handled. */
export async function resolveShipmentIssue(orderId: string) {
  await connectDB();
  const order = await Order.findById(orderId);
  if (!order?.shipment?.issue) return;
  order.shipment.issue = "";
  order.timeline.push({ status: order.status, note: "Courier issue marked as handled", by: "admin", at: new Date() });
  await order.save();
}

export async function refreshTracking(orderId: string) {
  await connectDB();
  const order = await Order.findById(orderId).select("shipment").lean();
  const awb = order?.shipment?.awb;
  if (!awb) throw new ShipmentError("No shipment for this order yet.");
  if (!integrations.shiprocket || order.shipment?.provider === "mock") throw new ShipmentError("Tracking refresh needs Shiprocket to be connected.");
  const res = await shiprocket<{ tracking_data?: { shipment_status?: number; shipment_track?: { current_status?: string; edd?: string }[]; shipment_track_activities?: { date: string; activity: string; "sr-status-label"?: string }[] } }>(
    `/courier/track/awb/${encodeURIComponent(awb)}`,
  );
  const track = res.tracking_data?.shipment_track?.[0];
  const status = track?.current_status ?? res.tracking_data?.shipment_track_activities?.[0]?.["sr-status-label"];
  if (status) await applyTrackingEvent(awb, status, undefined, track?.edd ? new Date(track.edd) : undefined);
  return status ?? "No updates yet";
}
