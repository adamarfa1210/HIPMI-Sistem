"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Plus,
  Receipt,
  ShieldCheck,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  ApprovalModal,
  CreateTransactionModal,
  ReceiptPreviewModal,
} from "@/components/erp/FinanceModals";
import {
  apiDownloadBlob,
  apiRequest,
  apiRequestWithMeta,
  type ApiMeta,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDateId } from "@/lib/tracking";
import {
  TX_STATUS_META,
  TX_TYPE_META,
  formatRupiah,
  triggerBlobDownload,
  type FinanceSummary,
  type FinanceTransaction,
  type TransactionStatus,
  type TransactionType,
} from "@/lib/finance";

export default function KeuanganPage() {
  const { can } = useAuth();
  const canRead = can("finance", "read");
  const canCreate = can("finance", "create");
  const canApprove = can("finance", "approve");

  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [typeFilter, setTypeFilter] = useState<"" | TransactionType>("");
  const [statusFilter, setStatusFilter] = useState<"" | TransactionStatus>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);

  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [meta, setMeta] = useState<ApiMeta>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [exportingFormat, setExportingFormat] = useState<"xlsx" | "pdf" | null>(
    null
  );
  const [toast, setToast] = useState<{ message: string; isError: boolean } | null>(
    null
  );

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [approvalTx, setApprovalTx] = useState<FinanceTransaction | null>(null);
  const [receiptTx, setReceiptTx] = useState<FinanceTransaction | null>(null);

  const notify = useCallback((message: string, isError = false) => {
    setToast({ message, isError });
    window.setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  }, []);

  const buildFilterQuery = useCallback(() => {
    const qs = new URLSearchParams();
    if (typeFilter) qs.set("type", typeFilter);
    if (statusFilter) qs.set("status", statusFilter);
    if (startDate) qs.set("startDate", startDate);
    if (endDate) qs.set("endDate", endDate);
    return qs;
  }, [typeFilter, statusFilter, startDate, endDate]);

  const loadSummary = useCallback(async () => {
    if (!canRead) return;
    try {
      const data = await apiRequest<FinanceSummary>(
        `/api/finance/summary?year=${year}`
      );
      setSummary(data);
    } catch (err: any) {
      notify(err?.message || "Gagal memuat ringkasan keuangan", true);
    }
  }, [canRead, year, notify]);

  const loadTransactions = useCallback(async () => {
    if (!canRead) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const qs = buildFilterQuery();
      qs.set("page", String(page));
      qs.set("limit", "20");

      const res = await apiRequestWithMeta<FinanceTransaction[]>(
        `/api/finance/transactions?${qs.toString()}`
      );
      setTransactions(res.data || []);
      setMeta(res.meta);
    } catch (err: any) {
      notify(err?.message || "Gagal memuat daftar transaksi kas", true);
    } finally {
      setLoading(false);
    }
  }, [canRead, buildFilterQuery, page, notify]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleExport = async (format: "xlsx" | "pdf") => {
    setExportingFormat(format);
    try {
      const qs = buildFilterQuery();
      qs.set("format", format);
      const { blob, filename } = await apiDownloadBlob(
        `/api/finance/export?${qs.toString()}`
      );
      triggerBlobDownload(
        blob,
        filename || `laporan-keuangan-hipmi.${format}`
      );
      notify(`Laporan keuangan (${format.toUpperCase()}) berhasil diunduh.`);
    } catch (err: any) {
      notify(err?.message || "Gagal mengunduh laporan keuangan", true);
    } finally {
      setExportingFormat(null);
    }
  };

  const resetFilters = () => {
    setTypeFilter("");
    setStatusFilter("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const monthlyList = summary?.monthlyCashflow || [];
  const maxMonthlyVal = Math.max(
    1,
    ...monthlyList.map((m) => Math.max(m.cashIn, m.cashOut))
  );

  return (
    <AppShell
      title="Persetujuan & Kas Keuangan"
      breadcrumb="Operasional ERP / Persetujuan & Kas Keuangan"
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
            Akun Anda tidak memiliki izin <code>finance:read</code> untuk mengakses modul Keuangan &amp; Resi Kas.
          </div>
        ) : (
          <>
            {/* Top Header & Exports */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#D4E4DC] bg-white p-5 shadow-sm">
              <div>
                <h2 className="font-display text-lg font-extrabold text-[#06231D]">
                  Persetujuan Pengajuan, Saldo Kas &amp; Kuitansi Resmi
                </h2>
                <p className="mt-0.5 text-xs text-[#64748B]">
                  Verifikasi pengajuan transaksi dari tiap role, pantau arus kas <strong>APPROVED</strong>, dan terbitkan resi PDF bernomor urut.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={exportingFormat !== null}
                  onClick={() => handleExport("xlsx")}
                  className="inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-[8px] border border-[#D4E4DC] bg-white px-3.5 text-xs font-bold text-[#06231D] hover:border-[#076653] disabled:opacity-50"
                >
                  <FileSpreadsheet className="h-4 w-4 text-[#076653]" />
                  {exportingFormat === "xlsx" ? "Menyiapkan..." : "Export Excel"}
                </button>
                <button
                  type="button"
                  disabled={exportingFormat !== null}
                  onClick={() => handleExport("pdf")}
                  className="inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-[8px] border border-[#D4E4DC] bg-white px-3.5 text-xs font-bold text-[#06231D] hover:border-[#076653] disabled:opacity-50"
                >
                  <FileText className="h-4 w-4 text-[#BE123C]" />
                  {exportingFormat === "pdf" ? "Menyiapkan..." : "Export PDF"}
                </button>
                {canCreate ? (
                  <button
                    type="button"
                    onClick={() => setCreateOpen(true)}
                    className="inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-[8px] bg-[#076653] px-4 font-display text-xs font-bold text-[#FFFDEE] hover:bg-[#06231D]"
                  >
                    <Plus className="h-4 w-4 text-[#E3EF26]" />
                    Catat Transaksi
                  </button>
                ) : null}
              </div>
            </div>

            {/* 4 KPI Strip */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-[#124236] bg-[#06231D] p-5 text-[#FFFDEE] shadow-sm">
                <p className="font-display text-[10px] font-bold uppercase tracking-[0.08em] text-[#E3EF26]">
                  SALDO KAS BERSIH (APPROVED)
                </p>
                <p className="mt-2 font-display text-2xl font-extrabold tabular-nums">
                  {formatRupiah(summary?.totalBalance ?? 0)}
                </p>
                <p className="mt-1 text-[11px] text-[#C7DCD2]">
                  Akumulasi seluruh kas masuk dikurangi kas keluar
                </p>
              </div>

              <div className="rounded-2xl border border-[#D4E4DC] bg-white p-5 shadow-sm">
                <p className="text-[11px] font-semibold text-[#64748B]">
                  Total Kas Masuk Approved
                </p>
                <p className="mt-2 font-display text-2xl font-extrabold tabular-nums text-[#076653]">
                  {formatRupiah(summary?.totalCashIn ?? 0)}
                </p>
              </div>

              <div className="rounded-2xl border border-[#D4E4DC] bg-white p-5 shadow-sm">
                <p className="text-[11px] font-semibold text-[#64748B]">
                  Total Kas Keluar Approved
                </p>
                <p className="mt-2 font-display text-2xl font-extrabold tabular-nums text-[#BE123C]">
                  {formatRupiah(summary?.totalCashOut ?? 0)}
                </p>
              </div>

              <div className="rounded-2xl border border-[#D4E4DC] bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold text-[#64748B]">
                    Arus Bersih Tahun
                  </p>
                  <select
                    aria-label="Tahun Ringkasan Keuangan"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="rounded border border-[#D4E4DC] bg-[#FFFDEE] px-2 py-0.5 text-[11px] font-bold text-[#06231D]"
                  >
                    {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="mt-2 font-display text-2xl font-extrabold tabular-nums text-[#06231D]">
                  {formatRupiah(summary?.periodProfit ?? 0)}
                </p>
              </div>
            </div>

            {/* 12-Month Cashflow Visual */}
            <div className="rounded-2xl border border-[#D4E4DC] bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-display text-sm font-extrabold text-[#06231D]">
                    Arus Kas Bulanan Tahun {summary?.year ?? year}
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Perbandingan kas masuk vs kas keluar terverifikasi per bulan.
                  </p>
                </div>
                <div className="flex items-center gap-4 text-[11px] font-semibold">
                  <span className="inline-flex items-center gap-1.5 text-[#076653]">
                    <span className="h-2.5 w-2.5 rounded-sm bg-[#076653]" />
                    Kas Masuk
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[#BE123C]">
                    <span className="h-2.5 w-2.5 rounded-sm bg-[#FB7185]" />
                    Kas Keluar
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-6 gap-2 sm:grid-cols-12">
                {monthlyList.map((m) => {
                  const inHeight = m.cashIn > 0 ? Math.max(8, Math.round((m.cashIn / maxMonthlyVal) * 100)) : 2;
                  const outHeight = m.cashOut > 0 ? Math.max(8, Math.round((m.cashOut / maxMonthlyVal) * 100)) : 2;
                  return (
                    <div
                      key={m.monthNumber}
                      title={`${m.month}: Masuk ${formatRupiah(m.cashIn)} | Keluar ${formatRupiah(m.cashOut)}`}
                      className="flex flex-col items-center gap-1.5"
                    >
                      <div className="flex h-24 w-full items-end justify-center gap-1 rounded-lg bg-[#F8FAFC] px-1.5 pb-1.5 pt-2">
                        <div
                          className="w-2.5 rounded-t bg-[#076653] transition-all"
                          style={{ height: `${inHeight}%` }}
                        />
                        <div
                          className="w-2.5 rounded-t bg-[#FB7185] transition-all"
                          style={{ height: `${outHeight}%` }}
                        />
                      </div>
                      <span className="font-display text-[10px] font-bold text-[#475569]">
                        {m.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Filter & Transactions Table */}
            <div className="rounded-2xl border border-[#D4E4DC] bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h3 className="font-display text-base font-extrabold text-[#06231D]">
                    Riwayat Transaksi &amp; Resi Kas
                  </h3>
                  <p className="text-xs text-[#64748B] tabular-nums">
                    Menampilkan {transactions.length} dari {meta.total} transaksi.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    aria-label="Filter Tipe Transaksi"
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
                    aria-label="Filter Status Transaksi"
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

                  {(typeFilter || statusFilter || startDate || endDate) ? (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="min-h-[38px] cursor-pointer rounded-[8px] border border-[#CBD5E1] px-3 text-xs font-semibold text-[#475569] hover:bg-[#F8FAFC]"
                    >
                      Reset
                    </button>
                  ) : null}
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#D4E4DC] border-t-[#076653]" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#CBD5E1] py-10 text-center text-xs text-[#64748B]">
                  Belum ada transaksi kas yang sesuai filter.
                  {canCreate ? " Klik Catat Transaksi untuk menambahkan entri pertama." : ""}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#E2E8F0] text-[11px] uppercase tracking-wider text-[#64748B]">
                        <th className="py-2.5 pr-4">Tanggal &amp; Resi</th>
                        <th className="py-2.5 pr-4">Tipe</th>
                        <th className="py-2.5 pr-4">Alur Dana &amp; Uraian</th>
                        <th className="py-2.5 pr-4 text-right">Nominal</th>
                        <th className="py-2.5 pr-4">Status</th>
                        <th className="py-2.5 text-right">Aksi &amp; Resi PDF</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      {transactions.map((tx) => {
                        const typeMeta = TX_TYPE_META[tx.type];
                        const statusMeta = TX_STATUS_META[tx.status];
                        return (
                          <tr key={tx.id}>
                            <td className="py-3 pr-4 align-top">
                              <p className="font-semibold tabular-nums text-[#06231D]">
                                {formatDateId(tx.transactionDate)}
                              </p>
                              <p className="mt-0.5 font-mono text-[11px] text-[#64748B]">
                                {tx.receiptNumber || "Belum terbit resi"}
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
                              <p className="mt-0.5 text-[11px] text-[#94A3B8]">
                                Pencatat: {tx.creatorName || "-"}
                              </p>
                              {tx.status === "REJECTED" && tx.rejectionReason ? (
                                <p className="mt-1 rounded bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
                                  Alasan ditolak: {tx.rejectionReason}
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
                              <div className="inline-flex flex-wrap justify-end gap-1.5">
                                {tx.status === "PENDING" && canApprove ? (
                                  <button
                                    type="button"
                                    onClick={() => setApprovalTx(tx)}
                                    className="inline-flex min-h-[34px] cursor-pointer items-center gap-1 rounded-[8px] bg-[#076653] px-3 text-xs font-bold text-[#FFFDEE] hover:bg-[#06231D]"
                                  >
                                    <ShieldCheck className="h-3.5 w-3.5 text-[#E3EF26]" />
                                    Proses
                                  </button>
                                ) : null}
                                {tx.status === "APPROVED" ? (
                                  <button
                                    type="button"
                                    onClick={() => setReceiptTx(tx)}
                                    className="inline-flex min-h-[34px] cursor-pointer items-center gap-1.5 rounded-[8px] bg-[#06231D] px-3 text-xs font-bold text-[#E3EF26] hover:bg-[#076653] hover:text-white"
                                  >
                                    <Receipt className="h-3.5 w-3.5" />
                                    Resi Kas PDF
                                  </button>
                                ) : null}
                                {tx.status === "PENDING" && !canApprove ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 text-[11px] italic text-[#94A3B8]">
                                    <Download className="h-3 w-3 opacity-40" />
                                    Menunggu approval
                                  </span>
                                ) : null}
                              </div>
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
        onClose={() => setCreateOpen(false)}
        onCreated={async () => {
          setCreateOpen(false);
          notify("Transaksi kas berhasil dicatat dengan status PENDING.");
          await Promise.all([loadSummary(), loadTransactions()]);
        }}
      />

      <ApprovalModal
        tx={approvalTx}
        onClose={() => setApprovalTx(null)}
        onProcessed={async (decision) => {
          setApprovalTx(null);
          notify(
            decision === "APPROVED"
              ? "Transaksi disetujui, saldo kas diperbarui, dan nomor resi resmi diterbitkan."
              : "Transaksi ditolak."
          );
          await Promise.all([loadSummary(), loadTransactions()]);
        }}
      />

      <ReceiptPreviewModal tx={receiptTx} onClose={() => setReceiptTx(null)} />
    </AppShell>
  );
}
