const AR_DIACRITICS = /[\u064B-\u0652\u0640]/g;

/** تطبيع نص البحث: إزالة التشكيل وتوحيد الألف والياء والتاء المربوطة */
export function normalizeSearch(value: unknown): string {
  return String(value ?? "")
    .replace(AR_DIACRITICS, "")
    .replace(/[إأآا]/g, "ا")
    .replace(/[ىي]/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[ؤئ]/g, "ء")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
