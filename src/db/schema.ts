import {
  boolean,
  doublePrecision,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/**
 * الصور تُحفظ داخل قاعدة البيانات (base64) حتى لا تضيع عند إعادة البناء،
 * وتُقدَّم للمتصفح عبر /api/images/[id]
 */
export const images = pgTable("images", {
  id: serial("id").primaryKey(),
  mimeType: text("mime_type").notNull().default("image/jpeg"),
  data: text("data").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    sku: text("sku"),
    name: text("name").notNull(),
    category: text("category").notNull().default("عام"),
    description: text("description").notNull().default(""),
    // التعبئة
    packetsPerCarton: integer("packets_per_carton").notNull().default(0),
    piecesPerPacket: integer("pieces_per_packet").notNull().default(0),
    // أسعار البيع من ETI للعميل
    cartonPrice: doublePrecision("carton_price").notNull().default(0),
    packetPrice: doublePrecision("packet_price").notNull().default(0),
    piecePrice: doublePrecision("piece_price").notNull().default(0),
    // سعر بيع الحبة في المحل (سعر التجزئة)
    retailPiecePrice: doublePrecision("retail_piece_price").notNull().default(0),
    // الكمية المتوفرة (بوحدة الكرتون، وتقبل كسور مثل 2.5)
    stockCartons: doublePrecision("stock_cartons").notNull().default(0),
    imageId: integer("image_id"),
    imageUrl: text("image_url"),
    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("products_category_idx").on(table.category)],
);

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull(),
  customerName: text("customer_name").notNull(),
  shopName: text("shop_name").notNull().default(""),
  phone: text("phone").notNull().default(""),
  city: text("city").notNull().default(""),
  notes: text("notes").notNull().default(""),
  itemCount: integer("item_count").notNull().default(0),
  totalCost: doublePrecision("total_cost").notNull().default(0),
  totalRetail: doublePrecision("total_retail").notNull().default(0),
  totalProfit: doublePrecision("total_profit").notNull().default(0),
  status: text("status").notNull().default("جديد"),
  whatsappText: text("whatsapp_text").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orderItems = pgTable(
  "order_items",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: integer("product_id"),
    name: text("name").notNull(),
    category: text("category").notNull().default(""),
    unit: text("unit").notNull(), // carton | packet | piece
    qty: doublePrecision("qty").notNull().default(1),
    unitPrice: doublePrecision("unit_price").notNull().default(0),
    lineCost: doublePrecision("line_cost").notNull().default(0),
    lineRetail: doublePrecision("line_retail").notNull().default(0),
    lineProfit: doublePrecision("line_profit").notNull().default(0),
    packetsPerCarton: integer("packets_per_carton").notNull().default(0),
    piecesPerPacket: integer("pieces_per_packet").notNull().default(0),
    retailPiecePrice: doublePrecision("retail_piece_price").notNull().default(0),
  },
  (table) => [index("order_items_order_idx").on(table.orderId)],
);

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
