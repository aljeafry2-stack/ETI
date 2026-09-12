import { db } from "@/db";
import { products, type Product } from "@/db/schema";
import { asc, desc, sql } from "drizzle-orm";

export type PublicProduct = Product;

export async function getPublicProducts(): Promise<Product[]> {
  return db
    .select()
    .from(products)
    .where(sql`${products.active} = true and ${products.stockCartons} > 0`)
    .orderBy(asc(products.category), asc(products.sortOrder), asc(products.name));
}

export async function getAllProducts(): Promise<Product[]> {
  return db
    .select()
    .from(products)
    .orderBy(asc(products.category), asc(products.sortOrder), desc(products.id));
}

export async function getCategories(list: Product[]): Promise<string[]> {
  const set = new Set<string>();
  for (const product of list) {
    if (product.category.trim()) set.add(product.category.trim());
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, "ar"));
}

export function productImage(product: Pick<Product, "imageId" | "imageUrl">): string | null {
  if (product.imageUrl && product.imageUrl.trim() !== "") return product.imageUrl.trim();
  if (product.imageId) return `/api/images/${product.imageId}`;
  return null;
}
