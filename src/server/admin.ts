import "server-only";
import { Types, type QueryFilter } from "mongoose";
import { connectDB, getMongoClient } from "@/lib/db";
import { Category, NEEDS_ATTENTION, ORDER_PROBLEMS, Order, Product, type OrderDoc, type ProductDoc, ORDER_STATUSES } from "@/models";
import { serialize } from "@/lib/utils";

const PAGE = 25;
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function getDashboard() {
  await connectDB();
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start30 = new Date(startToday.getTime() - 29 * 86400000);
  const revenueStatuses = ["confirmed", "packed", "shipped", "out_for_delivery", "delivered"];

  const [byStatus, revenue30, revenueToday, daily, lowStock, recent, needsAttention] = await Promise.all([
    Order.aggregate<{ _id: string; n: number }>([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
    Order.aggregate<{ total: number; n: number }>([
      { $match: { createdAt: { $gte: start30 }, status: { $in: revenueStatuses } } },
      { $group: { _id: null, total: { $sum: "$amounts.total" }, n: { $sum: 1 } } },
    ]),
    Order.aggregate<{ total: number; n: number }>([
      { $match: { createdAt: { $gte: startToday }, status: { $in: revenueStatuses } } },
      { $group: { _id: null, total: { $sum: "$amounts.total" }, n: { $sum: 1 } } },
    ]),
    Order.aggregate<{ _id: string; total: number; n: number }>([
      { $match: { createdAt: { $gte: start30 }, status: { $in: revenueStatuses } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } },
          total: { $sum: "$amounts.total" },
          n: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Product.find({ isActive: true, stock: { $lte: 5 } }).select("name slug stock images").sort({ stock: 1 }).limit(8).lean(),
    Order.find().sort({ createdAt: -1 }).limit(8).select("orderNumber address.name amounts.total status payment.method createdAt").lean(),
    Order.countDocuments(ORDER_PROBLEMS),
  ]);

  // Fill missing days so the chart has 30 evenly spaced bars.
  const byDay = new Map(daily.map((d) => [d._id, d]));
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(start30.getTime() + i * 86400000);
    const key = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d);
    return { date: key, total: byDay.get(key)?.total ?? 0, n: byDay.get(key)?.n ?? 0 };
  });

  const counts = Object.fromEntries(byStatus.map((s) => [s._id, s.n]));
  return serialize<{
    counts: Record<string, number>;
    revenue30: { total: number; n: number };
    revenueToday: { total: number; n: number };
    days: { date: string; total: number; n: number }[];
    lowStock: { _id: string; name: string; slug: string; stock: number; images: { url: string }[] }[];
    recent: { _id: string; orderNumber: string; address: { name: string }; amounts: { total: number }; status: string; payment: { method: string }; createdAt: string }[];
    needsAttention: number;
  }>({
    counts,
    revenue30: revenue30[0] ?? { total: 0, n: 0 },
    revenueToday: revenueToday[0] ?? { total: 0, n: 0 },
    days,
    lowStock,
    recent,
    needsAttention,
  });
}

export async function listOrders(opts: { status?: string; q?: string; page?: number }) {
  await connectDB();
  const filter: QueryFilter<OrderDoc> = {};
  if (opts.status === "attention") Object.assign(filter, NEEDS_ATTENTION);
  else if (opts.status && (ORDER_STATUSES as readonly string[]).includes(opts.status)) filter.status = opts.status as OrderDoc["status"];
  if (opts.q) {
    const rx = new RegExp(escape(opts.q.trim()), "i");
    filter.$or = [{ orderNumber: rx }, { email: rx }, { "address.name": rx }, { "address.phone": rx }, { "shipment.awb": rx }];
  }
  const page = Math.max(1, opts.page ?? 1);
  const [items, total, counts, attention] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE)
      .limit(PAGE)
      .select("orderNumber email address.name address.city address.pincode items.quantity amounts.total status payment createdAt shipment.awb shipment.issue")
      .lean(),
    Order.countDocuments(filter),
    Order.aggregate<{ _id: string; n: number }>([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
    Order.countDocuments(NEEDS_ATTENTION),
  ]);
  return {
    items: serialize<(OrderDoc & { _id: string; createdAt: string })[]>(items),
    total,
    page,
    pages: Math.ceil(total / PAGE),
    counts: { ...Object.fromEntries(counts.map((c) => [c._id, c.n])), attention } as Record<string, number>,
  };
}

export async function getOrderAdmin(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  await connectDB();
  const o = await Order.findById(id).lean();
  return o ? serialize<OrderDoc & { _id: string; createdAt: string; updatedAt: string }>(o) : null;
}

export async function listProductsAdmin(opts: { q?: string; category?: string; status?: string; page?: number }) {
  await connectDB();
  const filter: QueryFilter<ProductDoc> = {};
  if (opts.q) {
    const rx = new RegExp(escape(opts.q.trim()), "i");
    filter.$or = [{ name: rx }, { sku: rx }, { botanicalName: rx }];
  }
  if (opts.category && Types.ObjectId.isValid(opts.category)) filter.category = new Types.ObjectId(opts.category);
  if (opts.status === "active") filter.isActive = true;
  if (opts.status === "hidden") filter.isActive = false;
  if (opts.status === "low") filter.stock = { $lte: 5 };
  if (opts.status === "out") filter.stock = 0;
  const page = Math.max(1, opts.page ?? 1);
  const [items, total] = await Promise.all([
    Product.find(filter)
      .populate<{ category: { name: string } }>("category", "name")
      .sort({ updatedAt: -1 })
      .skip((page - 1) * PAGE)
      .limit(PAGE)
      .select("name slug images price compareAtPrice stock isActive isFeatured category sku isDemo")
      .lean(),
    Product.countDocuments(filter),
  ]);
  return { items: serialize<(Omit<ProductDoc, "category"> & { _id: string; category: { name: string } | null })[]>(items), total, page, pages: Math.ceil(total / PAGE) };
}

export async function getProductAdmin(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  await connectDB();
  const p = await Product.findById(id).lean();
  return p ? serialize<ProductDoc & { _id: string; category: string }>(p) : null;
}

export async function listCategoriesAdmin() {
  await connectDB();
  const [cats, counts] = await Promise.all([
    Category.find().sort({ sortOrder: 1, name: 1 }).lean(),
    Product.aggregate<{ _id: Types.ObjectId; n: number }>([{ $group: { _id: "$category", n: { $sum: 1 } } }]),
  ]);
  const byId = new Map(counts.map((c) => [String(c._id), c.n]));
  return serialize<{ _id: string; name: string; slug: string; description: string; image?: { url?: string; fileId?: string }; sortOrder: number; isActive: boolean; productCount: number }[]>(
    cats.map((c) => ({ ...c, productCount: byId.get(String(c._id)) ?? 0 })),
  );
}

export async function listCustomers(opts: { q?: string; page?: number }) {
  await connectDB();
  const users = getMongoClient().db().collection("user");
  const filter: Record<string, unknown> = {};
  if (opts.q) {
    const rx = new RegExp(escape(opts.q.trim()), "i");
    filter.$or = [{ email: rx }, { name: rx }, { phone: rx }];
  }
  const page = Math.max(1, opts.page ?? 1);
  const [docs, total] = await Promise.all([
    users.find(filter).sort({ createdAt: -1 }).skip((page - 1) * PAGE).limit(PAGE).toArray(),
    users.countDocuments(filter),
  ]);
  const ids = docs.map((d) => String(d._id));
  const stats = await Order.aggregate<{ _id: string; n: number; spent: number; last: Date }>([
    { $match: { userId: { $in: ids }, status: { $nin: ["pending_payment", "cancelled"] } } },
    { $group: { _id: "$userId", n: { $sum: 1 }, spent: { $sum: "$amounts.total" }, last: { $max: "$createdAt" } } },
  ]);
  const byUser = new Map(stats.map((s) => [s._id, s]));
  return {
    items: docs.map((d) => ({
      id: String(d._id),
      name: String(d.name ?? ""),
      email: String(d.email ?? ""),
      phone: String(d.phone ?? ""),
      role: String(d.role ?? "user"),
      createdAt: new Date(d.createdAt as Date).toISOString(),
      orders: byUser.get(String(d._id))?.n ?? 0,
      spent: byUser.get(String(d._id))?.spent ?? 0,
      lastOrder: byUser.get(String(d._id))?.last?.toISOString() ?? null,
    })),
    total,
    page,
    pages: Math.ceil(total / PAGE),
  };
}
