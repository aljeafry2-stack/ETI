export type Unit = "carton" | "packet" | "piece";

export const UNITS: Unit[] = ["carton", "packet", "piece"];

export const UNIT_LABEL: Record<Unit, string> = {
  carton: "كرتون",
  packet: "باكيت",
  piece: "حبة",
};

export const UNIT_LABEL_PLURAL: Record<Unit, string> = {
  carton: "كرتون",
  packet: "باكيت",
  piece: "حبة",
};

export type ProductLike = {
  id: number;
  name: string;
  category: string;
  description: string;
  packetsPerCarton: number;
  piecesPerPacket: number;
  cartonPrice: number;
  packetPrice: number;
  piecePrice: number;
  retailPiecePrice: number;
  stockCartons: number;
  active?: boolean;
};

export function round2(value: number): number {
  return Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
}

export function num(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === "") return fallback;
  const parsed =
    typeof value === "number"
      ? value
      : Number(String(value).replace(/[^\d.,-]/g, "").replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : fallback;
}

export type PackLike = {
  packetsPerCarton: number;
  piecesPerPacket: number;
};

/** عدد الحبات في كل وحدة بيع */
export function piecesPerUnit(product: PackLike, unit: Unit): number {
  if (unit === "piece") return 1;
  if (unit === "packet") return product.piecesPerPacket || 0;
  return (product.packetsPerCarton || 0) * (product.piecesPerPacket || 0);
}

/** السعر الذي يدفعه العميل لـ ETI عن كل وحدة */
export function unitCost(product: ProductLike, unit: Unit): number {
  if (unit === "carton") {
    if (product.cartonPrice > 0) return product.cartonPrice;
    if (product.packetsPerCarton > 0 && product.packetPrice > 0) {
      return round2(product.packetsPerCarton * product.packetPrice);
    }
    const pieces = piecesPerUnit(product, "carton");
    return pieces > 0 ? round2(pieces * product.piecePrice) : 0;
  }
  if (unit === "packet") {
    if (product.packetPrice > 0) return product.packetPrice;
    if (product.packetsPerCarton > 0 && product.cartonPrice > 0) {
      return round2(product.cartonPrice / product.packetsPerCarton);
    }
    const pieces = piecesPerUnit(product, "packet");
    return pieces > 0 ? round2(pieces * product.piecePrice) : 0;
  }
  if (product.piecePrice > 0) return product.piecePrice;
  if (product.piecesPerPacket > 0 && product.packetPrice > 0) {
    return round2(product.packetPrice / product.piecesPerPacket);
  }
  return 0;
}

/** سعر البيع المفترض في المحل (سعر التجزئة) لكل وحدة */
export function unitRetail(product: ProductLike, unit: Unit): number {
  const pieces = piecesPerUnit(product, unit);
  if (pieces > 0 && product.retailPiecePrice > 0) return round2(pieces * product.retailPiecePrice);
  return 0;
}

export function unitProfit(product: ProductLike, unit: Unit): number {
  return round2(unitRetail(product, unit) - unitCost(product, unit));
}

/** الكمية المتاحة بوحدة معيّنة (تُحسب من مخزون الكراتين) */
export function availableQty(product: ProductLike, unit: Unit): number {
  const stock = product.stockCartons || 0;
  if (stock <= 0) return 0;
  if (unit === "carton") return Math.floor(stock * 100) / 100;
  if (unit === "packet") {
    const perCarton = product.packetsPerCarton || 0;
    return perCarton > 0 ? Math.floor(stock * perCarton) : Math.floor(stock);
  }
  const piecesPerCarton = piecesPerUnit(product, "carton");
  return piecesPerCarton > 0 ? Math.floor(stock * piecesPerCarton) : Math.floor(stock);
}

export function isInStock(product: ProductLike): boolean {
  return (product.stockCartons || 0) > 0 && product.active !== false;
}

/** وصف المخزون بشكل مقروء: 3 كرتون و 4 باكيت */
export function stockLabel(product: ProductLike): string {
  const stock = product.stockCartons || 0;
  if (stock <= 0) return "غير متوفر";
  const cartons = Math.floor(stock);
  const rest = round2(stock - cartons);
  const perCarton = product.packetsPerCarton || 0;
  const piecesPerPacket = product.piecesPerPacket || 0;
  if (rest > 0 && perCarton > 0) {
    const packets = Math.floor(rest * perCarton);
    return packets > 0 ? `${cartons} كرتون + ${packets} باكيت` : `${cartons} كرتون`;
  }
  if (cartons > 0 && rest <= 0) {
    const pieces = perCarton * piecesPerPacket;
    return pieces > 0 ? `${cartons} كرتون (${pieces} حبة)` : `${cartons} كرتون`;
  }
  return `${stock} كرتون`;
}

export function packSummary(product: ProductLike): string {
  const parts: string[] = [];
  if (product.packetsPerCarton > 0) parts.push(`${product.packetsPerCarton} باكيت بالكرتون`);
  if (product.piecesPerPacket > 0) parts.push(`${product.piecesPerPacket} حبة بالباكيت`);
  const pieces = piecesPerUnit(product, "carton");
  if (pieces > 0) parts.push(`${pieces} حبة بالكرتون`);
  return parts.join(" • ");
}

export function formatMoney(value: number, currency = ""): string {
  const rounded = round2(value);
  const hasFraction = Math.abs(rounded % 1) > 0.001;
  const text = rounded.toLocaleString("en-US", {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  });
  return currency ? `${text} ${currency}` : text;
}

export function formatQty(qty: number): string {
  const rounded = Math.round(qty * 100) / 100;
  return String(rounded);
}
