"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  KeyRound,
  Upload,
  X,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import {
  INTEREST_CATEGORIES,
  KADER_STATUSES,
  KADER_STATUS_META,
  downloadKaderImportTemplateCsv,
  type KaderImportResult,
  type KaderInterestCategory,
  type KaderRecord,
  type KaderStatus,
  type RoleOption,
} from "@/lib/kader";
import { formatDateTimeId } from "@/lib/tracking";

export function KaderFormModal({
  open,
  initial,
  roles,
  onClose,
  onSaved,
}: {
  open: boolean;
  initial: KaderRecord | null;
  roles: RoleOption[];
  onClose: () => void;
  onSaved: (isEdit: boolean) => void;
}) {
  const [roleId, setRoleId] = useState("");
  const [nim, setNim] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [prodi, setProdi] = useState("");
  const [fakultas, setFakultas] = useState("");
  const [instagram, setInstagram] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [interestCategory, setInterestCategory] =
    useState<KaderInterestCategory>("Punya Bisnis");
  const [status, setStatus] = useState<KaderStatus>("Aktif");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (initial) {
      setRoleId(initial.roleId);
      setNim(initial.nim);
      setPassword("");
      setFullName(initial.fullName);
      setWhatsappNumber(initial.whatsappNumber);
      setProdi(initial.prodi);
      setFakultas(initial.fakultas);
      setInstagram(initial.instagram || "");
      setBusinessName(initial.businessName || "");
      setInterestCategory(initial.interestCategory);
      setStatus(initial.status);
    } else {
      const kader1Role = roles.find(
        (r) => r.name.toLowerCase() === "kader 1"
      );
      setRoleId(kader1Role?.id || roles[0]?.id || "");
      setNim("");
      setPassword("");
      setFullName("");
      setWhatsappNumber("");
      setProdi("");
      setFakultas("");
      setInstagram("");
      setBusinessName("");
      setInterestCategory("Belum Punya Bisnis");
      setStatus("Aktif");
    }
  }, [open, initial, roles]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const basePayload: Record<string, any> = {
        roleId,
        nim: nim.trim(),
        fullName: fullName.trim(),
        whatsappNumber: whatsappNumber.trim(),
        prodi: prodi.trim(),
        fakultas: fakultas.trim(),
        instagram: instagram.trim() || undefined,
        businessName: businessName.trim() || undefined,
        interestCategory,
        status,
      };
      if (!initial && password.trim().length > 0) {
        basePayload.password = password.trim();
      }

      if (initial) {
        await apiRequest(`/api/kaders/${initial.id}`, {
          method: "PATCH",
          body: JSON.stringify(basePayload),
        });
      } else {
        await apiRequest("/api/kaders", {
          method: "POST",
          body: JSON.stringify(basePayload),
        });
      }
      onSaved(Boolean(initial));
    } catch (err: any) {
      setError(err?.message || "Gagal menyimpan data kader");
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
        className="max-h-[90vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-[14px] border border-[#D4E4DC] bg-white p-6 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-extrabold text-[#06231D]">
              {initial ? "Edit Data Kader" : "Tambah Kader Baru"}
            </h2>
            <p className="text-xs text-[#64748B]">
              {initial
                ? "Perbarui data akademik, usaha, minat, status, dan role kader."
                : "Jika password dikosongkan, password awal otomatis menggunakan NIM."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded text-[#475569] hover:bg-[#F1F5F9]"
            aria-label="Tutup modal kader"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#06231D]">
              Nama Lengkap *
            </label>
            <input
              type="text"
              required
              minLength={3}
              maxLength={120}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Contoh: Budi Santoso"
              className="min-h-[40px] w-full rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-sm text-[#06231D]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#06231D]">
              NIM (Unique ID) *
            </label>
            <input
              type="text"
              required
              minLength={5}
              maxLength={20}
              value={nim}
              onChange={(e) => setNim(e.target.value)}
              placeholder="Contoh: 1201240001"
              className="min-h-[40px] w-full rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-sm tabular-nums text-[#06231D]"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#06231D]">
              Role Organisasi *
            </label>
            <select
              required
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className="min-h-[40px] w-full rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-sm text-[#06231D]"
            >
              <option value="" disabled>
                Pilih role...
              </option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#06231D]">
              Status Keaktifan *
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as KaderStatus)}
              className="min-h-[40px] w-full rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-sm text-[#06231D]"
            >
              {KADER_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#06231D]">
              Nomor WhatsApp Aktif *
            </label>
            <input
              type="text"
              required
              minLength={8}
              maxLength={20}
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="081234567890"
              className="min-h-[40px] w-full rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-sm tabular-nums text-[#06231D]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#06231D]">
              Username Instagram (Opsional)
            </label>
            <input
              type="text"
              maxLength={60}
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="@username"
              className="min-h-[40px] w-full rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-sm text-[#06231D]"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#06231D]">
              Program Studi (Prodi) *
            </label>
            <input
              type="text"
              required
              minLength={2}
              maxLength={80}
              value={prodi}
              onChange={(e) => setProdi(e.target.value)}
              placeholder="S1 Sistem Informasi"
              className="min-h-[40px] w-full rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-sm text-[#06231D]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#06231D]">
              Fakultas *
            </label>
            <input
              type="text"
              required
              minLength={2}
              maxLength={80}
              value={fakultas}
              onChange={(e) => setFakultas(e.target.value)}
              placeholder="Fakultas Rekayasa Industri"
              className="min-h-[40px] w-full rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-sm text-[#06231D]"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#06231D]">
              Kategori Minat *
            </label>
            <select
              value={interestCategory}
              onChange={(e) =>
                setInterestCategory(e.target.value as KaderInterestCategory)
              }
              className="min-h-[40px] w-full rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-sm text-[#06231D]"
            >
              {INTEREST_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#06231D]">
              Nama / Jenis Bisnis (Opsional)
            </label>
            <input
              type="text"
              maxLength={120}
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Contoh: Telkom Tech Studio"
              className="min-h-[40px] w-full rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-sm text-[#06231D]"
            />
          </div>
        </div>

        {!initial ? (
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#06231D]">
              Password Awal (Opsional — Min. 6 karakter, kosongkan untuk pakai NIM)
            </label>
            <input
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Kosongkan untuk default sama dengan NIM"
              className="min-h-[40px] w-full rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-sm text-[#06231D]"
            />
          </div>
        ) : null}

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
            disabled={saving || !roleId}
            className="min-h-[40px] cursor-pointer rounded-[8px] bg-[#076653] px-5 font-display text-xs font-bold text-[#FFFDEE] hover:bg-[#06231D] disabled:opacity-50"
          >
            {saving
              ? "Menyimpan..."
              : initial
              ? "Simpan Perubahan"
              : "Simpan Kader Baru"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function ResetPasswordModal({
  kader,
  onClose,
  onResetDone,
}: {
  kader: KaderRecord | null;
  onClose: () => void;
  onResetDone: (message: string) => void;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setNewPassword("");
    setError(null);
  }, [kader]);

  if (!kader) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const body =
        newPassword.trim().length > 0
          ? { newPassword: newPassword.trim() }
          : {};
      const res = await apiRequest<{ resetToNim: boolean }>(
        `/api/kaders/${kader.id}/reset-password`,
        {
          method: "POST",
          body: JSON.stringify(body),
        }
      );
      onResetDone(
        res.resetToNim
          ? `Password ${kader.fullName} berhasil direset ke NIM (${kader.nim}).`
          : `Password ${kader.fullName} berhasil diperbarui.`
      );
    } catch (err: any) {
      setError(err?.message || "Gagal mereset password kader");
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
        className="w-full max-w-md space-y-4 rounded-[14px] border border-[#D4E4DC] bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-[10px] font-bold uppercase tracking-[0.08em] text-[#076653]">
              RESET PASSWORD ADMIN / BPH (PRD 3.1)
            </p>
            <h2 className="mt-0.5 font-display text-base font-extrabold text-[#06231D]">
              Reset Password {kader.fullName}
            </h2>
            <p className="text-xs text-[#64748B] tabular-nums">
              NIM {kader.nim} • Role {kader.roleName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded text-[#475569] hover:bg-[#F1F5F9]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-[#06231D]">
            Password Baru (Min. 6 karakter, kosongkan untuk reset ke NIM)
          </label>
          <input
            type="password"
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={`Kosongkan untuk reset ke ${kader.nim}`}
            className="min-h-[40px] w-full rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-sm text-[#06231D]"
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
            className="min-h-[38px] cursor-pointer rounded-[8px] border border-[#D4E4DC] px-4 text-xs font-semibold text-[#06231D]"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-[8px] bg-[#076653] px-4 font-display text-xs font-bold text-[#FFFDEE] hover:bg-[#06231D] disabled:opacity-50"
          >
            <KeyRound className="h-3.5 w-3.5 text-[#E3EF26]" />
            {saving
              ? "Mereset..."
              : newPassword.trim()
              ? "Simpan Password Baru"
              : "Reset ke NIM"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function ImportKaderModal({
  open,
  onClose,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  onImported: (result: KaderImportResult) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<KaderImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setFile(null);
    setResult(null);
    setError(null);
  }, [open]);

  if (!open) return null;

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await apiRequest<KaderImportResult>("/api/kaders/import", {
        method: "POST",
        body: form,
      });
      setResult(res);
      onImported(res);
    } catch (err: any) {
      setError(err?.message || "Gagal mengimpor file kader");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#06231D]/70 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg space-y-4 rounded-[14px] border border-[#D4E4DC] bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-extrabold text-[#06231D]">
              Import Massal Kader (Khusus NIM)
            </h2>
            <p className="text-xs text-[#64748B]">
              NIM baru otomatis dibuat dengan <strong>Password = NIM</strong> &amp; role default <strong>Kader 1</strong> (wajib lengkapi data &amp; ubah password saat login pertama). NIM yang sudah terdaftar otomatis di-skip.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded text-[#475569] hover:bg-[#F1F5F9]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-xl border border-[#D4E4DC] bg-[#FFFDEE] p-3.5 text-xs text-[#2F4F46]">
          <p className="font-bold text-[#06231D]">Format Kolom Wajib:</p>
          <p className="mt-1 leading-relaxed">
            Cukup 1 kolom <code>NIM</code> pada file Excel (<code>.xlsx</code>/<code>.xls</code>) atau CSV. Biodata akan dilengkapi langsung oleh kader yang bersangkutan saat pertama kali login.
          </p>
          <button
            type="button"
            onClick={downloadKaderImportTemplateCsv}
            className="mt-2.5 inline-flex cursor-pointer items-center gap-1.5 font-bold text-[#076653] underline"
          >
            <Download className="h-3.5 w-3.5" />
            Unduh Contoh Template CSV (NIM)
          </button>
        </div>

        <form onSubmit={handleImport} className="space-y-3">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-5 text-center hover:border-[#076653]">
            <FileSpreadsheet className="h-7 w-7 text-[#076653]" />
            <span className="mt-2 text-xs font-bold text-[#06231D]">
              {file ? file.name : "Pilih file .xlsx, .xls, atau .csv"}
            </span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
            />
          </label>

          {error ? (
            <p className="rounded-[8px] border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              {error}
            </p>
          ) : null}

          {result ? (
            <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-900">
              <p className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Import selesai: {result.totalProcessed} baris diproses
              </p>
              <p className="tabular-nums">
                Baru: <strong>{result.created}</strong> • Dilewati (Sudah Ada):{" "}
                <strong>{result.skipped ?? result.updated}</strong> • Gagal:{" "}
                <strong>{result.failed}</strong>
              </p>
              {result.errors.length > 0 ? (
                <ul className="max-h-24 list-disc overflow-y-auto pl-4 text-[11px] text-red-700">
                  {result.errors.map((errItem, idx) => (
                    <li key={idx}>
                      Baris {errItem.row} ({errItem.nim || "-"}): {errItem.error}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[38px] cursor-pointer rounded-[8px] border border-[#D4E4DC] px-4 text-xs font-semibold text-[#06231D]"
            >
              Tutup
            </button>
            <button
              type="submit"
              disabled={!file || uploading}
              className="inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-[8px] bg-[#076653] px-4 font-display text-xs font-bold text-[#FFFDEE] hover:bg-[#06231D] disabled:opacity-50"
            >
              <Upload className="h-3.5 w-3.5 text-[#E3EF26]" />
              {uploading ? "Mengimpor..." : "Mulai Import"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function KaderDetailModal({
  kader,
  onClose,
}: {
  kader: KaderRecord | null;
  onClose: () => void;
}) {
  if (!kader) return null;
  const stMeta = KADER_STATUS_META[kader.status];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#06231D]/70 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg overflow-hidden rounded-[14px] border border-[#D4E4DC] bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 bg-[#06231D] px-6 py-4 text-[#FFFDEE]">
          <div>
            <p className="font-display text-[10px] font-bold uppercase tracking-[0.08em] text-[#E3EF26]">
              PROFIL LENGKAP KADER
            </p>
            <h2 className="mt-0.5 font-display text-base font-extrabold">
              {kader.fullName}
            </h2>
            <p className="mt-0.5 text-xs text-[#C7DCD2] tabular-nums">
              NIM {kader.nim} • {kader.roleName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded text-[#C7DCD2] hover:bg-[#0C342C] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-3 p-6 text-xs sm:grid-cols-2">
          <div>
            <p className="text-[#64748B]">Status &amp; Skor</p>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${stMeta.className}`}
              >
                {stMeta.label}
              </span>
              <span className="font-display font-extrabold tabular-nums text-[#076653]">
                {kader.totalScore} pts
              </span>
            </div>
          </div>
          <div>
            <p className="text-[#64748B]">WhatsApp Aktif</p>
            <p className="mt-1 font-semibold tabular-nums text-[#06231D]">
              {kader.whatsappNumber}
            </p>
          </div>
          <div>
            <p className="text-[#64748B]">Program Studi</p>
            <p className="mt-1 font-semibold text-[#06231D]">{kader.prodi}</p>
          </div>
          <div>
            <p className="text-[#64748B]">Fakultas</p>
            <p className="mt-1 font-semibold text-[#06231D]">{kader.fakultas}</p>
          </div>
          <div>
            <p className="text-[#64748B]">Instagram</p>
            <p className="mt-1 font-semibold text-[#06231D]">
              {kader.instagram || "-"}
            </p>
          </div>
          <div>
            <p className="text-[#64748B]">Nama / Jenis Bisnis</p>
            <p className="mt-1 font-semibold text-[#06231D]">
              {kader.businessName || "-"}
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-[#64748B]">Kategori Minat</p>
            <p className="mt-1 font-semibold text-[#06231D]">
              {kader.interestCategory}
            </p>
          </div>
          <div className="sm:col-span-2 text-[11px] text-[#94A3B8]">
            Terdaftar: {formatDateTimeId(kader.createdAt)}
          </div>
        </div>

        <div className="flex justify-end border-t border-[#E2E8F0] bg-[#F8FAFC] px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[38px] cursor-pointer rounded-[8px] border border-[#D4E4DC] bg-white px-4 text-xs font-semibold text-[#06231D]"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
