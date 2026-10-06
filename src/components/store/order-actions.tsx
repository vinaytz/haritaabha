"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { cancelMyOrder } from "@/actions/orders";
import { payWithRazorpay } from "@/lib/razorpay-client";
import { formatINR } from "@/lib/format";
import type { OrderStatus } from "@/models/Order";
import { useMockPayment } from "./mock-payment";

export function OrderActions(props: {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: string;
  razorpayOrderId: string;
  amount: number;
  mock: boolean;
  keyId: string;
  prefill: { name: string; email: string; contact: string };
}) {
  const router = useRouter();
  const [paying, setPaying] = useState(false);
  const [cancelling, startCancel] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const mock = useMockPayment();

  const canPay = props.status === "pending_payment" && props.paymentStatus !== "paid" && props.razorpayOrderId;
  const canCancel = props.status === "pending_payment" || props.status === "confirmed";
  if (!canPay && !canCancel) return null;

  async function pay() {
    setPaying(true);
    try {
      await payWithRazorpay({
        keyId: props.keyId,
        orderId: props.razorpayOrderId,
        amount: props.amount,
        mock: props.mock,
        prefill: props.prefill,
        orderNumber: props.orderNumber,
        openMock: () => mock.open(props.amount),
      });
      toast.success("Payment received. Your order is confirmed.");
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg !== "dismissed") toast.error(msg || "Payment couldn’t be confirmed.");
    } finally {
      setPaying(false);
    }
  }

  return (
    <>
      {mock.dialog}
      {canPay && (
        <div className="flex flex-col gap-4 rounded-[var(--radius-surface)] border border-marigold/50 bg-marigold-tint p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-3 text-[0.9375rem] text-[#5c3b00]">
            <AlertCircle className="mt-0.5 size-5 shrink-0" />
            <span>
              <span className="font-semibold">Payment not completed.</span> Your items aren’t reserved until you pay. If money was
              deducted, it will be matched automatically within a few minutes.
            </span>
          </p>
          <Button onClick={pay} loading={paying} className="shrink-0">
            Pay {formatINR(props.amount)}
          </Button>
        </div>
      )}
      {canCancel && (
        <div className="flex justify-end">
          <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <Button variant="danger-outline" size="sm" onClick={() => setConfirmOpen(true)}>
              Cancel order
            </Button>
            <DialogContent
              title={`Cancel order ${props.orderNumber}?`}
              description={props.paymentStatus === "paid" ? "Your payment will be refunded to the original method within 5–7 working days." : "You can always order again later."}
            >
              <div className="flex justify-end gap-3">
                <DialogClose asChild>
                  <Button variant="secondary">Keep order</Button>
                </DialogClose>
                <Button
                  variant="danger"
                  loading={cancelling}
                  onClick={() =>
                    startCancel(async () => {
                      const res = await cancelMyOrder(props.orderId);
                      if (!res.ok) toast.error(res.error);
                      else toast.success("Order cancelled");
                      setConfirmOpen(false);
                      router.refresh();
                    })
                  }
                >
                  Cancel order
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </>
  );
}
