import QRCode from "qrcode";
import { BatchIdSchema } from "@kisa/shared";
import { traceUrl } from "@/lib/web-url";

// A print-ready QR code (PNG) of a batch's public trace page, for pack labels.
// Behind the admin login (middleware); the trace page itself is public.
export async function GET(_req: Request, { params }: { params: { batchId: string } }) {
  const id = BatchIdSchema.safeParse(params.batchId);
  if (!id.success) return new Response("Invalid batch id", { status: 400 });

  const png = await QRCode.toBuffer(traceUrl(id.data), {
    type: "png",
    width: 1024, // ~3.5 cm at 750 dpi; scales down cleanly for labels
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#2E2219", light: "#FFFFFF" },
  });
  return new Response(new Uint8Array(png), {
    headers: {
      "content-type": "image/png",
      "content-disposition": `attachment; filename="kisa-trace-${id.data}.png"`,
      "cache-control": "private, max-age=3600",
    },
  });
}
