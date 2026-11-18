"use client";

import React, { useEffect, useState } from "react";
import { QrCode, Users, X } from "lucide-react";
import { apiRequest } from "@/lib/api";
import {
  CALENDAR_CATEGORIES,
  CALENDAR_CATEGORY_META,
  toLocalDateTimeInput,
  type CalendarCategory,
  type CalendarEventItem,
  type CalendarRoleOption,
} from "@/lib/calendar";
import type { ProkerItem } from "@/lib/tracking";

export function CalendarEventModal({
  open,
  initial,
  defaultDayKey,
  prokerOptions,
  roleOptions,
  canCreateCalendar,
  canCreateRbpl,
  onClose,
  onSaved,
}: {
  open: boolean;
  initial: CalendarEventItem | null;
  defaultDayKey: string | null;
  prokerOptions: ProkerItem[];
  roleOptions: CalendarRoleOption[];
  canCreateCalendar: boolean;
  canCreateRbpl: boolean;
  onClose: () => void;
  onSaved: (isEdit: boolean, savedEvent: CalendarEventItem | null) => void;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<CalendarCategory>("PROKER");
  const [prokerId, setProkerId] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [location, setLocation] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [enableQrAttendance, setEnableQrAttendance] = useState(false);
  const [pointsPerAttendance, setPointsPerAttendance] = useState("5");
  const [targetRoleIds, setTargetRoleIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectableCategories = CALENDAR_CATEGORIES.filter((cat) => {
    if (initial && initial.category === cat) return true;
    if (cat === "RBPL") return canCreateRbpl;
    return canCreateCalendar;
  });

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (initial) {
      setTitle(initial.title);
      setCategory(initial.category);
      setProkerId(initial.prokerId || "");
      setStartAt(toLocalDateTimeInput(initial.startAt));
      setEndAt(toLocalDateTimeInput(initial.endAt));
      setLocation(initial.location);
      setIsPublic(Boolean(initial.isPublic));
      setEnableQrAttendance(Boolean(initial.enableQrAttendance));
      setPointsPerAttendance(String(initial.pointsPerAttendance ?? 5));
      setTargetRoleIds((initial.targetRoles || []).map((r) => r.id));
    } else {
      const baseDay = defaultDayKey || new Date().toISOString().slice(0, 10);
      setTitle("");
      setCategory(canCreateCalendar ? "PROKER" : "RBPL");
      setProkerId("");
      setStartAt(`${baseDay}T09:00`);
      setEndAt(`${baseDay}T12:00`);
      setLocation("");
      setIsPublic(false);
      setEnableQrAttendance(false);
      setPointsPerAttendance("5");
      setTargetRoleIds([]);
    }
  }, [open, initial, defaultDayKey, canCreateCalendar]);

  if (!open) return null;

  const toggleRole = (roleId: string) => {
    setTargetRoleIds((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const sDate = new Date(startAt);
    const eDate = new Date(endAt);
    if (eDate < sDate) {
      setError("Waktu selesai tidak boleh lebih awal dari waktu mulai.");
      return;
    }

    const parsedPoints = Number.parseInt(pointsPerAttendance, 10);
    if (
      enableQrAttendance &&
      (Number.isNaN(parsedPoints) || parsedPoints < 0 || parsedPoints > 500)
    ) {
      setError("Poin kehadiran harus antara 0 hingga 500.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        prokerId: prokerId || null,
        title: title.trim(),
        category,
        startAt: sDate.toISOString(),
        endAt: eDate.toISOString(),
        location: location.trim(),
        isPublic,
        enableQrAttendance,
        pointsPerAttendance: enableQrAttendance ? parsedPoints : 0,
        targetRoleIds,
      };
      let saved: CalendarEventItem | null = null;
      if (initial) {
        saved = await apiRequest<CalendarEventItem>(`/api/calendar/${initial.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        saved = await apiRequest<CalendarEventItem>("/api/calendar", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      onSaved(Boolean(initial), saved);
    } catch (err: any) {
      setError(err?.message || "Gagal menyimpan agenda kalender");
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
        className="max-h-[92vh] w-full max-w-xl space-y-4 overflow-y-auto rounded-[14px] border border-[#D4E4DC] bg-white p-6 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-extrabold text-[#06231D]">
              {initial ? "Edit Agenda Kalender" : "Tambah Agenda Calendar HIPMI"}
            </h2>
            <p className="text-xs text-[#64748B]">
              Atur jadwal, target role wajib hadir, dan absensi QR otomatis sesuai kebutuhan agenda.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded text-[#475569] hover:bg-[#F1F5F9]"
            aria-label="Tutup modal agenda"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-[#06231D]">
            Judul Agenda (3–140 karakter) *
          </label>
          <input
            type="text"
            required
            minLength={3}
            maxLength={140}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: RBPL Evaluasi Triwulan I / Rapat Pleno"
            className="min-h-[42px] w-full rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-sm text-[#06231D]"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#06231D]">
              Kategori Agenda *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as CalendarCategory)}
              className="min-h-[42px] w-full rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-sm text-[#06231D]"
            >
              {selectableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {CALENDAR_CATEGORY_META[cat].label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-[#06231D]">
              Tautkan Proker (Opsional)
            </label>
            <select
              value={prokerId}
              onChange={(e) => setProkerId(e.target.value)}
              className="min-h-[42px] w-full rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-sm text-[#06231D]"
            >
              <option value="">Agenda Umum / Non-Proker</option>
              {prokerOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.bidang}] {p.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#06231D]">
              Waktu Mulai *
            </label>
            <input
              type="datetime-local"
              required
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              className="min-h-[42px] w-full rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-sm text-[#06231D]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#06231D]">
              Waktu Selesai *
            </label>
            <input
              type="datetime-local"
              required
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              className="min-h-[42px] w-full rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-sm text-[#06231D]"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-[#06231D]">
            Lokasi / Platform (2–140 karakter) *
          </label>
          <input
            type="text"
            required
            minLength={2}
            maxLength={140}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Contoh: Telkom University Convention Hall (TUCH) / Zoom"
            className="min-h-[42px] w-full rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-sm text-[#06231D]"
          />
        </div>

        {/* Target Roles Audience Selection */}
        <div className="space-y-2 rounded-xl border border-[#D4E4DC] bg-[#FFFDEE] p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#06231D]">
              <Users className="h-3.5 w-3.5 text-[#076653]" />
              <span>Role Peserta / Wajib Hadir</span>
            </div>
            {targetRoleIds.length > 0 ? (
              <button
                type="button"
                onClick={() => setTargetRoleIds([])}
                className="cursor-pointer text-[11px] font-semibold text-[#076653] hover:underline"
              >
                Reset ke Semua Role
              </button>
            ) : null}
          </div>
          <p className="text-[11px] text-[#64748B]">
            {targetRoleIds.length === 0
              ? "Kosong = Terbuka untuk semua role yang memiliki akses Calendar HIPMI."
              : `Hanya ${targetRoleIds.length} role terpilih (+ pembuat agenda) yang dapat melihat agenda & absensi ini.`}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {roleOptions.map((r) => {
              const checked = targetRoleIds.includes(r.id);
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => toggleRole(r.id)}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    checked
                      ? "border-[#06231D] bg-[#06231D] text-[#E3EF26]"
                      : "border-[#D4E4DC] bg-white text-[#334155] hover:border-[#076653]"
                  }`}
                >
                  <span>{r.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Flexible QR Attendance Toggle */}
        <div className="space-y-3 rounded-xl border border-[#D4E4DC] bg-[#F8FAFC] p-3.5">
          <label className="flex cursor-pointer items-start gap-2.5 text-xs text-[#06231D]">
            <input
              type="checkbox"
              checked={enableQrAttendance}
              onChange={(e) => setEnableQrAttendance(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#076653]"
            />
            <span>
              <strong className="inline-flex items-center gap-1">
                <QrCode className="h-3.5 w-3.5 text-[#076653]" />
                Aktifkan Absensi QR Code untuk Agenda ini
              </strong>
              <span className="block text-[11px] text-[#64748B]">
                Menghasilkan QR absensi otomatis &amp; tabel kehadiran peserta (No, Nama, Role). Anda berhak membuka/menutup QR kapan saja.
              </span>
            </span>
          </label>

          {enableQrAttendance ? (
            <div className="grid gap-3 border-t border-[#E2E8F0] pt-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#06231D]">
                  Poin Keaktifan per Kehadiran
                </label>
                <input
                  type="number"
                  min={0}
                  max={500}
                  value={pointsPerAttendance}
                  onChange={(e) => setPointsPerAttendance(e.target.value)}
                  className="min-h-[38px] w-full rounded-[8px] border border-[#D4E4DC] bg-white px-3 text-sm tabular-nums text-[#06231D]"
                />
              </div>
              <div className="flex items-end pb-1 text-[11px] text-[#64748B]">
                Otomatis menambah poin leaderboard saat kader scan QR (isi <code>0</code> jika tanpa poin).
              </div>
            </div>
          ) : null}
        </div>

        <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-[#D4E4DC] bg-[#FFFDEE] px-3.5 py-3 text-xs text-[#06231D]">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="h-4 w-4 accent-[#076653]"
          />
          <span>
            <strong>Publikasikan ke Web Profil UKM</strong> (muncul di endpoint publik{" "}
            <code>/api/public/calendar</code>)
          </span>
        </label>

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
            {saving ? "Menyimpan..." : initial ? "Simpan Perubahan" : "Simpan Agenda"}
          </button>
        </div>
      </form>
    </div>
  );
}
