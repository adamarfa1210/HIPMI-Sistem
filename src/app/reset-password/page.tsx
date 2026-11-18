"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDateTimeId } from "@/lib/tracking";

type ResetStatus = "PENDING" | "APPROVED" | "REJECTED";

interface PasswordResetRequestItem {
  id: string;
  kaderId: string;
  nim: string;
  status: ResetStatus;
  requestedAt: string;
  resolvedBy: string | null;
  resolvedAt: string | null;
  notes: string | null;
  fullName: string;
  whatsappNumber: string;
  prodi: string;
  fakultas: string;
  profileCompleted: boolean;
  roleName: string;
}

interface PasswordResetListResponse {
  items: PasswordResetRequestItem[];
  pendingCount: number;
}

const STATUS_BADGE: Record<ResetStatus, { label: string; className: string }> = {
  PENDING: {
    label: "Menunggu ACC",
    className: "border-amber-200 bg-amber-50 text-amber-800",
  },
  APPROVED: {
    label: "Disetujui (Pass = NIM)",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  REJECTED: {
    label: "Ditolak",
    className: "border-red-200 bg-red-50 text-red-700",
  },
};

export default function ResetPasswordQueuePage() {
  const { can } = useAuth();
  const canRead = can("password-reset", "read");
  const canApprove = can("password-reset", "approve");

  const [statusFilter, setStatusFilter] = useState<"" | ResetStatus>("PENDING");
  const [items, setItems] = useState<PasswordResetRequestItem[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; isError: boolean } | null>(
    null
  );

  const notify = useCallback((message: string, isError = false) => {
    setToast({ message, isError });
    window.setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  }, []);

  const loadRequests = useCallback(async () => {
    if (!canRead) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const qs = statusFilter ? `?status=${statusFilter}` : "";
      const res = await apiRequest<PasswordResetListResponse>(
        `/api/password-resets${qs}`
      );
      setItems(res.items || []);
      setPendingCount(res.pendingCount ?? 0);
    } catch (err: any) {
      notify(err?.message || "Gagal memuat permintaan reset password", true);
    } finally {
      setLoading(false);
    }
  }, [canRead, statusFilter, notify]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleDecision = async (
    item: PasswordResetRequestItem,
    decision: "approve" | "reject"
  ) => {
    if (!canApprove || processingId) return;
    const confirmed =
      decision === "approve"
        ? window.confirm(
            `ACC permintaan reset password untuk ${item.fullName} (${item.nim})? Password akan langsung disetel sama dengan NIM (${item.nim}).`
          )
        : window.confirm(
            `Tolak permintaan reset password untuk ${item.fullName} (${item.nim})?`
          );
    if (!confirmed) return;

    setProcessingId(item.id);
    try {
      await apiRequest(`/api/password-resets/${item.id}/${decision}`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      notify(
        decision === "approve"
          ? `Reset password ${item.nim} di-ACC (Password sementara = ${item.nim}).`
          : `Permintaan reset password ${item.nim} ditolak.`
      );
      await loadRequests();
      window.dispatchEvent(new Event("hipmi:password-reset-updated"));
    } catch (err: any) {
      notify(err?.message || "Gagal memproses pengajuan reset password", true);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <AppShell
      title="ACC Reset Password"
      breadcrumb="Akun & Keamanan / ACC Reset Password"
    >
      <div className="space-y-6">
        {toast ? (
          <div
            className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-xs font-semibold shadow-sm ${
              toast.isError
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-emerald-200 bg-emerald-50 text-emerald-900"
            }`}
          >
            {toast.isError ? (
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            )}
            <span>{toast.message}</span>
          </div>
        ) : null}

        {!canRead ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
            Akun Anda tidak memiliki izin <code>password-reset:read</code>.
            Hubungi Admin untuk mengaktifkan modul ini di Settings Hak Akses.
          </div>
        ) : (
          <>
            {/* Header Summary Banner */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#D4E4DC] bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#06231D] text-[#E3EF26]">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-lg font-extrabold text-[#06231D]">
                      Antrean Persetujuan Lupa Password
                    </h2>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#06231D] px-2.5 py-0.5 font-display text-[11px] font-bold text-[#E3EF26] tabular-nums">
                      {pendingCount} Menunggu ACC
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-[#64748B]">
                    Saat di-<strong>ACC</strong>, sistem otomatis menyetel password kader menjadi <strong>NIM</strong> mereka. Saat login berikutnya, kader langsung diarahkan ke halaman pembuatan password baru.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={loadRequests}
                disabled={loading}
                className="inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3.5 text-xs font-bold text-[#06231D] hover:border-[#076653]"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
                />
                Muat Ulang
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              {[
                { value: "PENDING" as const, label: `Menunggu ACC (${pendingCount})` },
                { value: "" as const, label: "Semua Riwayat" },
                { value: "APPROVED" as const, label: "Disetujui" },
                { value: "REJECTED" as const, label: "Ditolak" },
              ].map((tab) => (
                <button
                  key={tab.value || "ALL"}
                  type="button"
                  onClick={() => setStatusFilter(tab.value)}
                  className={`min-h-[38px] cursor-pointer rounded-full border px-4 text-xs font-bold transition ${
                    statusFilter === tab.value
                      ? "border-[#06231D] bg-[#06231D] text-[#E3EF26]"
                      : "border-[#D4E4DC] bg-white text-[#06231D] hover:border-[#076653]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* List */}
            {loading ? (
              <div className="flex justify-center rounded-2xl border border-[#D4E4DC] bg-white py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#D4E4DC] border-t-[#076653]" />
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white p-12 text-center text-xs text-[#64748B]">
                Belum ada pengajuan reset password pada filter ini.
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => {
                  const badge = STATUS_BADGE[item.status];
                  return (
                    <div
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#D4E4DC] bg-white p-4 shadow-sm"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded bg-[#06231D] px-2 py-0.5 font-display text-xs font-extrabold tabular-nums text-[#E3EF26]">
                            {item.nim}
                          </span>
                          <span className="rounded-full border border-[#D4E4DC] bg-[#FFFDEE] px-2.5 py-0.5 text-[11px] font-bold text-[#06231D]">
                            {item.roleName}
                          </span>
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </div>

                        <h3 className="font-display text-sm font-extrabold text-[#06231D]">
                          {item.fullName}
                        </h3>
                        <p className="text-xs text-[#475569]">
                          {item.prodi} • {item.fakultas} • WA: {item.whatsappNumber}
                        </p>
                        <p className="flex items-center gap-1.5 text-[11px] text-[#64748B] tabular-nums">
                          <Clock className="h-3.5 w-3.5" />
                          Diajukan: {formatDateTimeId(item.requestedAt)}
                          {item.resolvedAt
                            ? ` • Diproses: ${formatDateTimeId(item.resolvedAt)}`
                            : ""}
                        </p>
                        {item.notes ? (
                          <p className="text-[11px] italic text-[#475569]">
                            Catatan: {item.notes}
                          </p>
                        ) : null}
                      </div>

                      {item.status === "PENDING" && canApprove ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={processingId === item.id}
                            onClick={() => handleDecision(item, "approve")}
                            className="inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-[8px] bg-[#076653] px-3.5 font-display text-xs font-bold text-[#FFFDEE] hover:bg-[#06231D] disabled:opacity-50"
                          >
                            <ShieldCheck className="h-4 w-4 text-[#E3EF26]" />
                            {processingId === item.id
                              ? "Memproses..."
                              : "ACC (Set Pass = NIM)"}
                          </button>
                          <button
                            type="button"
                            disabled={processingId === item.id}
                            onClick={() => handleDecision(item, "reject")}
                            className="inline-flex min-h-[38px] cursor-pointer items-center gap-1 rounded-[8px] border border-red-200 bg-red-50 px-3 text-xs font-bold text-red-700 hover:bg-red-600 hover:text-white disabled:opacity-50"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Tolak
                          </button>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
