import { NextResponse, type NextRequest } from "next/server";
import crypto from "node:crypto";
import { env } from "@/lib/env";
import { applyTrackingEvent } from "@/server/shipment";

/**
 * Shiprocket tracking webhook. Configure in Shiprocket → Settings → API → Webhooks with this URL
 * and the SHIPROCKET_WEBHOOK_TOKEN as the token (sent in the x-api-key header).
 * The path deliberately avoids the word "shiprocket" — Shiprocket rejects webhook URLs containing it.
 */
export async function POST(req: NextRequest) {
  const token = req.headers.get("x-api-key") ?? "";
  const expected = env.shiprocket.webhookToken;
  const ok =
    expected.length > 0 && token.length === expected.length && crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as {
    awb?: string | number;
    current_status?: string;
    shipment_status?: string;
    current_timestamp?: string;
    etd?: string;
  } | null;
  const awb = body?.awb ? String(body.awb) : "";
  const status = body?.current_status || body?.shipment_status || "";
  if (awb && status) {
    const at = body?.current_timestamp ? new Date(body.current_timestamp) : undefined;
    const etd = body?.etd ? new Date(body.etd) : undefined;
    await applyTrackingEvent(awb, status, at && !isNaN(+at) ? at : undefined, etd && !isNaN(+etd) ? etd : undefined).catch((e) =>
      console.error("courier webhook", e),
    );
  }
  // Always 200 so Shiprocket doesn't disable the webhook over an unknown AWB.
  return NextResponse.json({ ok: true });
}
