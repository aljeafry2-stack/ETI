import * as XLSX from "xlsx";

export type ImportRow = {
  sku: string;
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
};

export type Field =
  | "sku"
  | "name"
  | "category"
  | "description"
  | "packetsPerCarton"
  | "piecesPerPacket"
  | "cartonPrice"
  | "packetPrice"
  | "piecePrice"
  | "retailPiecePrice"
  | "quantity"
  | "quantityUnit";

/** تطبيع النص العربي/الإنجليزي لمقارنة العناوين */
export function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .replace(/[\u064B-\u0652\u0640]/g, "") // تشكيل وتطويل
    .replace(/[إأآا]/g, "ا")
    .replace(/[ىي]/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[ؤئ]/g, "ء")
    .replace(/[_\-./\\(){}\[\]:;,'"`]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

const RULES: { field: Field; patterns: string[] }[] = [
  {
    field: "retailPiecePrice",
    patterns: [
      "سعر بيع الحبه",
      "سعر البيع للحبه",
      "سعر البيع بالحبه",
      "سعر بيع المحل",
      "سعر البيع في المحل",
      "سعر البيع",
      "سعر التجزئه",
      "بيع الحبه",
      "سعر حبه المحل",
      "retail price",
      "sell price",
      "sale price",
    ],
  },
  {
    field: "piecesPerPacket",
    patterns: [
      "حبه بالباكيت",
      "حبه في الباكيت",
      "الحبات بالباكيت",
      "عدد الحبات بالباكيت",
      "عدد الحبه في الباكيت",
      "pcs per pack",
      "pieces per packet",
      "units per pack",
    ],
  },
  {
    field: "packetsPerCarton",
    patterns: [
      "باكيت بالكرتون",
      "باكيت في الكرتون",
      "الباكيت بالكرتون",
      "عدد الباكيت بالكرتون",
      "عدد الباكيتات في الكرتون",
      "باكت بالكرتون",
      "packets per carton",
      "packs per carton",
    ],
  },
  { field: "cartonPrice", patterns: ["سعر الكرتون", "سعر الكارتون", "سعر كرتون", "carton price", "carton"] },
  { field: "packetPrice", patterns: ["سعر الباكيت", "سعر الباكت", "سعر باكيت", "packet price", "pack price"] },
  { field: "piecePrice", patterns: ["سعر الحبه", "سعر شراء الحبه", "سعر الحبه من الشركه", "piece price", "unit price"] },
  {
    field: "quantity",
    patterns: [
      "الكميه المتاحه",
      "الكميه المتوفره",
      "الكميه",
      "كميه",
      "المخزون",
      "المتوفر",
      "الرصيد",
      "quantity",
      "qty",
      "stock",
    ],
  },
  { field: "quantityUnit", patterns: ["وحيده الكميه", "الوحيده", "وحيده القياس", "unit of qty", "qty unit"] },
  { field: "description", patterns: ["الشرح", "الوصف", "الملاحظات", "شرح", "description", "notes", "note"] },
  {
    field: "category",
    patterns: ["الصنف", "التصنيف", "الفئه", "القسم", "المجموعه", "category", "type", "group"],
  },
  { field: "name", patterns: ["الماده", "اسم الماده", "المنتج", "اسم المنتج", "الاسم", "name", "product", "item"] },
  { field: "sku", patterns: ["الكود", "كود", "الباركود", "sku", "code", "barcode"] },
];

export function detectField(header: unknown): Field | null {
  const norm = normalizeHeader(header);
  if (!norm) return null;
  for (const rule of RULES) {
    for (const pattern of rule.patterns) {
      const p = normalizeHeader(pattern);
      if (norm === p || norm.includes(p)) return rule.field;
    }
  }
  return null;
}

function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const cleaned = String(value)
    .replace(/[\u066B]/g, ".")
    .replace(/[\u060C,]/g, "")
    .replace(/[^\d.\-]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function firstSheetRows(buffer: ArrayBuffer): Record<string, unknown>[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "", raw: true });
}

export type ParseOptions = {
  /** ماذا يعني عمود "سعر الحبة" إن وُجد: سعر بيع المحل أم سعر الشراء من ETI */
  piecePriceMeaning: "retail" | "cost";
};

export type ParseResult = {
  rows: ImportRow[];
  mapping: Record<string, Field | null>;
  detectedColumns: Record<Field, string>;
  skipped: number;
  sheetName: string;
};

export function parseWorkbook(buffer: ArrayBuffer, options: ParseOptions): ParseResult {
  const raw = firstSheetRows(buffer);
  const mapping: Record<string, Field | null> = {};
  const columns: string[] = raw.length > 0 ? Object.keys(raw[0]) : [];
  const detected: Partial<Record<Field, string>> = {};

  for (const column of columns) {
    const field = detectField(column);
    mapping[column] = field;
    if (field && !detected[field]) detected[field] = column;
  }

  // إن كان عمود سعر الحبة يعني سعر بيع المحل ننقله إلى خانة البيع بالتجزئة
  if (options.piecePriceMeaning === "retail" && detected.piecePrice && !detected.retailPiecePrice) {
    detected.retailPiecePrice = detected.piecePrice;
    detected.piecePrice = undefined as unknown as string;
    for (const column of Object.keys(mapping)) {
      if (mapping[column] === "piecePrice") mapping[column] = "retailPiecePrice";
    }
  }
  if (!detected.name && detected.category) detected.name = detected.category;

  const pick = (row: Record<string, unknown>, field: Field): unknown => {
    const column = detected[field];
    return column ? row[column] : "";
  };

  const rows: ImportRow[] = [];
  let skipped = 0;

  for (const row of raw) {
    const name = String(pick(row, "name") ?? "").trim();
    if (!name || name === "-" || name === "—") {
      skipped += 1;
      continue;
    }

    let packetsPerCarton = Math.round(toNumber(pick(row, "packetsPerCarton")));
    let piecesPerPacket = Math.round(toNumber(pick(row, "piecesPerPacket")));
    let cartonPrice = toNumber(pick(row, "cartonPrice"));
    let packetPrice = toNumber(pick(row, "packetPrice"));
    let piecePrice = toNumber(pick(row, "piecePrice"));
    const retailPiecePrice = toNumber(pick(row, "retailPiecePrice"));

    // استنتاج القيم الناقصة من بعضها
    if (packetsPerCarton <= 0 && packetPrice > 0 && cartonPrice > 0) {
      packetsPerCarton = Math.round(cartonPrice / packetPrice);
    }
    if (piecesPerPacket <= 0 && piecePrice > 0 && packetPrice > 0) {
      piecesPerPacket = Math.round(packetPrice / piecePrice);
    }
    if (cartonPrice <= 0 && packetPrice > 0 && packetsPerCarton > 0) {
      cartonPrice = Math.round(packetPrice * packetsPerCarton * 100) / 100;
    }
    if (packetPrice <= 0 && cartonPrice > 0 && packetsPerCarton > 0) {
      packetPrice = Math.round((cartonPrice / packetsPerCarton) * 100) / 100;
    }
    if (piecePrice <= 0 && packetPrice > 0 && piecesPerPacket > 0) {
      piecePrice = Math.round((packetPrice / piecesPerPacket) * 100) / 100;
    }

    let qty = toNumber(pick(row, "quantity"));
    const unitRaw = normalizeHeader(pick(row, "quantityUnit"));
    if (unitRaw.includes("باكيت") || unitRaw.includes("packet") || unitRaw.includes("pack")) {
      qty = packetsPerCarton > 0 ? qty / packetsPerCarton : qty;
    } else if (unitRaw.includes("حبه") || unitRaw.includes("piece") || unitRaw.includes("unit")) {
      const perCarton = packetsPerCarton * piecesPerPacket;
      qty = perCarton > 0 ? qty / perCarton : qty;
    }
    if (qty <= 0) qty = 0;

    rows.push({
      sku: String(pick(row, "sku") ?? "").trim(),
      name,
      category: String(pick(row, "category") ?? "").trim() || "عام",
      description: String(pick(row, "description") ?? "").trim(),
      packetsPerCarton,
      piecesPerPacket,
      cartonPrice: Math.round(cartonPrice * 100) / 100,
      packetPrice: Math.round(packetPrice * 100) / 100,
      piecePrice: Math.round(piecePrice * 100) / 100,
      retailPiecePrice: Math.round(retailPiecePrice * 100) / 100,
      stockCartons: Math.round(qty * 100) / 100,
    });
  }

  return {
    rows,
    mapping,
    detectedColumns: detected as Record<Field, string>,
    skipped,
    sheetName: "Sheet1",
  };
}

export const TEMPLATE_HEADERS = [
  "الكود",
  "المادة",
  "الصنف",
  "الشرح",
  "باكيت بالكرتون",
  "حبة بالباكيت",
  "سعر الكرتون",
  "سعر الباكيت",
  "سعر الحبة",
  "سعر بيع الحبة بالمحل",
];

export function buildTemplate(): Buffer {
  const data = [
    TEMPLATE_HEADERS,
    [
      "ETI-001",
      "بسكويت توبز",
      "بسكويت",
      "بسكويت محشي كريمة — عبوة ملونة",
      24,
      12,
      216,
      9,
      0.75,
      1,
    ],
    [
      "ETI-002",
      "عصير برتقال 1 لتر",
      "عصائر",
      "عصير طبيعي 100% — صالح 12 شهر",
      12,
      6,
      300,
      25,
      4.17,
      6,
    ],
    ["ETI-003", "شيبسي حار كبير", "شيبسي", "بطاطس مقرمشة بنكهة حارة", 30, 20, 420, 14, 0.7, 1],
  ];
  const sheet = XLSX.utils.aoa_to_sheet(data);
  sheet["!cols"] = [{ wch: 10 }, { wch: 24 }, { wch: 12 }, { wch: 32 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 20 }];
  const info = XLSX.utils.aoa_to_sheet([
    ["تعليمات ملف Excel الخاص بشركة ETI"],
    [""],
    ["1) لا تغيّر أسماء الأعمدة في الصف الأول."],
    ["2) لا تضع عمود الكمية في هذا الملف — المخزون يُعدَّل من لوحة الإدارة داخل التطبيق."],
    ["3) الصنف الجديد يظهر للعميل فقط بعد كتابة كميته من الإدارة (الكمية 0 = مخفي)."],
    ["4) سعر بيع الحبة بالمحل هو السعر الذي يبيع به صاحب المحل للحبة، ومنه يُحسب ربح العميل."],
    ["5) ارفع الملف من صفحة الإدارة: تُحدَّث الأسماء والأسعار والتعبئة، وتُحفظ الصور والكميات كما هي."],
  ]);
  info["!cols"] = [{ wch: 90 }];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "الأصناف");
  XLSX.utils.book_append_sheet(workbook, info, "تعليمات");
  const out = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" }) as Buffer;
  return out;
}
