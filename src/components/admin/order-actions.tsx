"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CircleAlert, PackageCheck, RefreshCw, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/input";
import { adminCancelOrder, adminRefund, cancelOrderShipment, refreshOrderTracking, resolveOrderIssue, saveAdminNote, shipOrder, updateOrderStatus } from "@/actions/admin";
import type { OrderStatus } from "@/models/Order";

export function OrderAdminActions({
  orderId,
  status,
  paymentMethod,
  paymentStatus,
  hasShipment,
  shippingMocked,
  issue,
}: {
  orderId: string;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: string;
  hasShipment: boolean;
  shippingMocked: boolean;
  issue?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [unshipOpen, setUnshipOpen] = useState(false);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, success: string) =>
    start(async () => {
      const res = await fn();
      if (res.ok) toast.success(success);
      else toast.error(res.error);
      router.refresh();
    });

  const canCancel = ["pending_payment", "confirmed", "on_hold", "packed"].includes(status);
  const canRefund = paymentMethod === "razorpay" && paymentStatus === "paid" && ["cancelled", "on_hold", "returned"].includes(status);

  const primary =
    status === "confirmed" ? (
      <Button loading={pending} onClick={() => run(() => updateOrderStatus(orderId, "packed", "Packed at the nursery"), "Marked as packed")}>
        <PackageCheck className="size-4" /> Mark as packed
      </Button>
    ) : status === "packed" && !hasShipment ? (
      <Button loading={pending} onClick={() => run(async () => {
        const r = await shipOrder(orderId);
        if (r.ok) toast.message(`AWB ${r.awb}${r.courier ? ` · ${r.courier}` : ""}`);
        return r;
      }, "Shipment created")}>
        <Truck className="size-4" /> Ship with Shiprocket
      </Button>
    ) : status === "on_hold" ? (
      <Button loading={pending} onClick={() => run(() => updateOrderStatus(orderId, "confirmed", "Resolved by admin"), "Moved back to confirmed")}>
        Resolve and confirm
      </Button>
    ) : null;

  const hint: Partial<Record<OrderStatus, string>> = {
    pending_payment: "Waiting for the customer to pay. Unpaid orders don’t reserve stock.",
    confirmed: "Pack the plants, then mark as packed.",
    packed: shippingMocked ? "Shiprocket isn’t connected, so a demo AWB will be generated." : "Creates the shipment on Shiprocket, assigns a courier, schedules pickup and prepares the label.",
    on_hold: "Paid, but stock ran out or the order was cancelled. Refund it, or restock and confirm.",
    shipped: "Booked with the courier. Status updates arrive automatically from Shiprocket. Need to change something before pickup? Cancel the shipment.",
    out_for_delivery: "Out for delivery today.",
  };

  const refundDue = paymentStatus === "paid" && ["cancelled", "returned"].includes(status);
  if (refundDue) hint[status] = "The customer paid online and hasn’t been refunded yet.";

  if (!primary && !canCancel && !canRefund && !hasShipment && !issue && !["shipped", "out_for_delivery"].includes(status)) return null;

  return (
    <div className="rounded-[var(--radius-surface)] border border-line bg-paper p-5">
      {issue && (
        <div className="mb-4 flex items-start gap-2.5 rounded-[var(--radius-control)] border border-danger/25 bg-danger-tint p-3 text-sm text-danger">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <div className="flex-1">
            <p className="font-semibold">Courier issue</p>
            <p className="mt-0.5 text-ink">{issue}</p>
          </div>
          <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => resolveOrderIssue(orderId), "Marked as handled")}>
            Mark as handled
          </Button>
        </div>
      )}
      {hint[status] && <p className="mb-4 text-sm text-ink-soft">{hint[status]}</p>}
      <div className="flex flex-wrap gap-2">
        {primary}
        {hasShipment && ["shipped", "out_for_delivery"].includes(status) && (
          <>
            {!shippingMocked && (
              <Button variant="secondary" loading={pending} onClick={() => run(async () => {
                const r = await refreshOrderTracking(orderId);
                if (r.ok) toast.message(`Latest: ${r.status}`);
                return r;
              }, "Tracking refreshed")}>
                <RefreshCw className="size-4" /> Refresh tracking
              </Button>
            )}
            {status === "shipped" && (
              <Button variant="secondary" disabled={pending} onClick={() => run(() => updateOrderStatus(orderId, "out_for_delivery"), "Marked out for delivery")}>
                Mark out for delivery
              </Button>
            )}
            <Button variant="secondary" disabled={pending} onClick={() => run(() => updateOrderStatus(orderId, "delivered"), "Marked delivered")}>
              Mark delivered
            </Button>
          </>
        )}
        {hasShipment && status === "shipped" && (
          <Dialog open={unshipOpen} onOpenChange={setUnshipOpen}>
            <Button variant="danger-outline" onClick={() => setUnshipOpen(true)}>
              Cancel shipment
            </Button>
            <DialogContent
              title="Cancel this shipment?"
              description="Cancels the courier booking on Shiprocket (only works before pickup) and moves the order back to packed. The shipping charge returns to your Shiprocket wallet. The customer’s order stays open."
            >
              <div className="mt-2 flex justify-end gap-3">
                <DialogClose asChild><Button variant="secondary">Keep shipment</Button></DialogClose>
                <Button variant="danger" loading={pending} onClick={() => { run(() => cancelOrderShipment(orderId), "Shipment cancelled"); setUnshipOpen(false); }}>
                  Cancel shipment
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
        {canRefund && (
          <Button variant="danger-outline" disabled={pending} onClick={() => run(() => adminRefund(orderId), "Refund issued")}>
            Refund payment
          </Button>
        )}
        {canCancel && (
          <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
            <Button variant="danger-outline" onClick={() => setCancelOpen(true)}>
              Cancel order
            </Button>
            <DialogContent title="Cancel this order?" description={paymentStatus === "paid" ? "Stock is returned. You’ll still need to refund the payment after cancelling." : "Stock is returned to the catalogue."}>
              <Textarea placeholder="Reason (shown to the customer)" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} />
              <div className="mt-4 flex justify-end gap-3">
                <DialogClose asChild><Button variant="secondary">Keep order</Button></DialogClose>
                <Button variant="danger" loading={pending} onClick={() => { run(() => adminCancelOrder(orderId, reason), "Order cancelled"); setCancelOpen(false); }}>
                  Cancel order
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}

export function AdminNote({ orderId, initial }: { orderId: string; initial: string }) {
  const [note, setNote] = useState(initial);
  const [pending, start] = useTransition();
  return (
    <div>
      <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Only visible to admins" maxLength={1000} />
      <Button
        size="sm"
        variant="secondary"
        className="mt-2"
        loading={pending}
        disabled={note === initial}
        onClick={() => start(async () => {
          const r = await saveAdminNote(orderId, note);
          if (r.ok) toast.success("Note saved");
          else toast.error(r.error);
        })}
      >
        Save note
      </Button>
    </div>
  );
}
