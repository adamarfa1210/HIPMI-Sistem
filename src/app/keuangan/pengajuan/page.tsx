"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  Receipt,
  Send,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  CreateTransactionModal,
  ReceiptPreviewModal,
} from "@/components/erp/FinanceModals";
import { apiRequestWithMeta, type ApiMeta } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDateId } from "@/lib/tracking";
import {
  TX_STATUS_META,
  TX_TYPE_META,
  formatRupiah,
  type FinanceTransaction,
  type TransactionStatus,
  type TransactionType,
} from "@/lib/finance";

export default function PengajuanKeuanganPage() {
  const { can } = useAuth();
  const canRead = can("finance-request", "read");
  const canCreate = can("finance-request", "create");
  const hasAccess = canRead || canCreate;

  const [typeFilter, setTypeFilter] = useState<"" | TransactionType>("");
  const [statusFilter, setStatusFilter] = useState<"" | TransactionStatus>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);

  const [submissions, setSubmissions] = useState<FinanceTransaction[]>([]);
  const [meta, setMeta] = useState<ApiMeta>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; isError: boolean } | null>(
    null
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [receiptTx, setReceiptTx] = useState<FinanceTransaction | null>(null);

  const notify = useCallback((message: string, isError = false) => {
    setToast({ message, isError });
    window.setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  }, []);

  const loadSubmissions = useCallback(async () => {
    if (!canRead) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        page: String(page),
        limit: "20",
      });
      if (typeFilter) qs.set("type", typeFilter);
      if (statusFilter) qs.set("status", statusFilter);
      if (startDate) qs.set("startDate", startDate);
      if (endDate) qs.set("endDate", endDate);

      const res = await apiRequestWithMeta<FinanceTransaction[]>(
        `/api/finance/submissions?${qs.toString()}`
      );
      setSubmissions(res.data || []);
      setMeta(res.meta);
    } catch (err: any) {
      notify(err?.message || "Gagal memuat daftar pengajuan keuangan", true);
    } finally {
      setLoading(false);
    }
  }, [canRead, page, typeFilter, statusFilter, startDate, endDate, notify]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const pendingCount = submissions.filter((s) => s.status === "PENDING").length;
  const approvedCount = submissions.filter((s) => s.status === "APPROVED").length;
  const rejectedCount = submissions.filter((s) => s.status === "REJECTED").length;

  return (
    <AppShell
      title="Pengajuan Keuangan"
      breadcrumb="Operasional ERP / Pengajuan Keuangan"
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

        {!hasAccess ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
            Akun Anda tidak memiliki izin modul <code>finance-request</code> untuk mengajukan atau melihat pengajuan keuangan.
          </div>
        ) : (
          <>
            {/* Top Action Banner */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#D4E4DC] bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#06231D] text-[#E3EF26]">
                  <Send className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-extrabold text-[#06231D]">
                    Pengajuan Pemasukan &amp; Pengeluaran Kas
                  </h2>
                  <p className="mt-0.5 text-xs text-[#64748B]">
                    Ajukan transaksi kas untuk diproses dan disetujui oleh Bendahara / Topman pada modul <strong>Persetujuan &amp; Kas</strong>.
                  </p>
                </div>
              </div>
              {canCreate ? (
                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className="inline-flex min-h-[42px] cursor-pointer items-center gap-2 rounded-[8px] bg-[#076653] px-4 font-display text-xs font-bold text-[#FFFDEE] hover:bg-[#06231D]"
                >
                  <Plus className="h-4 w-4 text-[#E3EF26]" />
                  Ajukan Transaksi Baru
                </button>
              ) : null}
            </div>

            {/* My Submissions Counters */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-[#124236] bg-[#06231D] p-4 text-[#FFFDEE]">
                <p className="font-display text-[10px] font-bold uppercase tracking-[0.08em] text-[#E3EF26]">
                  TOTAL PENGAJUAN SAYA
                </p>
                <p className="mt-1 font-display text-2xl font-extrabold tabular-nums">
                  {meta.total}
                </p>
              </div>
              <div className="rounded-xl border border-[#D4E4DC] bg-white p-4">
                <p className="text-[11px] font-semibold text-[#64748B]">
                  Menunggu Persetujuan
                </p>
                <p className="mt-1 font-display text-2xl font-extrabold tabular-nums text-[#D97706]">
                  {pendingCount}
                </p>
              </div>
              <div className="rounded-xl border border-[#D4E4DC] bg-white p-4">
                <p className="text-[11px] font-semibold text-[#64748B]">
                  Disetujui (Resi Terbit)
                </p>
                <p className="mt-1 font-display text-2xl font-extrabold tabular-nums text-[#076653]">
                  {approvedCount}
                </p>
              </div>
              <div className="rounded-xl border border-[#D4E4DC] bg-white p-4">
                <p className="text-[11px] font-semibold text-[#64748B]">Ditolak</p>
                <p className="mt-1 font-display text-2xl font-extrabold tabular-nums text-[#BE123C]">
                  {rejectedCount}
                </p>
              </div>
            </div>

            {/* My Submissions Table */}
            <div className="rounded-2xl border border-[#D4E4DC] bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h3 className="font-display text-base font-extrabold text-[#06231D]">
                    Daftar Pengajuan Saya
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Menampilkan riwayat pengajuan yang Anda kirim beserta status verifikasinya.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    aria-label="Filter Tipe Pengajuan"
                    value={typeFilter}
                    onChange={(e) => {
                      setPage(1);
                      setTypeFilter(e.target.value as "" | TransactionType);
                    }}
                    className="min-h-[38px] rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-xs font-semibold text-[#06231D]"
                  >
                    <option value="">Semua Tipe</option>
                    <option value="CASH_IN">Kas Masuk</option>
                    <option value="CASH_OUT">Kas Keluar</option>
                  </select>

                  <select
                    aria-label="Filter Status Pengajuan"
                    value={statusFilter}
                    onChange={(e) => {
                      setPage(1);
                      setStatusFilter(e.target.value as "" | TransactionStatus);
                    }}
                    className="min-h-[38px] rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-xs font-semibold text-[#06231D]"
                  >
                    <option value="">Semua Status</option>
                    <option value="PENDING">PENDING</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>

                  <input
                    type="date"
                    aria-label="Tanggal Mulai"
                    value={startDate}
                    onChange={(e) => {
                      setPage(1);
                      setStartDate(e.target.value);
                    }}
                    className="min-h-[38px] rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-2.5 text-xs text-[#06231D]"
                  />

                  <input
                    type="date"
                    aria-label="Tanggal Selesai"
                    value={endDate}
                    onChange={(e) => {
                      setPage(1);
                      setEndDate(e.target.value);
                    }}
                    className="min-h-[38px] rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-2.5 text-xs text-[#06231D]"
                  />
                </div>
              </div>

              {!canRead ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-xs text-amber-900">
                  Role Anda memiliki izin kirim pengajuan tanpa izin melihat daftar riwayat.
                </div>
              ) : loading ? (
                <div className="flex justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#D4E4DC] border-t-[#076653]" />
                </div>
              ) : submissions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#CBD5E1] py-10 text-center text-xs text-[#64748B]">
                  Belum ada pengajuan transaksi yang Anda buat.
                  {canCreate ? " Klik Ajukan Transaksi Baru untuk memulai." : ""}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#E2E8F0] text-[11px] uppercase tracking-wider text-[#64748B]">
                        <th className="py-2.5 pr-4">Tanggal</th>
                        <th className="py-2.5 pr-4">Tipe</th>
                        <th className="py-2.5 pr-4">Alur Dana &amp; Uraian</th>
                        <th className="py-2.5 pr-4 text-right">Nominal</th>
                        <th className="py-2.5 pr-4">Status</th>
                        <th className="py-2.5 text-right">Resi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      {submissions.map((tx) => {
                        const typeMeta = TX_TYPE_META[tx.type];
                        const statusMeta = TX_STATUS_META[tx.status];
                        return (
                          <tr key={tx.id}>
                            <td className="py-3 pr-4 align-top">
                              <p className="font-semibold tabular-nums text-[#06231D]">
                                {formatDateId(tx.transactionDate)}
                              </p>
                              <p className="mt-0.5 font-mono text-[11px] text-[#64748B]">
                                {tx.receiptNumber || "—"}
                              </p>
                            </td>
                            <td className="py-3 pr-4 align-top">
                              <span
                                className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${typeMeta.badgeClass}`}
                              >
                                {typeMeta.label}
                              </span>
                            </td>
                            <td className="py-3 pr-4 align-top">
                              <p className="font-bold text-[#06231D]">
                                {tx.fromEntity} → {tx.toEntity}
                              </p>
                              <p className="mt-0.5 text-[#475569]">{tx.description}</p>
                              {tx.status === "REJECTED" && tx.rejectionReason ? (
                                <p className="mt-1 rounded bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
                                  Catatan penolakan: {tx.rejectionReason}
                                </p>
                              ) : null}
                            </td>
                            <td
                              className={`py-3 pr-4 text-right align-top font-display text-sm font-extrabold tabular-nums ${typeMeta.amountClass}`}
                            >
                              {typeMeta.amountPrefix}
                              {formatRupiah(tx.amount)}
                            </td>
                            <td className="py-3 pr-4 align-top">
                              <span
                                className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusMeta.className}`}
                              >
                                {statusMeta.label}
                              </span>
                            </td>
                            <td className="py-3 text-right align-top">
                              {tx.status === "APPROVED" ? (
                                <button
                                  type="button"
                                  onClick={() => setReceiptTx(tx)}
                                  className="inline-flex min-h-[34px] cursor-pointer items-center gap-1.5 rounded-[8px] bg-[#06231D] px-3 text-xs font-bold text-[#E3EF26] hover:bg-[#076653] hover:text-white"
                                >
                                  <Receipt className="h-3.5 w-3.5" />
                                  Resi PDF
                                </button>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] text-[#94A3B8]">
                                  <Clock className="h-3 w-3" />
                                  {tx.status === "PENDING" ? "Menunggu ACC" : "Ditolak"}
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

              {meta.totalPages > 1 ? (
                <div className="mt-4 flex items-center justify-between border-t border-[#E2E8F0] pt-3 text-xs">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="cursor-pointer rounded border border-[#D4E4DC] px-3 py-1.5 font-semibold disabled:opacity-40"
                  >
                    Sebelumnya
                  </button>
                  <span className="tabular-nums text-[#64748B]">
                    Halaman {meta.page} dari {meta.totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= meta.totalPages}
                    onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                    className="cursor-pointer rounded border border-[#D4E4DC] px-3 py-1.5 font-semibold disabled:opacity-40"
                  >
                    Berikutnya
                  </button>
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>

      <CreateTransactionModal
        open={createOpen}
        submitPath="/api/finance/submissions"
        modalTitle="Ajukan Transaksi Keuangan"
        onClose={() => setCreateOpen(false)}
        onCreated={async () => {
          setCreateOpen(false);
          notify(
            "Pengajuan transaksi berhasil dikirim dan menunggu persetujuan pejabat keuangan."
          );
          await loadSubmissions();
        }}
      />

      <ReceiptPreviewModal
        tx={receiptTx}
        receiptBasePath="/api/finance/submissions"
        onClose={() => setReceiptTx(null)}
      />
    </AppShell>
  );
}
