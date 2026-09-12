import { CatalogClient } from "@/components/CatalogClient";
import { toProductDTO } from "@/lib/dto";
import { getPublicProducts } from "@/lib/products";
import { ensureSeed } from "@/lib/seed";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await ensureSeed();
  const [products, settings] = await Promise.all([getPublicProducts(), getSettings()]);

  return (
    <CatalogClient
      products={products.map(toProductDTO)}
      currency={settings.currency}
    />
  );
}
