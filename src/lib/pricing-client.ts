/** دوال مساعدة آمنة للاستخدام في المتصفح */

export function whatsappLink(number: string, text: string): string {
  const digits = (number || "").replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
