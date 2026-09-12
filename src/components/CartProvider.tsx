"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ProductDTO } from "@/lib/dto";
import { round2, unitCost, unitProfit, unitRetail, type Unit } from "@/lib/pricing";

const CART_KEY = "eti_cart_v1";
const CUSTOMER_KEY = "eti_customer_v1";
const ORDERS_KEY = "eti_orders_v1";

export type CartItem = {
  key: string;
  productId: number;
  unit: Unit;
  qty: number;
  name: string;
  category: string;
  image: string | null;
  unitPrice: number;
  unitRetail: number;
  unitProfit: number;
  packetsPerCarton: number;
  piecesPerPacket: number;
  retailPiecePrice: number;
  stockCartons: number;
};

export type Customer = {
  customerName: string;
  shopName: string;
  phone: string;
  city: string;
  notes: string;
};

const EMPTY_CUSTOMER: Customer = { customerName: "", shopName: "", phone: "", city: "", notes: "" };

type CartContextValue = {
  ready: boolean;
  items: CartItem[];
  count: number;
  totalCost: number;
  totalRetail: number;
  totalProfit: number;
  customer: Customer;
  orderIds: number[];
  add: (product: ProductDTO, unit: Unit, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  saveCustomer: (customer: Customer) => void;
  rememberOrder: (id: number) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer>(EMPTY_CUSTOMER);
  const [orderIds, setOrderIds] = useState<number[]>([]);

  useEffect(() => {
    try {
      const rawCart = window.localStorage.getItem(CART_KEY);
      if (rawCart) {
        const parsed = JSON.parse(rawCart) as CartItem[];
        if (Array.isArray(parsed)) setItems(parsed.filter((item) => item && item.qty > 0));
      }
      const rawCustomer = window.localStorage.getItem(CUSTOMER_KEY);
      if (rawCustomer) {
        setCustomer({ ...EMPTY_CUSTOMER, ...(JSON.parse(rawCustomer) as Partial<Customer>) });
      }
      const rawOrders = window.localStorage.getItem(ORDERS_KEY);
      if (rawOrders) {
        const parsed = JSON.parse(rawOrders) as number[];
        if (Array.isArray(parsed)) setOrderIds(parsed.filter((id) => typeof id === "number"));
      }
    } catch {
      // تجاهل بيانات غير صالحة
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch {
      /* تجاهل */
    }
  }, [items, ready]);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
    } catch {
      /* تجاهل */
    }
  }, [customer, ready]);

  const add = useCallback((product: ProductDTO, unit: Unit, qty = 1) => {
    const key = `${product.id}:${unit}`;
    setItems((current) => {
      const existing = current.find((item) => item.key === key);
      if (existing) {
        return current.map((item) =>
          item.key === key ? { ...item, qty: round2(item.qty + qty) } : item,
        );
      }
      return [
        ...current,
        {
          key,
          productId: product.id,
          unit,
          qty,
          name: product.name,
          category: product.category,
          image: product.image,
          unitPrice: unitCost(product, unit),
          unitRetail: unitRetail(product, unit),
          unitProfit: unitProfit(product, unit),
          packetsPerCarton: product.packetsPerCarton,
          piecesPerPacket: product.piecesPerPacket,
          retailPiecePrice: product.retailPiecePrice,
          stockCartons: product.stockCartons,
        },
      ];
    });
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setItems((current) =>
      current
        .map((item) => (item.key === key ? { ...item, qty: round2(Math.max(0, qty)) } : item))
        .filter((item) => item.qty > 0),
    );
  }, []);

  const remove = useCallback((key: string) => {
    setItems((current) => current.filter((item) => item.key !== key));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const saveCustomer = useCallback((next: Customer) => setCustomer(next), []);

  const rememberOrder = useCallback((id: number) => {
    setOrderIds((current) => {
      const next = [id, ...current.filter((existing) => existing !== id)].slice(0, 20);
      try {
        window.localStorage.setItem(ORDERS_KEY, JSON.stringify(next));
      } catch {
        /* تجاهل */
      }
      return next;
    });
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const totalCost = round2(items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0));
    const totalRetail = round2(items.reduce((sum, item) => sum + item.unitRetail * item.qty, 0));
    return {
      ready,
      items,
      count: items.length,
      totalCost,
      totalRetail,
      totalProfit: round2(totalRetail - totalCost),
      customer,
      orderIds,
      add,
      setQty,
      remove,
      clear,
      saveCustomer,
      rememberOrder,
    };
  }, [ready, items, customer, orderIds, add, setQty, remove, clear, saveCustomer, rememberOrder]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
