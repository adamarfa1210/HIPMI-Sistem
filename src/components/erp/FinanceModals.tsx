"use client";

import React, { useEffect, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Download,
  ExternalLink,
  X,
  XCircle,
} from "lucide-react";
import { apiDownloadBlob, apiRequest } from "@/lib/api";
import { formatDateId } from "@/lib/tracking";
import {
  TX_TYPE_META,
  formatRupiah,
  triggerBlobDownload,
  type FinanceTransaction,
  type TransactionType,
} from "@/lib/finance";

export function CreateTransactionModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [type, setType] = useState<TransactionType>("CASH_IN");
  const [fromEntity, setFromEntity] = useState("");
  const [toEntity, setToEntity] = useState("HIPMI PT Telkom University");
  const [amount, setAmount] = useState("");
  const [transactionDate, setTransactionDate] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setType("CASH_IN");
    setFromEntity("");
    setToEntity("HIPMI PT Telkom University");
    setAmount("");
    setTransactionDate(new Date().toISOString().slice(0, 10));
    setDescription("");
  }, [open]);

  const switchType = (nextType: TransactionType) => {
    setType(nextType);
    if (nextType === "CASH_IN") {
      if (fromEntity === "HIPMI PT Telkom University") setFromEntity("");
      if (!toEntity) setToEntity("HIPMI PT Telkom University");
    } else {
      if (toEntity === "HIPMI PT Telkom University") setToEntity("");
      if (!fromEntity) setFromEntity("HIPMI PT Telkom University");
    }
  };

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Nominal transaksi harus lebih besar dari 0.");
      return;
    }

    setSaving(true);
    try {
      await apiRequest("/api/finance/transactions", {
        method: "POST",
        body: JSON.stringify({
          type,
          fromEntity: fromEntity.trim(),
          toEntity: toEntity.trim(),
          amount: numericAmount,
          transactionDate,
          description: description.trim(),
        }),
      });
      onCreated();
    } catch (err: any) {
      setError(err?.message || "Gagal mencatat transaksi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#06231D]/70 p-4"
      role="dialog"
      aria-modal="true"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg space-y-4 rounded-[14px] border border-[#D4E4DC] bg-white p-6 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-extrabold text-[#06231D]">
              Catat Transaksi Kas Baru
            </h2>
            <p className="text-xs text-[#64748B]">
              Transaksi baru berstatus PENDING hingga disetujui oleh pejabat berwenang.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded text-[#475569] hover:bg-[#F1F5F9]"
            aria-label="Tutup modal transaksi"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => switchType("CASH_IN")}
            className={`flex min-h-[42px] cursor-pointer items-center justify-center gap-2 rounded-[8px] border text-xs font-bold transition ${
              type === "CASH_IN"
                ? "border-[#076653] bg-[#076653] text-white"
                : "border-[#D4E4DC] bg-[#FFFDEE] text-[#06231D]"
            }`}
          >
            <ArrowDownLeft className="h-4 w-4" />
            Kas Masuk (CASH_IN)
          </button>
          <button
            type="button"
            onClick={() => switchType("CASH_OUT")}
            className={`flex min-h-[42px] cursor-pointer items-center justify-center gap-2 rounded-[8px] border text-xs font-bold transition ${
              type === "CASH_OUT"
                ? "border-[#BE123C] bg-[#BE123C] text-white"
                : "border-[#D4E4DC] bg-[#FFFDEE] text-[#06231D]"
            }`}
          >
            <ArrowUpRight className="h-4 w-4" />
            Kas Keluar (CASH_OUT)
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#06231D]">
              Dari Pihak (Pengirim)
            </label>
            <input
              type="text"
              required
              minLength={2}
              maxLength={120}
              value={fromEntity}
              onChange={(e) => setFromEntity(e.target.value)}
              placeholder="Contoh: Sponsor PT Telkom / Kas UKM"
              className="min-h-[42px] w-full rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-sm text-[#06231D]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#06231D]">
              Kepada Pihak (Penerima)
            </label>
            <input
              type="text"
              required
              minLength={2}
              maxLength={120}
              value={toEntity}
              onChange={(e) => setToEntity(e.target.value)}
              placeholder="Contoh: HIPMI PT Telkom / Vendor"
              className="min-h-[42px] w-full rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-sm text-[#06231D]"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#06231D]">
              Nominal (Rp)
            </label>
            <input
              type="number"
              required
              min={1}
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="500000"
              className="min-h-[42px] w-full rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-sm tabular-nums text-[#06231D]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#06231D]">
              Tanggal Transaksi
            </label>
            <input
              type="date"
              required
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="min-h-[42px] w-full rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-sm text-[#06231D]"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-[#06231D]">
            Keterangan / Uraian Transaksi
          </label>
          <textarea
            required
            minLength={3}
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Contoh: Dana Sponsorship Raker HIPMI PT Telkom 2026"
            className="w-full rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] p-3 text-sm text-[#06231D]"
          />
        </div>

        {error ? (
          <p className="rounded-[8px] border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] cursor-pointer rounded-[8px] border border-[#D4E4DC] px-4 text-xs font-semibold text-[#06231D]"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="min-h-[40px] cursor-pointer rounded-[8px] bg-[#076653] px-5 font-display text-xs font-bold text-[#FFFDEE] hover:bg-[#06231D] disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : "Ajukan Transaksi"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function ApprovalModal({
  tx,
  onClose,
  onProcessed,
}: {
  tx: FinanceTransaction | null;
  onClose: () => void;
  onProcessed: (status: "APPROVED" | "REJECTED") => void;
}) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRejectionReason("");
    setError(null);
  }, [tx]);

  if (!tx) return null;

  const typeMeta = TX_TYPE_META[tx.type];

  const handleDecision = async (status: "APPROVED" | "REJECTED") => {
    setError(null);
    if (status === "REJECTED" && !rejectionReason.trim()) {
      setError("Mohon isi alasan penolakan transaksi.");
      return;
    }

    setProcessing(true);
    try {
      await apiRequest(`/api/finance/transactions/${tx.id}/approve`, {
        method: "PATCH",
        body: JSON.stringify({
          status,
          rejectionReason:
            status === "REJECTED" ? rejectionReason.trim() : undefined,
        }),
      });
      onProcessed(status);
    } catch (err: any) {
      setError(err?.message || "Gagal memproses persetujuan transaksi");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#06231D]/75 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg space-y-4 rounded-[14px] border border-[#D4E4DC] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-[10px] font-bold uppercase tracking-[0.08em] text-[#076653]">
              OTORISASI TRANSAKSI &amp; PENERBITAN RESI
            </p>
            <h2 className="mt-0.5 font-display text-base font-extrabold text-[#06231D]">
              Verifikasi Transaksi Kas
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded text-[#475569] hover:bg-[#F1F5F9]"
            aria-label="Tutup modal verifikasi"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2 rounded-xl border border-[#D4E4DC] bg-[#FFFDEE] p-4 text-xs">
          <div className="flex items-center justify-between">
            <span
              className={`rounded-full border px-2.5 py-0.5 font-bold ${typeMeta.badgeClass}`}
            >
              {typeMeta.label}
            </span>
            <span className="tabular-nums text-[#64748B]">
              {formatDateId(tx.transactionDate)}
            </span>
          </div>
          <p className={`font-display text-2xl font-extrabold tabular-nums ${typeMeta.amountClass}`}>
            {typeMeta.amountPrefix}
            {formatRupiah(tx.amount)}
          </p>
          <p className="font-semibold text-[#06231D]">
            {tx.fromEntity} → {tx.toEntity}
          </p>
          <p className="text-[#475569]">{tx.description}</p>
          <p className="text-[11px] text-[#64748B]">
            Diajukan oleh: {tx.creatorName || "-"}
          </p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-[#06231D]">
            Alasan Penolakan (wajib jika memilih Tolak)
          </label>
          <input
            type="text"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Contoh: Bukti kwitansi belum sesuai nominal"
            className="min-h-[40px] w-full rounded-[8px] border border-[#D4E4DC] bg-white px-3 text-xs text-[#06231D]"
          />
        </div>

        {error ? (
          <p className="rounded-[8px] border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          <button
            type="button"
            disabled={processing}
            onClick={() => handleDecision("REJECTED")}
            className="inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-[8px] border border-red-300 bg-red-50 px-4 text-xs font-bold text-red-700 hover:bg-red-600 hover:text-white disabled:opacity-50"
          >
            <XCircle className="h-4 w-4" />
            Tolak Transaksi
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] cursor-pointer rounded-[8px] border border-[#D4E4DC] px-4 text-xs font-semibold text-[#06231D]"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={processing}
              onClick={() => handleDecision("APPROVED")}
              className="inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-[8px] bg-[#076653] px-4 font-display text-xs font-bold text-[#FFFDEE] hover:bg-[#06231D] disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4 text-[#E3EF26]" />
              {processing ? "Memproses..." : "Setujui & Terbitkan Resi"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ReceiptPreviewModal({
  tx,
  onClose,
}: {
  tx: FinanceTransaction | null;
  onClose: () => void;
}) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tx) {
      setPdfUrl(null);
      setPdfBlob(null);
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;
    setLoading(true);
    setError(null);
    setPdfUrl(null);
    setPdfBlob(null);

    apiDownloadBlob(`/api/finance/transactions/${tx.id}/receipt`)
      .then(({ blob }) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setPdfBlob(blob);
        setPdfUrl(objectUrl);
      })
      .catch((err: any) => {
        if (!cancelled) {
          setError(err?.message || "Gagal memuat PDF resi kas");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [tx]);

  if (!tx) return null;

  const safeReceiptName = `${(tx.receiptNumber || `receipt-${tx.id}`).replace(
    /[/\\?%*:|"<>]/g,
    "-"
  )}.pdf`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#06231D]/75 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-[14px] border border-[#D4E4DC] bg-white shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] bg-[#06231D] px-6 py-4 text-[#FFFDEE]">
          <div>
            <p className="font-display text-[10px] font-bold uppercase tracking-[0.08em] text-[#E3EF26]">
              KUITANSI / RESI KAS RESMI DIGITAL
            </p>
            <h2 className="mt-0.5 font-display text-base font-extrabold">
              {tx.receiptNumber || "Nomor Resi"} — {formatRupiah(tx.amount)}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {pdfUrl ? (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-[8px] border border-[#E3EF26]/60 px-3 text-xs font-bold text-[#FFFDEE] hover:bg-[#09352C]"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Tab Baru
              </a>
            ) : null}
            {pdfBlob ? (
              <button
                type="button"
                onClick={() => triggerBlobDownload(pdfBlob, safeReceiptName)}
                className="inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-[8px] bg-[#E3EF26] px-3.5 font-display text-xs font-bold text-[#06231D]"
              >
                <Download className="h-3.5 w-3.5" />
                Unduh PDF
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded text-[#C7DCD2] hover:bg-[#0C342C] hover:text-white"
              aria-label="Tutup pratinjau resi"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 bg-[#F1F5F9]">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#D4E4DC] border-t-[#076653]" />
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center p-6">
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
                {error}
              </p>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              title={`Resi Kas ${tx.receiptNumber || tx.id}`}
              className="h-full w-full border-0"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
