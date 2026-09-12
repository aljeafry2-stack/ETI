import { CartClient } from "@/components/CartClient";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const settings = await getSettings();
  return <CartClient currency={settings.currency} />;
}
