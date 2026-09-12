import { OrdersList } from "@/components/OrdersList";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const settings = await getSettings();
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <h1 className="text-2xl font-black text-slate-900">طلباتي</h1>
      <OrdersList currency={settings.currency} />
    </div>
  );
}
