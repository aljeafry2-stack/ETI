import { desc } from "drizzle-orm";
import { AdminDashboard, type AdminOrder, type AdminProduct } from "@/components/admin/AdminDashboard";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { db } from "@/db";
import { orders, products } from "@/db/schema";
import { isAdmin, usingDefaultPassword } from "@/lib/auth";
import { getAllProducts } from "@/lib/products";
import { ensureSeed } from "@/lib/seed";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdmin())) {
    return <AdminLogin />;
  }

  await ensureSeed();
  const [rows, recentOrders, settings] = await Promise.all([
    getAllProducts(),
    db.select().from(orders).orderBy(desc(orders.id)).limit(15),
    getSettings(),
  ]);

  const list: AdminProduct[] = rows.map((row) => ({
    id: row.id,
    sku: row.sku,
    name: row.name,
    category: row.category,
    description: row.description,
    packetsPerCarton: row.packetsPerCarton,
    piecesPerPacket: row.piecesPerPacket,
    cartonPrice: row.cartonPrice,
    packetPrice: row.packetPrice,
    piecePrice: row.piecePrice,
    retailPiecePrice: row.retailPiecePrice,
    stockCartons: row.stockCartons,
    active: row.active,
    image:
      row.imageUrl && row.imageUrl !== ""
        ? row.imageUrl
        : row.imageId
          ? `/api/images/${row.imageId}`
          : null,
  }));

  const orderList: AdminOrder[] = recentOrders.map((row) => ({
    id: row.id,
    orderNumber: row.orderNumber,
    customerName: row.customerName,
    shopName: row.shopName,
    phone: row.phone,
    itemCount: row.itemCount,
    totalCost: row.totalCost,
    totalProfit: row.totalProfit,
    createdAt: row.createdAt.toISOString(),
  }));

  return (
    <AdminDashboard
      products={list}
      orders={orderList}
      settings={settings}
      passwordIsDefault={await usingDefaultPassword()}
    />
  );
}
