"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { apiRequest } from "@/lib/api";
import {
  CALENDAR_CATEGORIES,
  CALENDAR_CATEGORY_META,
  toLocalDateTimeInput,
  type CalendarCategory,
  type CalendarEventItem,
} from "@/lib/calendar";
import type { ProkerItem } from "@/lib/tracking";

export function CalendarEventModal({
  open,
  initial,
  defaultDayKey,
  prokerOptions,
  onClose,
  onSaved,
}: {
  open: boolean;
  initial: CalendarEventItem | null;
  defaultDayKey: string | null;
  prokerOptions: ProkerItem[];
  onClose: () => void;
  onSaved: (isEdit: boolean) => void;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<CalendarCategory>("PROKER");
  const [prokerId, setProkerId] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [location, setLocation] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    } else {
      const baseDay = defaultDayKey || new Date().toISOString().slice(0, 10);
      setTitle("");
      setCategory("PROKER");
      setProkerId("");
      setStartAt(`${baseDay}T09:00`);
      setEndAt(`${baseDay}T12:00`);
      setLocation("");
      setIsPublic(false);
    }
  }, [open, initial, defaultDayKey]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const sDate = new Date(startAt);
    const eDate = new Date(endAt);
    if (eDate < sDate) {
      setError("Waktu selesai tidak boleh lebih awal dari waktu mulai.");
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
      };
      if (initial) {
        await apiRequest(`/api/calendar/${initial.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest("/api/calendar", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      onSaved(Boolean(initial));
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
        className="w-full max-w-lg space-y-4 rounded-[14px] border border-[#D4E4DC] bg-white p-6 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-extrabold text-[#06231D]">
              {initial ? "Edit Agenda Kalender" : "Tambah Agenda Calendar HIPMI"}
            </h2>
            <p className="text-xs text-[#64748B]">
              Tersimpan di PostgreSQL dan tersedia di feed publik jika dicentang publik.
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
            placeholder="Contoh: HIPMI Business Festival & Expo 2026"
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
              {CALENDAR_CATEGORIES.map((cat) => (
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
