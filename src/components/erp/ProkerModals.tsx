"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CheckCheck, Search, X } from "lucide-react";
import { apiRequest } from "@/lib/api";
import {
  ATTENDANCE_STATUS_META,
  BIDANG_OPTIONS,
  formatDateTimeId,
  type AttendanceStatus,
  type KaderOption,
  type MeetingDetail,
  type ProkerBidang,
  type ProkerItem,
  type ProkerStatus,
} from "@/lib/tracking";

const STATUS_CHOICES: AttendanceStatus[] = ["HADIR", "IZIN", "SAKIT", "ALPHA"];

export function ProkerFormModal({
  open,
  initial,
  kaderOptions,
  onClose,
  onSaved,
}: {
  open: boolean;
  initial: ProkerItem | null;
  kaderOptions: KaderOption[];
  onClose: () => void;
  onSaved: (saved: ProkerItem, isEdit: boolean) => void;
}) {
  const [bidang, setBidang] = useState<ProkerBidang>("OKK");
  const [title, setTitle] = useState("");
  const [picKaderId, setPicKaderId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<ProkerStatus>("PLANNED");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (initial) {
      setBidang(initial.bidang);
      setTitle(initial.title);
      setPicKaderId(initial.picKaderId);
      setStartDate(initial.startDate.slice(0, 10));
      setEndDate(initial.endDate.slice(0, 10));
      setStatus(initial.status);
    } else {
      const today = new Date().toISOString().slice(0, 10);
      setBidang("OKK");
      setTitle("");
      setPicKaderId(kaderOptions[0]?.id ?? "");
      setStartDate(today);
      setEndDate(today);
      setStatus("PLANNED");
    }
  }, [open, initial, kaderOptions]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (endDate < startDate) {
      setError("Tanggal selesai tidak boleh lebih awal dari tanggal mulai.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        bidang,
        title: title.trim(),
        picKaderId,
        startDate,
        endDate,
        status,
      };
      const saved = initial
        ? await apiRequest<ProkerItem>(`/api/tracking/prokers/${initial.id}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
          })
        : await apiRequest<ProkerItem>("/api/tracking/prokers", {
            method: "POST",
            body: JSON.stringify(payload),
          });
      onSaved(saved, Boolean(initial));
    } catch (err: any) {
      setError(err?.message || "Gagal menyimpan program kerja");
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
              {initial ? "Edit Program Kerja" : "Tambah Program Kerja Baru"}
            </h2>
            <p className="text-xs text-[#64748B]">
              Tentukan bidang, penanggung jawab (PIC), dan jadwal pelaksanaan.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded text-[#475569] hover:bg-[#F1F5F9]"
            aria-label="Tutup modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#06231D]">
              Bidang
            </label>
            <select
              value={bidang}
              onChange={(e) => setBidang(e.target.value as ProkerBidang)}
              className="min-h-[42px] w-full rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-sm text-[#06231D]"
            >
              {BIDANG_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#06231D]">
              Status Proker
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProkerStatus)}
              className="min-h-[42px] w-full rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-sm text-[#06231D]"
            >
              <option value="PLANNED">PLANNED (Terencana)</option>
              <option value="ON_PROGRESS">ON_PROGRESS (Berjalan)</option>
              <option value="COMPLETED">COMPLETED (Selesai)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-[#06231D]">
            Nama Program Kerja (3–120 karakter)
          </label>
          <input
            type="text"
            required
            minLength={3}
            maxLength={120}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Telkom Entrepreneur Summit 2026"
            className="min-h-[42px] w-full rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-sm text-[#06231D]"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-[#06231D]">
            PIC Kader (Penanggung Jawab)
          </label>
          <select
            required
            value={picKaderId}
            onChange={(e) => setPicKaderId(e.target.value)}
            className="min-h-[42px] w-full rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-sm text-[#06231D]"
          >
            <option value="" disabled>
              Pilih kader PIC...
            </option>
            {kaderOptions.map((k) => (
              <option key={k.id} value={k.id}>
                {k.fullName} ({k.nim})
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#06231D]">
              Tanggal Mulai
            </label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="min-h-[42px] w-full rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-sm text-[#06231D]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#06231D]">
              Tanggal Selesai
            </label>
            <input
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="min-h-[42px] w-full rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-sm text-[#06231D]"
            />
          </div>
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
            className="min-h-[40px] cursor-pointer rounded-[8px] border border-[#D4E4DC] px-4 text-xs font-semibold text-[#06231D] hover:bg-[#F8FAFC]"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving || !picKaderId}
            className="min-h-[40px] cursor-pointer rounded-[8px] bg-[#076653] px-5 font-display text-xs font-bold text-[#FFFDEE] transition hover:bg-[#06231D] disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : initial ? "Simpan Perubahan" : "Buat Proker"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function MeetingFormModal({
  open,
  defaultProkerId,
  prokerOptions,
  onClose,
  onCreated,
}: {
  open: boolean;
  defaultProkerId: string | null;
  prokerOptions: ProkerItem[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [prokerId, setProkerId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [pointsPerAttendance, setPointsPerAttendance] = useState(5);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setProkerId(defaultProkerId || "");
    setTitle("");
    const now = new Date();
    const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setMeetingDate(localIso);
    setPointsPerAttendance(5);
  }, [open, defaultProkerId]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await apiRequest("/api/tracking/meetings", {
        method: "POST",
        body: JSON.stringify({
          prokerId: prokerId || null,
          title: title.trim(),
          meetingDate: new Date(meetingDate).toISOString(),
          pointsPerAttendance: Number(pointsPerAttendance) || 5,
        }),
      });
      onCreated();
    } catch (err: any) {
      setError(err?.message || "Gagal membuat sesi rapat");
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
              Buat Sesi Rapat &amp; Presensi
            </h2>
            <p className="text-xs text-[#64748B]">
              Rapat dapat ditautkan ke proker atau sebagai rapat internal umum.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded text-[#475569] hover:bg-[#F1F5F9]"
            aria-label="Tutup modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-[#06231D]">
            Tautkan ke Program Kerja (Opsional)
          </label>
          <select
            value={prokerId}
            onChange={(e) => setProkerId(e.target.value)}
            className="min-h-[42px] w-full rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-sm text-[#06231D]"
          >
            <option value="">Rapat Internal Umum (Tanpa Proker)</option>
            {prokerOptions.map((p) => (
              <option key={p.id} value={p.id}>
                [{p.bidang}] {p.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-[#06231D]">
            Judul Sesi Rapat (3–120 karakter)
          </label>
          <input
            type="text"
            required
            minLength={3}
            maxLength={120}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Rapat Koordinasi Perdana Kepanitiaan"
            className="min-h-[42px] w-full rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-sm text-[#06231D]"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#06231D]">
              Jadwal Rapat
            </label>
            <input
              type="datetime-local"
              required
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              className="min-h-[42px] w-full rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-sm text-[#06231D]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#06231D]">
              Poin per Kehadiran (HADIR)
            </label>
            <input
              type="number"
              min={1}
              max={100}
              required
              value={pointsPerAttendance}
              onChange={(e) => setPointsPerAttendance(Number(e.target.value))}
              className="min-h-[42px] w-full rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-sm tabular-nums text-[#06231D]"
            />
          </div>
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
            className="min-h-[40px] cursor-pointer rounded-[8px] border border-[#D4E4DC] px-4 text-xs font-semibold text-[#06231D] hover:bg-[#F8FAFC]"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="min-h-[40px] cursor-pointer rounded-[8px] bg-[#076653] px-5 font-display text-xs font-bold text-[#FFFDEE] transition hover:bg-[#06231D] disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : "Simpan Rapat"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function AttendanceModal({
  meetingId,
  canCreate,
  kaderOptions,
  onClose,
  onSaved,
}: {
  meetingId: string | null;
  canCreate: boolean;
  kaderOptions: KaderOption[];
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [detail, setDetail] = useState<MeetingDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [draftStatuses, setDraftStatuses] = useState<Record<string, AttendanceStatus>>({});

  useEffect(() => {
    if (!meetingId) {
      setDetail(null);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    setSearch("");

    apiRequest<MeetingDetail>(`/api/tracking/meetings/${meetingId}`)
      .then((res) => {
        if (!active) return;
        setDetail(res);
        const initialMap: Record<string, AttendanceStatus> = {};
        for (const att of res.attendances || []) {
          initialMap[att.kaderId] = att.status;
        }
        setDraftStatuses(initialMap);
      })
      .catch((err: any) => {
        if (!active) return;
        setError(err?.message || "Gagal memuat detail presensi rapat");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [meetingId]);

  const mergedRows = useMemo(() => {
    const map = new Map<
      string,
      {
        kaderId: string;
        fullName: string;
        nim: string;
        existingStatus?: AttendanceStatus;
        existingPoints?: number;
      }
    >();

    for (const k of kaderOptions) {
      map.set(k.id, {
        kaderId: k.id,
        fullName: k.fullName,
        nim: k.nim,
      });
    }

    for (const att of detail?.attendances || []) {
      const prev = map.get(att.kaderId);
      map.set(att.kaderId, {
        kaderId: att.kaderId,
        fullName: att.kaderName || prev?.fullName || "Kader",
        nim: att.nim || prev?.nim || "-",
        existingStatus: att.status,
        existingPoints: att.pointsAwarded,
      });
    }

    const q = search.trim().toLowerCase();
    return Array.from(map.values())
      .filter(
        (r) =>
          !q ||
          r.fullName.toLowerCase().includes(q) ||
          r.nim.toLowerCase().includes(q)
      )
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [kaderOptions, detail, search]);

  if (!meetingId) return null;

  const markAllPresent = () => {
    const next = { ...draftStatuses };
    for (const row of mergedRows) {
      next[row.kaderId] = "HADIR";
    }
    setDraftStatuses(next);
  };

  const handleSave = async () => {
    const payloadAttendances = Object.entries(draftStatuses).map(
      ([kaderId, status]) => ({
        kaderId,
        status,
      })
    );
    if (!payloadAttendances.length) {
      setError("Pilih minimal 1 status presensi kader sebelum menyimpan.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await apiRequest(`/api/tracking/meetings/${meetingId}/attendances`, {
        method: "POST",
        body: JSON.stringify({ attendances: payloadAttendances }),
      });
      onSaved("Presensi rapat dan penyesuaian skor kader berhasil disimpan.");
    } catch (err: any) {
      setError(err?.message || "Gagal menyimpan presensi rapat");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#06231D]/75 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[14px] border border-[#D4E4DC] bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#E2E8F0] bg-[#06231D] px-6 py-4 text-[#FFFDEE]">
          <div>
            <p className="font-display text-[10px] font-bold uppercase tracking-[0.08em] text-[#E3EF26]">
              LOG PRESENSI &amp; SKORING OTOMATIS
            </p>
            <h2 className="mt-0.5 font-display text-base font-extrabold">
              {detail?.title || "Memuat Sesi Rapat..."}
            </h2>
            {detail ? (
              <p className="mt-1 text-xs text-[#C7DCD2]">
                {formatDateTimeId(detail.meetingDate)} • Bobot Hadir:{" "}
                <strong className="text-[#E3EF26]">
                  +{detail.pointsPerAttendance} pts
                </strong>
                {detail.prokerTitle ? ` • Proker: ${detail.prokerTitle}` : ""}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded text-[#C7DCD2] hover:bg-[#0C342C] hover:text-white"
            aria-label="Tutup modal presensi"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#D4E4DC] border-t-[#076653]" />
            </div>
          ) : (
            <>
              <div className="rounded-[10px] border border-[#D4E4DC] bg-[#FFFDEE] px-4 py-3 text-xs text-[#2F4F46]">
                <strong>Aturan Ledger Otomatis:</strong> Kader berstatus{" "}
                <span className="font-bold text-[#076653]">HADIR</span> menerima{" "}
                <span className="tabular-nums font-bold">
                  +{detail?.pointsPerAttendance ?? 5}
                </span>{" "}
                poin (idempoten, tidak menggandakan poin saat disimpan ulang). Mengubah status
                dari <strong>HADIR</strong> ke <strong>IZIN / SAKIT / ALPHA</strong> otomatis
                mencatat reversal ledger negatif dan mengurangi skor kader.
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative min-w-[220px] flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari nama atau NIM kader..."
                    className="min-h-[40px] w-full rounded-[8px] border border-[#D4E4DC] bg-white pl-9 pr-3 text-xs text-[#06231D]"
                  />
                </div>
                {canCreate ? (
                  <button
                    type="button"
                    onClick={markAllPresent}
                    className="inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-[8px] border border-[#076653] bg-[#E2FBCE]/50 px-3.5 text-xs font-bold text-[#076653] transition hover:bg-[#076653] hover:text-white"
                  >
                    <CheckCheck className="h-4 w-4" />
                    Tandai Semua HADIR
                  </button>
                ) : null}
              </div>

              {mergedRows.length === 0 ? (
                <div className="rounded-[10px] border border-dashed border-[#CBD5E1] py-8 text-center text-xs text-[#64748B]">
                  Tidak ada kader aktif yang cocok dengan pencarian.
                </div>
              ) : (
                <div className="divide-y divide-[#E2E8F0] rounded-[10px] border border-[#E2E8F0]">
                  {mergedRows.map((row) => {
                    const currentStatus = draftStatuses[row.kaderId];
                    return (
                      <div
                        key={row.kaderId}
                        className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#06231D]">
                            {row.fullName}
                          </p>
                          <p className="text-xs text-[#64748B] tabular-nums">
                            NIM {row.nim}
                            {row.existingStatus ? (
                              <span className="ml-2 font-medium text-[#076653]">
                                • Tercatat: {row.existingStatus} (
                                {row.existingPoints ?? 0} pts)
                              </span>
                            ) : null}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          {STATUS_CHOICES.map((st) => {
                            const selected = currentStatus === st;
                            return (
                              <button
                                key={st}
                                type="button"
                                disabled={!canCreate}
                                onClick={() =>
                                  setDraftStatuses((prev) => ({
                                    ...prev,
                                    [row.kaderId]: st,
                                  }))
                                }
                                className={`min-h-[34px] cursor-pointer rounded-[6px] border px-2.5 text-[11px] font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                  selected
                                    ? ATTENDANCE_STATUS_META[st].activeClass
                                    : "border-[#CBD5E1] bg-white text-[#475569] hover:bg-[#F8FAFC]"
                                }`}
                              >
                                {ATTENDANCE_STATUS_META[st].label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {error ? (
                <p className="rounded-[8px] border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                  {error}
                </p>
              ) : null}
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[#E2E8F0] bg-[#F8FAFC] px-6 py-4">
          <p className="text-xs text-[#64748B]">
            Terpilih:{" "}
            <strong className="tabular-nums text-[#06231D]">
              {Object.keys(draftStatuses).length}
            </strong>{" "}
            kader
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] cursor-pointer rounded-[8px] border border-[#D4E4DC] bg-white px-4 text-xs font-semibold text-[#06231D]"
            >
              Tutup
            </button>
            {canCreate ? (
              <button
                type="button"
                disabled={saving || loading}
                onClick={handleSave}
                className="min-h-[40px] cursor-pointer rounded-[8px] bg-[#076653] px-5 font-display text-xs font-bold text-[#FFFDEE] transition hover:bg-[#06231D] disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan Presensi"}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
