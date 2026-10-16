"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type InputHTMLAttributes } from "react";
import { useCartHydrated, useCartStore } from "@/store/cart";
import type { Product } from "@kisa/shared";
import { cartTotals, getCartLines } from "@/lib/cart";
import { formatINR } from "@/lib/format";
import { makeOrderId, saveOrder, type Address } from "@/lib/order";
import { Button, buttonClasses } from "@/components/ui/Button";

const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

const PAYMENT_METHODS = [
  { value: "upi", label: "UPI", hint: "GPay, PhonePe, Paytm" },
  { value: "card", label: "Card", hint: "Debit or credit" },
  { value: "cod", label: "Cash on delivery", hint: "Pay when it arrives" },
];

const EMPTY: Address = { name: "", phone: "", email: "", line1: "", line2: "", city: "", state: "", pin: "" };

type Errors = Partial<Record<keyof Address, string>>;

function validate(a: Address): Errors {
  const e: Errors = {};
  if (!a.name.trim()) e.name = "Enter your full name.";
  if (!/^[6-9]\d{9}$/.test(a.phone)) e.phone = "Enter a 10-digit Indian mobile number.";
  if (a.email && !/^\S+@\S+\.\S+$/.test(a.email)) e.email = "Enter a valid email or leave it blank.";
  if (!a.line1.trim()) e.line1 = "Enter your house / street address.";
  if (!a.city.trim()) e.city = "Enter your city or town.";
  if (!a.state) e.state = "Choose your state.";
  if (!/^[1-9]\d{5}$/.test(a.pin)) e.pin = "Enter a 6-digit PIN code.";
  return e;
}

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: keyof Address;
  error?: string;
  optional?: boolean;
}

function Field({ label, name, error, optional, className = "", ...props }: FieldProps) {
  const id = `checkout-${name}`;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label} {optional && <span className="font-normal text-soil/50">(optional)</span>}
      </label>
      <input
        id={id}
        name={name}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full rounded-xl border bg-white/90 px-3.5 py-2.5 text-base outline-none transition-colors focus:border-field focus:ring-2 focus:ring-field/20 ${
          error ? "border-red-700" : "border-husk/25"
        }`}
        {...props}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-800">
          {error}
        </p>
      )}
    </div>
  );
}

export function CheckoutView({ products }: { products: Product[] }) {
  const router = useRouter();
  const hydrated = useCartHydrated();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clear);

  const [address, setAddress] = useState<Address>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof Address, boolean>>>({});
  const [payment, setPayment] = useState("upi");
  const [status, setStatus] = useState<"idle" | "paying" | "done">("idle");
  const payTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(payTimer.current), []); // leaving mid-"payment" cancels it

  const lines = getCartLines(items, products);
  const totals = cartTotals(lines);

  const set = (name: keyof Address, value: string) => {
    const next = { ...address, [name]: value };
    setAddress(next);
    if (touched[name]) setErrors(validate(next));
  };
  const blur = (name: keyof Address) => {
    setTouched((t) => ({ ...t, [name]: true }));
    setErrors(validate(address));
  };
  const fieldError = (name: keyof Address) => (touched[name] ? errors[name] : undefined);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const found = validate(address);
    setErrors(found);
    setTouched(Object.fromEntries(Object.keys(EMPTY).map((k) => [k, true])));
    if (Object.keys(found).length > 0) {
      document.getElementById(`checkout-${Object.keys(found)[0]}`)?.focus();
      return;
    }

    // MOCK PAYMENT (Phase 1). In Phase 3 the server creates a Razorpay order, the
    // client opens Checkout.js, and the server verifies the signature + webhook.
    setStatus("paying");
    payTimer.current = setTimeout(() => {
      const id = makeOrderId();
      saveOrder({
        id,
        placedAt: new Date().toISOString(),
        paymentMethod: PAYMENT_METHODS.find((m) => m.value === payment)?.label ?? payment,
        address,
        items: lines.map(({ product, quantity }) => ({
          productId: product.id,
          name: product.name,
          bagSizeKg: product.bagSizeKg,
          quantity,
          price: product.price,
          batchId: product.batchId,
          variety: product.variety.name,
        })),
        totals: { price: totals.price },
      });
      setStatus("done"); // keeps the "empty cart" view from flashing before navigation
      clearCart();
      router.push(`/order/success?id=${id}`);
    }, 1200);
  };

  if (!hydrated) return <p className="mt-10 text-sm text-soil/60">Loading your cart…</p>;
  if (status === "done") return <p className="mt-10 text-sm text-soil/60">Order placed. Redirecting…</p>;

  if (lines.length === 0) {
    return (
      <div className="mt-10 rounded-2xl border border-dashed border-husk/30 p-12 text-center">
        <p className="font-display text-2xl text-field">Your cart is empty</p>
        <p className="mt-2 text-soil/70">Add a bag of rice before checking out.</p>
        <Link href="/shop" className={buttonClasses("primary", "mt-6")}>
          Shop now
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px]">
      <div className="space-y-8">
        <fieldset className="rounded-2xl bg-white/70 p-6 shadow-card ring-1 ring-husk/10" disabled={status === "paying"}>
          <legend className="float-left mb-5 w-full font-display text-xl font-semibold text-field">Delivery address</legend>
          <div className="clear-left grid gap-4 sm:grid-cols-2">
            <Field label="Full name" name="name" autoComplete="name" value={address.name}
              onChange={(e) => set("name", e.target.value)} onBlur={() => blur("name")} error={fieldError("name")} className="sm:col-span-2" />
            <Field label="Mobile number" name="phone" type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={10}
              placeholder="10 digits" value={address.phone}
              onChange={(e) => set("phone", e.target.value.replace(/\D/g, ""))} onBlur={() => blur("phone")} error={fieldError("phone")} />
            <Field label="Email" name="email" type="email" autoComplete="email" optional value={address.email}
              onChange={(e) => set("email", e.target.value)} onBlur={() => blur("email")} error={fieldError("email")} />
            <Field label="House no., street" name="line1" autoComplete="address-line1" value={address.line1}
              onChange={(e) => set("line1", e.target.value)} onBlur={() => blur("line1")} error={fieldError("line1")} className="sm:col-span-2" />
            <Field label="Area, landmark" name="line2" autoComplete="address-line2" optional value={address.line2}
              onChange={(e) => set("line2", e.target.value)} className="sm:col-span-2" />
            <Field label="City / town" name="city" autoComplete="address-level2" value={address.city}
              onChange={(e) => set("city", e.target.value)} onBlur={() => blur("city")} error={fieldError("city")} />
            <Field label="PIN code" name="pin" inputMode="numeric" autoComplete="postal-code" maxLength={6} value={address.pin}
              onChange={(e) => set("pin", e.target.value.replace(/\D/g, ""))} onBlur={() => blur("pin")} error={fieldError("pin")} />
            <div className="sm:col-span-2">
              <label htmlFor="checkout-state" className="mb-1.5 block text-sm font-medium">State</label>
              <select
                id="checkout-state"
                name="state"
                autoComplete="address-level1"
                value={address.state}
                onChange={(e) => set("state", e.target.value)}
                onBlur={() => blur("state")}
                aria-invalid={Boolean(fieldError("state"))}
                aria-describedby={fieldError("state") ? "checkout-state-error" : undefined}
                className={`w-full rounded-xl border bg-white/90 px-3.5 py-2.5 text-base outline-none focus:border-field focus:ring-2 focus:ring-field/20 ${
                  fieldError("state") ? "border-red-700" : "border-husk/25"
                }`}
              >
                <option value="">Choose state</option>
                {STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {fieldError("state") && <p id="checkout-state-error" className="mt-1 text-sm text-red-800">{fieldError("state")}</p>}
            </div>
          </div>
        </fieldset>

        <fieldset className="rounded-2xl bg-white/70 p-6 shadow-card ring-1 ring-husk/10" disabled={status === "paying"}>
          <legend className="float-left mb-5 w-full font-display text-xl font-semibold text-field">Payment</legend>
          <div className="clear-left grid gap-3 sm:grid-cols-3">
            {PAYMENT_METHODS.map((m) => (
              <label
                key={m.value}
                className={`flex cursor-pointer flex-col rounded-xl border p-4 transition-colors ${
                  payment === m.value ? "border-field bg-field/5 ring-2 ring-field/20" : "border-husk/25 hover:border-field/50"
                }`}
              >
                <span className="flex items-center gap-2 font-semibold">
                  <input type="radio" name="payment" value={m.value} checked={payment === m.value}
                    onChange={() => setPayment(m.value)} className="accent-field" />
                  {m.label}
                </span>
                <span className="mt-1 pl-6 text-xs text-soil/60">{m.hint}</span>
              </label>
            ))}
          </div>
          <p className="mt-4 rounded-xl bg-paddy/15 p-3 text-sm text-husk-dark">
            Demo store: no payment is taken. Secure Razorpay payments arrive in a later phase.
          </p>
        </fieldset>
      </div>

      <aside className="h-fit rounded-2xl bg-white/70 p-6 shadow-card ring-1 ring-husk/10 lg:sticky lg:top-24">
        <h2 className="text-xl font-semibold text-field">Order summary</h2>
        <ul className="mt-4 divide-y divide-husk/10 text-sm">
          {lines.map(({ product, quantity }) => (
            <li key={product.id} className="flex justify-between gap-3 py-2.5">
              <span>
                <span className="font-medium">{product.name}</span> × {quantity}
                <span className="block text-xs text-soil/60">
                  {product.bagSizeKg} kg · {product.variety.name}
                </span>
              </span>
              <span className="tabular-nums">{formatINR(product.price * quantity)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-3 flex justify-between text-sm text-soil/70">
          <span>Delivery</span>
          <span>Free (demo)</span>
        </div>
        <div className="mt-4 flex justify-between border-t border-husk/15 pt-4 font-semibold">
          <span>Total</span>
          <span className="tabular-nums">{formatINR(totals.price)}</span>
        </div>

        <Button type="submit" className="mt-5 w-full py-3 text-base" disabled={status === "paying"}>
          {status === "paying" ? (
            <>
              <span
                className="h-4 w-4 rounded-full border-2 border-soil/30 border-t-soil motion-safe:animate-spin"
                aria-hidden="true"
              />
              Processing…
            </>
          ) : (
            `Pay ${formatINR(totals.price)}`
          )}
        </Button>
        <p className="mt-2 text-center text-xs text-soil/50" role="status">
          {status === "paying" ? "Placing your demo order…" : "Mock payment for the demo"}
        </p>
      </aside>
    </form>
  );
}
