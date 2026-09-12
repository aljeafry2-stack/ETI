import { db } from "@/db";
import { orderItems, orders, products } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import {
  UNIT_LABEL,
  formatMoney,
  formatQty,
  piecesPerUnit,
  round2,
  unitCost,
  unitProfit,
  unitRetail,
  type Unit,
} from "@/lib/pricing";
import type { AppSettings } from "@/lib/settings";

export type CartLineInput = {
  productId: number;
  unit: Unit;
  qty: number;
};

export type CustomerInput = {
  customerName: string;
  shopName?: string;
  phone?: string;
  city?: string;
  notes?: string;
};

export type ComputedLine = {
  productId: number;
  name: string;
  category: string;
  unit: Unit;
  qty: number;
  unitPrice: number;
  lineCost: number;
  lineRetail: number;
  lineProfit: number;
  packetsPerCarton: number;
  piecesPerPacket: number;
  retailPiecePrice: number;
};

export type ComputedOrder = {
  lines: ComputedLine[];
  totalCost: number;
  totalRetail: number;
  totalProfit: number;
  itemCount: number;
};

export async function computeOrder(lines: CartLineInput[]): Promise<ComputedOrder> {
  const cleaned = lines
    .filter((line) => Number(line.qty) > 0 && Number.isFinite(Number(line.productId)))
    .map((line) => ({
      productId: Number(line.productId),
      unit: (["carton", "packet", "piece"].includes(line.unit) ? line.unit : "carton") as Unit,
      qty: Number(line.qty),
    }));

  if (cleaned.length === 0) {
    throw new Error("السلة فارغة");
  }

  const ids = Array.from(new Set(cleaned.map((line) => line.productId)));
  const found = await db.select().from(products).where(inArray(products.id, ids));
  const byId = new Map(found.map((product) => [product.id, product]));

  const computed: ComputedLine[] = [];
  for (const line of cleaned) {
    const product = byId.get(line.productId);
    if (!product) continue;
    const qty = line.unit === "piece" ? Math.round(line.qty) : line.qty;
    const price = unitCost(product, line.unit);
    const retail = unitRetail(product, line.unit);
    computed.push({
      productId: product.id,
      name: product.name,
      category: product.category,
      unit: line.unit,
      qty,
      unitPrice: price,
      lineCost: round2(price * qty),
      lineRetail: round2(retail * qty),
      lineProfit: round2((retail - price) * qty),
      packetsPerCarton: product.packetsPerCarton,
      piecesPerPacket: product.piecesPerPacket,
      retailPiecePrice: product.retailPiecePrice,
    });
  }

  if (computed.length === 0) {
    throw new Error("لا توجد أصناف صالحة في الطلب");
  }

  const totalCost = round2(computed.reduce((sum, line) => sum + line.lineCost, 0));
  const totalRetail = round2(computed.reduce((sum, line) => sum + line.lineRetail, 0));
  const totalProfit = round2(totalRetail - totalCost);

  return {
    lines: computed,
    totalCost,
    totalRetail,
    totalProfit,
    itemCount: computed.length,
  };
}

export function buildInvoiceText(input: {
  orderNumber: string;
  customer: CustomerInput;
  order: ComputedOrder;
  settings: AppSettings;
  createdAt?: Date;
}): string {
  const { orderNumber, customer, order, settings } = input;
  const date = (input.createdAt ?? new Date()).toLocaleString("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const currency = settings.currency;

  const lines: string[] = [];
  lines.push(`*فاتورة طلب — ${settings.companyName}*`);
  lines.push(`رقم الطلب: ${orderNumber}`);
  if (customer.customerName) lines.push(`العميل: ${customer.customerName}`);
  if (customer.shopName) lines.push(`المحل: ${customer.shopName}`);
  if (customer.phone) lines.push(`الجوال: ${customer.phone}`);
  if (customer.city) lines.push(`المدينة: ${customer.city}`);
  lines.push(`التاريخ: ${date}`);
  lines.push("--------------------------------");
  order.lines.forEach((line, index) => {
    const pieces = piecesPerUnit(
      {
        packetsPerCarton: line.packetsPerCarton,
        piecesPerPacket: line.piecesPerPacket,
      },
      line.unit,
    );
    lines.push(
      `${index + 1}) ${line.name}${line.category ? ` [${line.category}]` : ""}`,
    );
    lines.push(
      `   الكمية: ${formatQty(line.qty)} ${UNIT_LABEL[line.unit]}${
        pieces > 1 ? ` (${formatQty(pieces * line.qty)} حبة)` : ""
      }`,
    );
    lines.push(`   سعر الوحدة: ${formatMoney(line.unitPrice, currency)}`);
    lines.push(`   الإجمالي: ${formatMoney(line.lineCost, currency)}`);
    lines.push(`   ربح العميل: ${formatMoney(line.lineProfit, currency)}`);
  });
  lines.push("--------------------------------");
  lines.push(`*إجمالي الفاتورة (للعميل): ${formatMoney(order.totalCost, currency)}*`);
  lines.push(`*إجمالي البيع المتوقع بالمحل: ${formatMoney(order.totalRetail, currency)}*`);
  lines.push(`*ربح العميل المتوقع: ${formatMoney(order.totalProfit, currency)}*`);
  if (customer.notes) lines.push(`ملاحظات: ${customer.notes}`);
  if (settings.invoiceNote) lines.push(settings.invoiceNote);
  return lines.join("\n");
}

export function whatsappLink(number: string, text: string): string {
  const digits = number.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

function generateOrderNumber(): string {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate(),
  ).padStart(2, "0")}`;
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `ETI-${stamp}-${random}`;
}

export async function createOrder(customer: CustomerInput, lines: CartLineInput[]) {
  const order = await computeOrder(lines);
  const orderNumber = generateOrderNumber();
  const settings = await import("@/lib/settings").then((mod) => mod.getSettings());
  const whatsappText = buildInvoiceText({ orderNumber, customer, order, settings });

  const [inserted] = await db
    .insert(orders)
    .values({
      orderNumber,
      customerName: customer.customerName || "عميل",
      shopName: customer.shopName ?? "",
      phone: customer.phone ?? "",
      city: customer.city ?? "",
      notes: customer.notes ?? "",
      itemCount: order.itemCount,
      totalCost: order.totalCost,
      totalRetail: order.totalRetail,
      totalProfit: order.totalProfit,
      whatsappText,
    })
    .returning();

  await db.insert(orderItems).values(
    order.lines.map((line) => ({
      orderId: inserted.id,
      productId: line.productId,
      name: line.name,
      category: line.category,
      unit: line.unit,
      qty: line.qty,
      unitPrice: line.unitPrice,
      lineCost: line.lineCost,
      lineRetail: line.lineRetail,
      lineProfit: line.lineProfit,
      packetsPerCarton: line.packetsPerCarton,
      piecesPerPacket: line.piecesPerPacket,
      retailPiecePrice: line.retailPiecePrice,
    })),
  );

  return { order: inserted, computed: order, whatsappText, orderNumber };
}

export async function getOrderWithItems(id: number) {
  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) return null;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
  return { order, items };
}

export { unitCost, unitProfit, unitRetail };
