// Phase 1 mock order. The checkout saves a snapshot to sessionStorage so the
// success page can show it; Phase 2/3 replaces this with a server-created order
// (and Razorpay order + signature verification on the server).

export interface Address {
  name: string;
  phone: string;
  email: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pin: string;
}

export interface OrderSnapshot {
  id: string;
  placedAt: string; // ISO
  paymentMethod: string;
  address: Address;
  items: {
    productId: string;
    name: string;
    bagSizeKg: number;
    quantity: number;
    price: number;
    batchId: string;
    variety: string;
  }[];
  totals: { price: number };
}

// v2: rice-only model (older snapshots carried farmer names and a price split).
const KEY = "kisa-last-order-v2";

export function makeOrderId() {
  return `KS-ORD-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

export function saveOrder(order: OrderSnapshot) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(order));
  } catch {
    // Storage blocked (private mode etc.): the success page falls back to a generic message.
  }
}

export function loadOrder(): OrderSnapshot | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    const order = raw ? (JSON.parse(raw) as OrderSnapshot) : null;
    return order && typeof order.totals?.price === "number" ? order : null;
  } catch {
    return null;
  }
}
