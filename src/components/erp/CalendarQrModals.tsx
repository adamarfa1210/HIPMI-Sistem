"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import jsQR from "jsqr";
import {
  Camera,
  CheckCircle2,
  Download,
  Lock,
  QrCode,
  RefreshCw,
  ShieldAlert,
  Unlock,
  Upload,
  Users,
  X,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import {
  CALENDAR_CATEGORY_META,
  type CalendarAttendanceData,
  type CalendarEventItem,
  type QrScanResult,
} from "@/lib/calendar";
import { formatDateTimeId } from "@/lib/tracking";

function extractQrText(data: Uint8ClampedArray, width: number, height: number): string | null {
  const code = jsQR(data, width, height, { inversionAttempts: "dontInvert" });
  return code?.data?.trim() || null;
}

export function EventQrDisplayModal({
  event,
  onClose,
  onStatusChanged,
}: {
  event: CalendarEventItem | null;
  onClose: () => void;
  onStatusChanged: (eventId: string, isOpen: boolean, qrPayload: string | null) => void;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    if (!event?.qrPayload) {
      setQrDataUrl(null);
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(event.qrPayload, {
      width: 340,
      margin: 2,
      color: { dark: "#06231D", light: "#FFFFFF" },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setError("Gagal merender gambar QR Code.");
      });
    return () => {
      cancelled = true;
    };
  }, [event?.qrPayload]);

  if (!event) return null;
  const catMeta = CALENDAR_CATEGORY_META[event.category];

  const handleToggleQr = async () => {
    setToggling(true);
    setError(null);
    try {
      const res = await apiRequest<{
        eventId: string;
        qrIsOpen: boolean;
        qrPayload: string;
      }>(`/api/calendar/${event.id}/qr-status`, {
        method: "PATCH",
        body: JSON.stringify({ isOpen: !event.qrIsOpen }),
      });
      onStatusChanged(res.eventId, res.qrIsOpen, res.qrPayload);
    } catch (err: any) {
      setError(err?.message || "Gagal mengubah status QR Code");
    } finally {
      setToggling(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#06231D]/75 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md space-y-4 rounded-[16px] border border-[#D4E4DC] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span
              className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${catMeta.badgeClass}`}
            >
              {catMeta.label}
            </span>
            <h2 className="mt-1.5 font-display text-base font-extrabold text-[#06231D]">
              QR Absensi: {event.title}
            </h2>
            <p className="mt-0.5 text-[11px] text-[#64748B]">
              {formatDateTimeId(event.startAt)} • {event.location}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded text-[#475569] hover:bg-[#F1F5F9]"
            aria-label="Tutup modal QR"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#E2E8F0] bg-[#FFFDEE] px-3.5 py-2.5 text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                event.qrIsOpen
                  ? "bg-[#E2FBCE] text-[#076653]"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {event.qrIsOpen ? (
                <Unlock className="h-3 w-3" />
              ) : (
                <Lock className="h-3 w-3" />
              )}
              {event.qrIsOpen ? "QR Dibuka (Valid)" : "QR Ditutup"}
            </span>
          </div>
          <span className="font-bold text-[#06231D] tabular-nums">
            {event.pointsPerAttendance > 0
              ? `+${event.pointsPerAttendance} Poin`
              : "Tanpa Poin"}
          </span>
        </div>

        <div className="flex flex-col items-center justify-center rounded-2xl border border-[#D4E4DC] bg-white p-4">
          {qrDataUrl ? (
            <div className="relative">
              <img
                src={qrDataUrl}
                alt={`QR Absensi ${event.title}`}
                className={`h-64 w-64 rounded-xl border border-[#E2E8F0] object-contain transition ${
                  event.qrIsOpen ? "opacity-100" : "opacity-35 grayscale"
                }`}
              />
              {!event.qrIsOpen ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="rounded-lg bg-[#06231D] px-3 py-1.5 font-display text-xs font-bold text-[#E3EF26] shadow">
                    ABSENSI QR DITUTUP
                  </span>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex h-64 w-64 items-center justify-center text-xs text-[#64748B]">
              Membuat QR Code...
            </div>
          )}
          <p className="mt-2 text-center text-[11px] text-[#64748B]">
            Peserta wajib hadir:{" "}
            <strong className="text-[#06231D]">
              {event.targetRoles.length > 0
                ? event.targetRoles.map((r) => r.name).join(", ")
                : "Semua Role"}
            </strong>
          </p>
        </div>

        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={handleToggleQr}
            disabled={toggling}
            className={`inline-flex min-h-[40px] flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-[8px] px-4 font-display text-xs font-bold transition disabled:opacity-50 ${
              event.qrIsOpen
                ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-600 hover:text-white"
                : "bg-[#076653] text-[#FFFDEE] hover:bg-[#06231D]"
            }`}
          >
            {event.qrIsOpen ? (
              <>
                <Lock className="h-3.5 w-3.5" />
                {toggling ? "Memproses..." : "Tutup QR Absensi"}
              </>
            ) : (
              <>
                <Unlock className="h-3.5 w-3.5" />
                {toggling ? "Memproses..." : "Buka QR Absensi"}
              </>
            )}
          </button>

          {qrDataUrl ? (
            <a
              href={qrDataUrl}
              download={`QR-${event.title.replace(/[^a-zA-Z0-9_-]+/g, "_")}.png`}
              className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-[8px] border border-[#D4E4DC] bg-white px-3.5 text-xs font-semibold text-[#06231D] hover:bg-[#F8FAFC]"
            >
              <Download className="h-3.5 w-3.5 text-[#076653]" />
              Unduh PNG
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function EventAttendanceModal({
  event,
  onClose,
  onOpenQr,
}: {
  event: CalendarEventItem | null;
  onClose: () => void;
  onOpenQr?: (event: CalendarEventItem) => void;
}) {
  const [data, setData] = useState<CalendarAttendanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAttendance = useCallback(async () => {
    if (!event) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<CalendarAttendanceData>(
        `/api/calendar/${event.id}/attendance`
      );
      setData(res);
    } catch (err: any) {
      setError(err?.message || "Gagal memuat tabel kehadiran agenda");
    } finally {
      setLoading(false);
    }
  }, [event]);

  useEffect(() => {
    if (event) {
      loadAttendance();
    } else {
      setData(null);
    }
  }, [event, loadAttendance]);

  if (!event) return null;
  const catMeta = CALENDAR_CATEGORY_META[event.category];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#06231D]/75 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[16px] border border-[#D4E4DC] bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-[#E2E8F0] p-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${catMeta.badgeClass}`}
              >
                {catMeta.label}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  (data?.qrIsOpen ?? event.qrIsOpen)
                    ? "bg-[#E2FBCE] text-[#076653]"
                    : "bg-[#F1F5F9] text-[#475569]"
                }`}
              >
                {(data?.qrIsOpen ?? event.qrIsOpen) ? "QR Dibuka" : "QR Ditutup"}
              </span>
            </div>
            <h2 className="mt-1.5 font-display text-base font-extrabold text-[#06231D]">
              Daftar Kehadiran: {event.title}
            </h2>
            <p className="text-[11px] text-[#64748B]">
              Diurutkan otomatis: peserta <strong>Hadir</strong> di atas sesuai urutan role Topman hingga Kader 1.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded text-[#475569] hover:bg-[#F1F5F9]"
            aria-label="Tutup daftar hadir"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] bg-[#FFFDEE] px-5 py-3">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1 font-semibold text-[#06231D]">
              <Users className="h-3.5 w-3.5 text-[#076653]" />
              Total Peserta: <strong>{data?.totalEligible ?? "-"}</strong>
            </span>
            <span className="rounded-full bg-[#E2FBCE] px-2.5 py-0.5 font-bold text-[#076653]">
              Hadir: {data?.totalHadir ?? 0}
            </span>
            <span className="rounded-full bg-[#F1F5F9] px-2.5 py-0.5 font-semibold text-[#475569]">
              Belum Hadir: {data?.totalBelumHadir ?? 0}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {event.canManageQr && onOpenQr ? (
              <button
                type="button"
                onClick={() => onOpenQr(event)}
                className="inline-flex min-h-[34px] cursor-pointer items-center gap-1.5 rounded-[8px] bg-[#06231D] px-3 text-xs font-bold text-[#E3EF26] hover:bg-[#076653]"
              >
                <QrCode className="h-3.5 w-3.5" />
                Tampilkan QR
              </button>
            ) : null}
            <button
              type="button"
              onClick={loadAttendance}
              disabled={loading}
              className="inline-flex min-h-[34px] cursor-pointer items-center gap-1.5 rounded-[8px] border border-[#D4E4DC] bg-white px-3 text-xs font-semibold text-[#06231D] hover:bg-[#F8FAFC]"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#D4E4DC] border-t-[#076653]" />
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
              {error}
            </div>
          ) : !data || data.rows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#CBD5E1] p-8 text-center text-xs text-[#64748B]">
              Belum ada kader aktif pada role peserta yang dipilih.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] uppercase tracking-wider text-[#64748B]">
                    <th className="w-12 px-3 py-2.5 text-center">No</th>
                    <th className="px-3 py-2.5">Nama</th>
                    <th className="px-3 py-2.5">Role</th>
                    <th className="px-3 py-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {data.rows.map((row) => {
                    const isHadir = row.status === "HADIR";
                    return (
                      <tr
                        key={row.kaderId}
                        className={isHadir ? "bg-[#E2FBCE]/20" : "bg-white"}
                      >
                        <td className="px-3 py-2.5 text-center font-bold tabular-nums text-[#475569]">
                          {row.no}
                        </td>
                        <td className="px-3 py-2.5">
                          <p className="font-semibold text-[#06231D]">
                            {row.fullName}
                          </p>
                          <p className="text-[10px] tabular-nums text-[#64748B]">
                            {row.nim}
                          </p>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="inline-flex rounded-full border border-[#D4E4DC] bg-[#FFFDEE] px-2.5 py-0.5 text-[11px] font-semibold text-[#06231D]">
                            {row.roleName}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          {isHadir ? (
                            <div className="inline-flex flex-col items-end">
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#076653] px-2.5 py-0.5 text-[10px] font-bold text-[#FFFDEE]">
                                <CheckCircle2 className="h-3 w-3 text-[#E3EF26]" />
                                HADIR
                              </span>
                              {row.attendedAt ? (
                                <span className="mt-0.5 text-[10px] tabular-nums text-[#64748B]">
                                  {new Intl.DateTimeFormat("id-ID", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }).format(new Date(row.attendedAt))}{" "}
                                  WIB
                                </span>
                              ) : null}
                            </div>
                          ) : (
                            <span className="inline-flex rounded-full bg-[#F1F5F9] px-2.5 py-0.5 text-[10px] font-semibold text-[#64748B]">
                              {row.status === "BELUM_HADIR" ? "Belum Hadir" : row.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function FlexibleQrScannerModal({
  open,
  onClose,
  onScanned,
}: {
  open: boolean;
  onClose: () => void;
  onScanned: (result: QrScanResult) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const busyRef = useRef(false);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<QrScanResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
  }, []);

  const submitScannedPayload = useCallback(
    async (rawPayload: string) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setProcessing(true);
      setScanError(null);
      setScanResult(null);
      stopCamera();

      try {
        const res = await apiRequest<QrScanResult>("/api/qr/scan", {
          method: "POST",
          body: JSON.stringify({ payload: rawPayload }),
        });
        setScanResult(res);
        onScanned(res);
      } catch (err: any) {
        setScanError(err?.message || "Gagal memproses QR Code.");
      } finally {
        setProcessing(false);
        busyRef.current = false;
      }
    },
    [onScanned, stopCamera]
  );

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setScanError(null);
    setScanResult(null);
    busyRef.current = false;

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setCameraError(
        "Browser ini tidak mendukung akses kamera langsung. Gunakan fitur Upload Gambar QR di bawah."
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
      }

      const tick = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || !streamRef.current) return;

        if (video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth > 0) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const detected = extractQrText(
              imgData.data,
              canvas.width,
              canvas.height
            );
            if (detected) {
              submitScannedPayload(detected);
              return;
            }
          }
        }
        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setCameraError(
        "Izin kamera ditolak atau kamera tidak tersedia. Pastikan izin kamera aktif atau gunakan Upload Gambar QR."
      );
    }
  }, [submitScannedPayload]);

  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
      setScanResult(null);
      setScanError(null);
      setCameraError(null);
    }
    return () => {
      stopCamera();
    };
  }, [open, startCamera, stopCamera]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setScanError(null);
    setScanResult(null);

    try {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setScanError("Gagal membaca gambar QR.");
        return;
      }
      ctx.drawImage(bitmap, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const decoded = extractQrText(imgData.data, canvas.width, canvas.height);
      if (!decoded) {
        setScanError("QR Code tidak terdeteksi pada gambar tersebut.");
        return;
      }
      await submitScannedPayload(decoded);
    } catch {
      setScanError("Format gambar tidak didukung untuk pembacaan QR.");
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#06231D]/80 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md space-y-4 rounded-[16px] border border-[#D4E4DC] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-display text-[10px] font-bold uppercase tracking-[0.08em] text-[#076653]">
              KAMERA SCAN QR ERP HIPMI
            </p>
            <h2 className="mt-0.5 font-display text-base font-extrabold text-[#06231D]">
              Pindai QR Resmi ERP
            </h2>
            <p className="text-[11px] text-[#64748B]">
              Arahkan kamera ke QR Code agenda/rapat atau fitur ERP lainnya untuk mencatat data otomatis.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded text-[#475569] hover:bg-[#F1F5F9]"
            aria-label="Tutup kamera scanner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Camera Viewport */}
        {!scanResult && !scanError && !processing ? (
          <div className="relative overflow-hidden rounded-2xl border border-[#124236] bg-[#06231D]">
            <video
              ref={videoRef}
              playsInline
              muted
              className="aspect-square w-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            {cameraReady ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-52 w-52 rounded-2xl border-2 border-[#E3EF26] shadow-[0_0_0_9999px_rgba(6,35,29,0.45)]" />
              </div>
            ) : !cameraError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-xs text-[#FFFDEE]">
                <Camera className="h-7 w-7 animate-pulse text-[#E3EF26]" />
                <span>Mengaktifkan kamera...</span>
              </div>
            ) : null}
          </div>
        ) : null}

        {cameraError ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900">
            {cameraError}
          </div>
        ) : null}

        {processing ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-[#D4E4DC] bg-[#FFFDEE] py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#D4E4DC] border-t-[#076653]" />
            <p className="text-xs font-semibold text-[#06231D]">
              Memverifikasi QR Code ERP...
            </p>
          </div>
        ) : null}

        {scanResult ? (
          <div className="space-y-3 rounded-2xl border border-emerald-200 bg-[#E2FBCE]/50 p-4">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#076653]" />
              <div className="space-y-1 text-xs text-[#06231D]">
                <p className="font-display font-extrabold text-[#076653]">
                  {scanResult.alreadyAttended ? "Sudah Tercatat Hadir" : "Scan QR Berhasil!"}
                </p>
                <p>{scanResult.message}</p>
                {scanResult.eventTitle ? (
                  <p className="text-[11px] font-semibold text-[#2F4F46]">
                    Agenda: {scanResult.eventTitle}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {scanError ? (
          <div className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div>
              <p className="font-bold">Scan QR Ditolak</p>
              <p className="mt-0.5">{scanError}</p>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <label className="inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-xs font-semibold text-[#06231D] hover:border-[#076653]">
            <Upload className="h-3.5 w-3.5 text-[#076653]" />
            <span>Upload Gambar QR</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>

          <div className="flex items-center gap-2">
            {(scanResult || scanError || cameraError) ? (
              <button
                type="button"
                onClick={startCamera}
                className="inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-[8px] bg-[#076653] px-3.5 font-display text-xs font-bold text-[#FFFDEE] hover:bg-[#06231D]"
              >
                <Camera className="h-3.5 w-3.5 text-[#E3EF26]" />
                Scan Lagi
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="min-h-[38px] cursor-pointer rounded-[8px] border border-[#D4E4DC] px-3.5 text-xs font-semibold text-[#06231D]"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
