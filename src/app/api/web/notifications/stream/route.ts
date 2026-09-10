import { getCurrentUser } from "@/lib/auth";
import { getUserNotificationsSince } from "@/services/notification";

/**
 * GET /api/web/notifications/stream — stream SSE (Server-Sent Events)
 * notifikasi user login (rekomendasi 1.2: realtime tanpa polling dari
 * klien). Setiap interval pendek server menanyakan notifikasi baru
 * sejak pengecekan terakhir lalu mendorongnya sebagai event
 * `notification`; heartbeat berkala menjaga koneksi tetap hidup.
 *
 * Klien (NotificationBell) memakai EventSource; bila koneksi gagal
 * (mis. proxy memblokir stream), klien kembali ke polling lama.
 */

/** Interval pengecekan notifikasi baru (ms). */
const POLL_INTERVAL_MS = 15_000;

/** Interval heartbeat agar koneksi tidak diputus idle (ms). */
const HEARTBEAT_MS = 45_000;

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  /** Penanda waktu pengecekan terakhir (hanya bertambah). */
  let lastCheck = new Date();
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: string, payload: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`),
          );
        } catch {
          // Klien sudah pergi — biarkan abort/cancel yang membereskan.
        }
      };

      // Sapaan awal: klien tahu stream hidup (dan patokan waktu awal).
      send("ready", { at: lastCheck.toISOString() });

      const cleanup = () => {
        if (closed) return;
        closed = true;
        if (pollTimer) clearInterval(pollTimer);
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        try {
          controller.close();
        } catch {
          // Sudah tertutup.
        }
      };

      const poll = async () => {
        if (closed) return;
        try {
          const fresh = await getUserNotificationsSince(user.id, lastCheck);
          // Patokan bergerak SEBELUM push agar notifikasi yang lahir
          // selama query tidak terlewat/terkirim dua kali.
          lastCheck = new Date();
          for (const item of fresh) send("notification", item);
        } catch {
          // Best-effort: kegagalan satu tick tidak memutus stream.
        }
      };

      pollTimer = setInterval(() => void poll(), POLL_INTERVAL_MS);
      heartbeatTimer = setInterval(() => {
        if (closed) return;
        try {
          // Komentar SSE — tidak diproses klien, hanya menjaga koneksi.
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          cleanup();
        }
      }, HEARTBEAT_MS);

      // Klien menutup tab / EventSource → hentikan interval & stream.
      request.signal.addEventListener("abort", cleanup);
    },
    cancel() {
      closed = true;
      if (pollTimer) clearInterval(pollTimer);
      if (heartbeatTimer) clearInterval(heartbeatTimer);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Nonaktifkan buffering proxy (mis. nginx) agar event langsung sampai.
      "X-Accel-Buffering": "no",
    },
  });
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
