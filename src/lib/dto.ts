import type { Product } from "@/db/schema";
import { productImage } from "@/lib/products";

export type ProductDTO = {
  id: number;
  sku: string | null;
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
  image: string | null;
};

export function toProductDTO(product: Product): ProductDTO {
  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    category: product.category,
    description: product.description,
    packetsPerCarton: product.packetsPerCarton,
    piecesPerPacket: product.piecesPerPacket,
    cartonPrice: product.cartonPrice,
    packetPrice: product.packetPrice,
    piecePrice: product.piecePrice,
    retailPiecePrice: product.retailPiecePrice,
    stockCartons: product.stockCartons,
    image: productImage(product),
  };
}
