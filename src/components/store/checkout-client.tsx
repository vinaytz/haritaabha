"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Banknote, Check, CreditCard, Lock, MapPin, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Textarea } from "@/components/ui/input";
import { getQuote, placeOrderAction } from "@/actions/checkout";
import { checkDelivery } from "@/actions/delivery";
import { formatINR, formatShortDate } from "@/lib/format";
import { payWithRazorpay } from "@/lib/razorpay-client";
import { track } from "@/lib/track";
import type { AddressInput } from "@/lib/validation";
import type { SavedAddress } from "@/server/account";
import { cartSubtotal, useCart } from "@/stores/cart";
import { cn } from "@/lib/utils";
import { useHydrated } from "@/lib/use-hydrated";
import { AddressBlock, AddressForm } from "./address-form";
import { useCartRefresh } from "./cart-drawer";
import { useMockPayment } from "./mock-payment";

type Quote = Awaited<ReturnType<typeof getQuote>>;

function Step({ n, title, done, children, action }: { n: number; title: string; done?: boolean; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-[var(--radius-surface)] border border-line bg-paper p-5 md:p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="flex items-center gap-3 text-lg font-semibold">
          <span className={cn("grid size-7 place-items-center rounded-full text-sm font-bold", done ? "bg-leaf text-white" : "bg-mist text-ink")}>
            {done ? <Check className="size-4" strokeWidth={3} /> : n}
          </span>
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function CheckoutClient({ addresses, email }: { addresses: SavedAddress[]; email: string }) {
  const router = useRouter();
  const lines = useCart((s) => s.lines);
  const clear = useCart((s) => s.clear);
  const mounted = useHydrated();
  const notice = useCartRefresh(mounted);

  const defaultAddr = addresses.find((a) => a.isDefault) ?? addresses[0];
  const [addressId, setAddressId] = useState<string | null>(defaultAddr?._id ?? null);
  const [newAddress, setNewAddress] = useState<AddressInput | null>(null);
  const [showForm, setShowForm] = useState(addresses.length === 0);
  const [saveNew, setSaveNew] = useState(true);
  const [chosenMethod, setMethod] = useState<"razorpay" | "cod">("razorpay");
  const [note, setNote] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [eta, setEta] = useState<{ date: string | null; cod: boolean; deliverable: boolean } | null>(null);
  const [placing, startPlacing] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const mock = useMockPayment();

  const items = useMemo(() => lines.filter((l) => l.maxQty > 0).map((l) => ({ productId: l.productId, quantity: l.quantity })), [lines]);
  const itemsKey = JSON.stringify(items);
  const selected: (AddressInput | SavedAddress) | null = newAddress ?? addresses.find((a) => a._id === addressId) ?? null;
  const pincode = selected?.pincode;
  // Fall back automatically when the chosen method isn't available for this order/pincode.
  const codUnavailable = !!quote && (!quote.codAllowed || (eta !== null && !eta.cod));
  const method: "razorpay" | "cod" =
    chosenMethod === "cod" && codUnavailable ? "razorpay" : chosenMethod === "razorpay" && quote && !quote.onlineAllowed && quote.codAllowed ? "cod" : chosenMethod;

  useEffect(() => {
    if (!items.length) return;
    let live = true;
    getQuote({ items, method }).then((q) => live && setQuote(q)).catch(() => {});
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey, method]);

  useEffect(() => {
    if (!pincode) return;
    let live = true;
    checkDelivery({ pincode, weightKg: quote?.weightKg }).then((r) => {
      if (!live) return;
      setEta("error" in r ? null : { date: r.etaDate, cod: r.cod, deliverable: r.deliverable });
    });
    return () => {
      live = false;
    };
  }, [pincode, quote?.weightKg]);


  useEffect(() => {
    if (mounted && lines.length) {
      track.beginCheckout(lines.map((l) => ({ id: l.productId, name: l.name, price: l.price, quantity: l.quantity })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  if (!mounted) {
    return <div className="container-page py-20"><div className="skeleton mx-auto h-96 max-w-4xl rounded-[var(--radius-surface)]" /></div>;
  }

  if (!lines.length) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={<ShoppingBag className="size-6" strokeWidth={1.6} />}
          title="Your cart is empty"
          action={<Button asChild><Link href="/plants">Browse plants</Link></Button>}
        >
          Add a plant or two, then come back to check out.
        </EmptyState>
      </div>
    );
  }

  const hasSoldOut = lines.some((l) => l.maxQty <= 0);
  const clientSubtotal = cartSubtotal(lines.filter((l) => l.maxQty > 0));
  const total = quote?.total ?? clientSubtotal;
  const codBlocked = codUnavailable;
  const undeliverable = eta !== null && !eta.deliverable;
  const canPlace = !!selected && !showForm && !hasSoldOut && !undeliverable && !!quote && !quote.problems.length;

  function place() {
    setError(null);
    startPlacing(async () => {
      const res = await placeOrderAction({
        items,
        method,
        note: note.trim() || undefined,
        ...(newAddress ? { address: newAddress, saveAddress: saveNew } : { addressId: addressId ?? undefined }),
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const purchased = lines.map((l) => ({ id: l.productId, name: l.name, price: l.price, quantity: l.quantity }));
      if (res.kind === "cod") {
        track.purchase(res.orderNumber, total, purchased);
        clear();
        router.push(`/account/orders/${res.orderId}?placed=1`);
        return;
      }
      try {
        await payWithRazorpay({
          ...res.razorpay,
          prefill: res.prefill,
          orderNumber: res.orderNumber,
          openMock: () => mock.open(res.razorpay.amount),
        });
        track.purchase(res.orderNumber, res.razorpay.amount, purchased);
        clear();
        router.push(`/account/orders/${res.orderId}?placed=1`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (msg === "dismissed") {
          toast("Payment not completed", {
            description: `Order ${res.orderNumber} is saved. You can pay for it from your orders page.`,
            action: { label: "View order", onClick: () => router.push(`/account/orders/${res.orderId}`) },
          });
        } else {
          setError(msg || "We couldn’t confirm your payment. If money was deducted, it will be matched automatically within a few minutes.");
        }
      }
    });
  }

  return (
    <div className="container-page pb-20 pt-6 md:pt-10">
      {mock.dialog}
      <h1 className="font-display text-[2rem] leading-tight md:text-[2.5rem]">Checkout</h1>
      <p className="mt-1 text-ink-soft">Signed in as {email}</p>
      {notice && <p className="mt-5 rounded-[var(--radius-control)] bg-marigold-tint px-4 py-3 text-sm text-[#6b4500]">{notice}</p>}

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1fr_400px] lg:gap-10">
        <div className="space-y-5">
          <Step
            n={1}
            title="Delivery address"
            done={!!selected && !showForm}
            action={
              !showForm && addresses.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setShowForm(true)}>
                  <Plus className="size-4" /> New address
                </Button>
              )
            }
          >
            {showForm ? (
              <AddressForm
                defaultValues={newAddress ?? undefined}
                submitLabel="Deliver here"
                showSave
                saveChecked={saveNew}
                onSaveChange={setSaveNew}
                onCancel={addresses.length || newAddress ? () => setShowForm(false) : undefined}
                onSubmit={(v) => {
                  setNewAddress(v);
                  setAddressId(null);
                  setShowForm(false);
                }}
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {newAddress && (
                  <label className={cn("relative cursor-pointer rounded-[var(--radius-control)] border p-4", "border-leaf ring-1 ring-leaf")}>
                    <input type="radio" name="address" className="sr-only" checked readOnly />
                    <AddressBlock a={newAddress} />
                    <button type="button" className="mt-2 text-sm font-semibold text-leaf hover:underline" onClick={() => setShowForm(true)}>
                      Edit
                    </button>
                  </label>
                )}
                {addresses.map((a) => {
                  const active = !newAddress && addressId === a._id;
                  return (
                    <label
                      key={a._id}
                      className={cn(
                        "relative cursor-pointer rounded-[var(--radius-control)] border p-4 transition-colors",
                        active ? "border-leaf ring-1 ring-leaf" : "border-line hover:border-line-strong",
                      )}
                    >
                      <input
                        type="radio"
                        name="address"
                        className="sr-only"
                        checked={active}
                        onChange={() => {
                          setAddressId(a._id);
                          setNewAddress(null);
                        }}
                      />
                      {active && <Check className="absolute right-3 top-3 size-4 text-leaf" strokeWidth={3} />}
                      <AddressBlock a={a} />
                      {a.isDefault && <span className="mt-2 inline-block text-[0.8125rem] text-ink-soft">Default</span>}
                    </label>
                  );
                })}
              </div>
            )}
            {!showForm && eta && (
              <p className={cn("mt-4 flex items-center gap-2 text-sm", eta.deliverable ? "text-leaf-deep" : "text-danger")}>
                <MapPin className="size-4" />
                {eta.deliverable
                  ? eta.date
                    ? `Estimated delivery by ${formatShortDate(eta.date)}`
                    : "We deliver to this pincode"
                  : "Sorry, we don’t deliver to this pincode yet. Choose another address."}
              </p>
            )}
          </Step>

          <Step n={2} title="Payment" done={false}>
            <div className="space-y-3" role="radiogroup" aria-label="Payment method">
              {[
                {
                  value: "razorpay" as const,
                  icon: CreditCard,
                  title: "Pay online",
                  body: "UPI, debit and credit cards, net banking and wallets through Razorpay.",
                  disabled: quote ? !quote.onlineAllowed : false,
                  extra: null,
                },
                {
                  value: "cod" as const,
                  icon: Banknote,
                  title: "Cash on delivery",
                  body: codBlocked
                    ? eta && !eta.cod
                      ? "Not available for this pincode."
                      : "Not available for this order."
                    : "Pay in cash or UPI when the courier arrives.",
                  disabled: codBlocked,
                  extra: quote && quote.codFeeIfChosen > 0 && !codBlocked ? `+ ${formatINR(quote.codFeeIfChosen)}` : null,
                },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={cn(
                    "flex items-start gap-4 rounded-[var(--radius-control)] border p-4 transition-colors",
                    opt.disabled ? "cursor-not-allowed border-line bg-mist/40 opacity-60" : "cursor-pointer",
                    !opt.disabled && method === opt.value ? "border-leaf ring-1 ring-leaf" : !opt.disabled && "border-line hover:border-line-strong",
                  )}
                >
                  <input
                    type="radio"
                    name="method"
                    value={opt.value}
                    checked={method === opt.value}
                    disabled={opt.disabled}
                    onChange={() => setMethod(opt.value)}
                    className="mt-1 size-4 accent-[var(--color-leaf)]"
                  />
                  <opt.icon className="mt-0.5 size-5 shrink-0 text-ink-soft" strokeWidth={1.6} />
                  <span className="flex-1">
                    <span className="flex items-center justify-between gap-3 font-semibold">
                      {opt.title}
                      {opt.extra && <span className="text-sm font-medium text-ink-soft font-numeric">{opt.extra}</span>}
                    </span>
                    <span className="mt-0.5 block text-sm text-ink-soft">{opt.body}</span>
                  </span>
                </label>
              ))}
            </div>
            <details className="mt-5 text-sm">
              <summary className="cursor-pointer font-medium text-ink-soft hover:text-ink">Add a note for the nursery</summary>
              <Textarea
                className="mt-3"
                maxLength={300}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Gift message, delivery instructions…"
              />
            </details>
          </Step>
        </div>

        {/* Summary */}
        <aside className="rounded-[var(--radius-surface)] border border-line bg-mist/40 p-5 md:p-6 lg:sticky lg:top-32">
          <h2 className="text-lg font-semibold">Order summary</h2>
          <ul className="mt-4 divide-y divide-line">
            {lines.map((l) => (
              <li key={l.productId} className="flex items-center gap-3 py-3">
                <span className="relative size-14 shrink-0 overflow-hidden rounded-md bg-paper">
                  {l.image && <Image src={l.image} alt="" fill sizes="56px" className="object-cover" />}
                  <span className="absolute -right-0 -top-0 grid min-w-5 place-items-center rounded-bl-md bg-ink px-1 text-[0.6875rem] font-bold leading-5 text-white">
                    {l.quantity}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.9375rem]">{l.name}</span>
                  {l.maxQty <= 0 && <span className="text-[0.8125rem] font-medium text-danger">Sold out — remove it from your cart</span>}
                </span>
                <span className="text-[0.9375rem] font-medium font-numeric">{formatINR(l.price * l.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-2 border-t border-line pt-4 text-[0.9375rem]">
            <div className="flex justify-between">
              <dt className="text-ink-soft">Subtotal</dt>
              <dd className="font-numeric">{formatINR(quote?.subtotal ?? clientSubtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">Delivery</dt>
              <dd className="font-numeric">{quote ? (quote.shipping === 0 ? <span className="font-medium text-leaf-deep">Free</span> : formatINR(quote.shipping)) : "—"}</dd>
            </div>
            {quote && quote.codFee > 0 && (
              <div className="flex justify-between">
                <dt className="text-ink-soft">Cash on delivery fee</dt>
                <dd className="font-numeric">{formatINR(quote.codFee)}</dd>
              </div>
            )}
            <div className="flex items-baseline justify-between border-t border-line pt-3">
              <dt className="font-semibold">Total</dt>
              <dd className="text-xl font-semibold font-numeric">{formatINR(total)}</dd>
            </div>
          </dl>
          {quote?.problems.length ? (
            <p className="mt-4 rounded-[var(--radius-control)] bg-danger-tint px-3 py-2.5 text-sm text-danger">{quote.problems.join(" ")}</p>
          ) : null}
          {error && (
            <p className="mt-4 rounded-[var(--radius-control)] bg-danger-tint px-3 py-2.5 text-sm text-danger" role="alert">
              {error}
            </p>
          )}
          <Button size="lg" block className="mt-5" disabled={!canPlace} loading={placing} onClick={place}>
            {method === "cod" ? "Place order" : `Pay ${formatINR(total)}`}
          </Button>
          {!selected || showForm ? (
            <p className="mt-2 text-center text-[0.8125rem] text-ink-soft">Add a delivery address to continue</p>
          ) : null}
          <p className="mt-4 flex items-center justify-center gap-1.5 text-[0.8125rem] text-ink-soft">
            <Lock className="size-3.5" /> Payments are encrypted and processed by Razorpay
          </p>
        </aside>
      </div>
    </div>
  );
}
