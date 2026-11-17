"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Globe,
  List,
  Lock,
  MapPin,
  Plus,
  Trash2,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CalendarEventModal } from "@/components/erp/CalendarEventModal";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  CALENDAR_CATEGORIES,
  CALENDAR_CATEGORY_META,
  WEEKDAY_LABELS,
  buildMonthGridDays,
  eventOccursOnDay,
  formatDayKey,
  formatMonthYearId,
  type CalendarCategory,
  type CalendarEventItem,
} from "@/lib/calendar";
import { formatDateTimeId, type ProkerItem } from "@/lib/tracking";

type ViewMode = "month" | "list";

export default function CalendarHipmiPage() {
  const { can } = useAuth();
  const canRead = can("calendar", "read");
  const canCreate = can("calendar", "create");
  const canUpdate = can("calendar", "update");
  const canDelete = can("calendar", "delete");
  const canReadTracking = can("tracking", "read");

  const now = new Date();
  const [cursorYear, setCursorYear] = useState(now.getFullYear());
  const [cursorMonth, setCursorMonth] = useState(now.getMonth());
  const [selectedDayKey, setSelectedDayKey] = useState(() => formatDayKey(now));
  const [viewMode, setViewMode] = useState<ViewMode>("month");

  const [categoryFilter, setCategoryFilter] = useState<"" | CalendarCategory>("");
  const [visibilityFilter, setVisibilityFilter] = useState<"" | "true" | "false">(
    ""
  );

  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [prokerOptions, setProkerOptions] = useState<ProkerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; isError: boolean } | null>(
    null
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEventItem | null>(null);

  const notify = useCallback((message: string, isError = false) => {
    setToast({ message, isError });
    window.setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  }, []);

  const loadEvents = useCallback(async () => {
    if (!canRead) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (categoryFilter) qs.set("category", categoryFilter);
      if (visibilityFilter) qs.set("isPublic", visibilityFilter);
      const queryStr = qs.toString() ? `?${qs.toString()}` : "";
      const list = await apiRequest<CalendarEventItem[]>(
        `/api/calendar${queryStr}`
      );
      setEvents(list || []);
    } catch (err: any) {
      notify(err?.message || "Gagal memuat agenda Calendar HIPMI", true);
    } finally {
      setLoading(false);
    }
  }, [canRead, categoryFilter, visibilityFilter, notify]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    if (!canRead || !canReadTracking) return;
    apiRequest<ProkerItem[]>("/api/tracking/prokers?page=1&limit=100")
      .then((list) => setProkerOptions(list || []))
      .catch(() => {});
  }, [canRead, canReadTracking]);

  const gridDays = useMemo(
    () => buildMonthGridDays(cursorYear, cursorMonth),
    [cursorYear, cursorMonth]
  );

  const todayKey = formatDayKey(new Date());

  const selectedDayEvents = useMemo(
    () => events.filter((ev) => eventOccursOnDay(ev, selectedDayKey)),
    [events, selectedDayKey]
  );

  const handlePrevMonth = () => {
    if (cursorMonth === 0) {
      setCursorYear((y) => y - 1);
      setCursorMonth(11);
    } else {
      setCursorMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (cursorMonth === 11) {
      setCursorYear((y) => y + 1);
      setCursorMonth(0);
    } else {
      setCursorMonth((m) => m + 1);
    }
  };

  const handleJumpToday = () => {
    const today = new Date();
    setCursorYear(today.getFullYear());
    setCursorMonth(today.getMonth());
    setSelectedDayKey(formatDayKey(today));
  };

  const handleDelete = async (ev: CalendarEventItem) => {
    const ok = window.confirm(`Hapus agenda "${ev.title}"?`);
    if (!ok) return;
    try {
      await apiRequest(`/api/calendar/${ev.id}`, { method: "DELETE" });
      notify("Agenda kalender berhasil dihapus.");
      await loadEvents();
    } catch (err: any) {
      notify(err?.message || "Gagal menghapus agenda", true);
    }
  };

  const publicCount = events.filter((e) => e.isPublic).length;
  const internalCount = events.filter((e) => !e.isPublic).length;
  const deadlineCount = events.filter(
    (e) => e.category === "COMPETITION_DEADLINE"
  ).length;

  return (
    <AppShell
      title="Calendar HIPMI"
      breadcrumb="Operasional ERP / Calendar HIPMI"
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
            Akun Anda tidak memiliki izin <code>calendar:read</code> untuk melihat Calendar HIPMI.
          </div>
        ) : (
          <>
            {/* Top Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#D4E4DC] bg-white p-5 shadow-sm">
              <div>
                <h2 className="font-display text-lg font-extrabold text-[#06231D]">
                  Kalender Terpusat Agenda HIPMI PT Telkom
                </h2>
                <p className="mt-0.5 text-xs text-[#64748B]">
                  Seluruh jadwal tersimpan aman di PostgreSQL Supabase (<code>calendar_events</code>). Agenda bertanda <strong>Publik</strong> otomatis tersedia di feed Web UKM.
                </p>
              </div>
              {canCreate ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditingEvent(null);
                    setModalOpen(true);
                  }}
                  className="inline-flex min-h-[42px] cursor-pointer items-center gap-1.5 rounded-[8px] bg-[#076653] px-4 font-display text-xs font-bold text-[#FFFDEE] hover:bg-[#06231D]"
                >
                  <Plus className="h-4 w-4 text-[#E3EF26]" />
                  Tambah Agenda
                </button>
              ) : null}
            </div>

            {/* KPI Summary */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-[#124236] bg-[#06231D] p-4 text-[#FFFDEE]">
                <p className="font-display text-[10px] font-bold uppercase tracking-[0.08em] text-[#E3EF26]">
                  TOTAL AGENDA (FILTER)
                </p>
                <p className="mt-1 font-display text-2xl font-extrabold tabular-nums">
                  {events.length}
                </p>
              </div>
              <div className="rounded-xl border border-[#D4E4DC] bg-white p-4">
                <p className="text-[11px] font-semibold text-[#64748B]">
                  Agenda Publik Web UKM
                </p>
                <p className="mt-1 font-display text-2xl font-extrabold tabular-nums text-[#076653]">
                  {publicCount}
                </p>
              </div>
              <div className="rounded-xl border border-[#D4E4DC] bg-white p-4">
                <p className="text-[11px] font-semibold text-[#64748B]">
                  Agenda Internal Pengurus
                </p>
                <p className="mt-1 font-display text-2xl font-extrabold tabular-nums text-[#06231D]">
                  {internalCount}
                </p>
              </div>
              <div className="rounded-xl border border-[#D4E4DC] bg-white p-4">
                <p className="text-[11px] font-semibold text-[#64748B]">
                  Deadline Kompetisi
                </p>
                <p className="mt-1 font-display text-2xl font-extrabold tabular-nums text-[#DC2626]">
                  {deadlineCount}
                </p>
              </div>
            </div>

            {/* Filter & View Switcher Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#D4E4DC] bg-white p-3 shadow-sm">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode("month")}
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                    viewMode === "month"
                      ? "bg-[#06231D] text-[#E3EF26]"
                      : "text-[#475569] hover:bg-[#F1F5F9]"
                  }`}
                >
                  <CalendarDays className="h-4 w-4" />
                  Kalender Bulanan
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                    viewMode === "list"
                      ? "bg-[#06231D] text-[#E3EF26]"
                      : "text-[#475569] hover:bg-[#F1F5F9]"
                  }`}
                >
                  <List className="h-4 w-4" />
                  Daftar Semua Agenda
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label="Filter Kategori Agenda"
                  value={categoryFilter}
                  onChange={(e) =>
                    setCategoryFilter(e.target.value as "" | CalendarCategory)
                  }
                  className="min-h-[36px] rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-xs font-semibold text-[#06231D]"
                >
                  <option value="">Semua Kategori</option>
                  {CALENDAR_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {CALENDAR_CATEGORY_META[cat].label}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Filter Visibilitas Agenda"
                  value={visibilityFilter}
                  onChange={(e) =>
                    setVisibilityFilter(e.target.value as "" | "true" | "false")
                  }
                  className="min-h-[36px] rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-xs font-semibold text-[#06231D]"
                >
                  <option value="">Publik &amp; Internal</option>
                  <option value="true">Hanya Publik Web</option>
                  <option value="false">Hanya Internal</option>
                </select>
              </div>
            </div>

            {viewMode === "month" ? (
              <div className="grid gap-6 lg:grid-cols-12">
                {/* Month Calendar Grid */}
                <div className="rounded-2xl border border-[#D4E4DC] bg-white p-5 shadow-sm lg:col-span-8">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-display text-base font-extrabold capitalize text-[#06231D]">
                      {formatMonthYearId(cursorYear, cursorMonth)}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleJumpToday}
                        className="min-h-[34px] cursor-pointer rounded-[8px] border border-[#D4E4DC] px-3 text-xs font-semibold text-[#06231D] hover:bg-[#F8FAFC]"
                      >
                        Hari Ini
                      </button>
                      <button
                        type="button"
                        onClick={handlePrevMonth}
                        aria-label="Bulan sebelumnya"
                        className="inline-flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-[8px] border border-[#D4E4DC] text-[#06231D] hover:bg-[#F8FAFC]"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNextMonth}
                        aria-label="Bulan berikutnya"
                        className="inline-flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-[8px] border border-[#D4E4DC] text-[#06231D] hover:bg-[#F8FAFC]"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="mb-3 flex flex-wrap gap-3 text-[11px] font-semibold text-[#475569]">
                    {CALENDAR_CATEGORIES.map((cat) => (
                      <span key={cat} className="inline-flex items-center gap-1.5">
                        <span
                          className={`h-2 w-2 rounded-full ${CALENDAR_CATEGORY_META[cat].dotClass}`}
                        />
                        {CALENDAR_CATEGORY_META[cat].label}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 border-l border-t border-[#E2E8F0]">
                    {WEEKDAY_LABELS.map((dayLabel) => (
                      <div
                        key={dayLabel}
                        className="border-b border-r border-[#E2E8F0] bg-[#FFFDEE] py-2 text-center font-display text-[11px] font-bold uppercase text-[#2F4F46]"
                      >
                        {dayLabel}
                      </div>
                    ))}

                    {gridDays.map((dayDate) => {
                      const dayKey = formatDayKey(dayDate);
                      const inCurrentMonth = dayDate.getMonth() === cursorMonth;
                      const isToday = dayKey === todayKey;
                      const isSelected = dayKey === selectedDayKey;
                      const dayEvents = events.filter((ev) =>
                        eventOccursOnDay(ev, dayKey)
                      );

                      return (
                        <button
                          key={dayKey}
                          type="button"
                          onClick={() => setSelectedDayKey(dayKey)}
                          className={`min-h-[86px] cursor-pointer border-b border-r border-[#E2E8F0] p-1.5 text-left align-top transition ${
                            isSelected
                              ? "bg-[#E2FBCE]/45 ring-2 ring-inset ring-[#076653]"
                              : inCurrentMonth
                              ? "bg-white hover:bg-[#F8FAFC]"
                              : "bg-[#F8FAFC] text-[#94A3B8]"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`inline-flex h-6 w-6 items-center justify-center rounded-full font-display text-xs font-bold tabular-nums ${
                                isToday
                                  ? "bg-[#06231D] text-[#E3EF26]"
                                  : inCurrentMonth
                                  ? "text-[#06231D]"
                                  : "text-[#94A3B8]"
                              }`}
                            >
                              {dayDate.getDate()}
                            </span>
                            {dayEvents.length > 0 ? (
                              <span className="text-[10px] font-bold tabular-nums text-[#076653]">
                                {dayEvents.length}
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-1 space-y-1">
                            {dayEvents.slice(0, 2).map((ev) => (
                              <div
                                key={ev.id}
                                className={`truncate rounded border px-1.5 py-0.5 text-[10px] font-semibold ${
                                  CALENDAR_CATEGORY_META[ev.category].chipClass
                                }`}
                              >
                                {ev.title}
                              </div>
                            ))}
                            {dayEvents.length > 2 ? (
                              <p className="px-1 text-[10px] font-bold text-[#64748B]">
                                +{dayEvents.length - 2} lagi
                              </p>
                            ) : null}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Day Agenda Detail Panel */}
                <div className="rounded-2xl border border-[#D4E4DC] bg-white p-5 shadow-sm lg:col-span-4">
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <div>
                      <p className="font-display text-[10px] font-bold uppercase tracking-[0.08em] text-[#076653]">
                        AGENDA TANGGAL TERPILIH
                      </p>
                      <h3 className="mt-0.5 font-display text-sm font-extrabold text-[#06231D] tabular-nums">
                        {new Intl.DateTimeFormat("id-ID", {
                          weekday: "long",
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        }).format(new Date(`${selectedDayKey}T00:00:00`))}
                      </h3>
                    </div>
                    {canCreate ? (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingEvent(null);
                          setModalOpen(true);
                        }}
                        title="Tambah agenda di tanggal ini"
                        className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-[#076653] text-[#FFFDEE] hover:bg-[#06231D]"
                      >
                        <Plus className="h-4 w-4 text-[#E3EF26]" />
                      </button>
                    ) : null}
                  </div>

                  {loading ? (
                    <div className="flex justify-center py-10">
                      <div className="h-7 w-7 animate-spin rounded-full border-4 border-[#D4E4DC] border-t-[#076653]" />
                    </div>
                  ) : selectedDayEvents.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[#CBD5E1] p-6 text-center text-xs text-[#64748B]">
                      Tidak ada agenda pada tanggal ini.
                      {canCreate ? " Klik + untuk menambahkan jadwal." : ""}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedDayEvents.map((ev) => {
                        const catMeta = CALENDAR_CATEGORY_META[ev.category];
                        return (
                          <div
                            key={ev.id}
                            className="space-y-2 rounded-xl border border-[#E2E8F0] bg-[#FFFDEE]/60 p-3.5"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-1.5">
                              <span
                                className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${catMeta.badgeClass}`}
                              >
                                {catMeta.label}
                              </span>
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  ev.isPublic
                                    ? "bg-[#06231D] text-[#E3EF26]"
                                    : "bg-[#F1F5F9] text-[#475569]"
                                }`}
                              >
                                {ev.isPublic ? (
                                  <Globe className="h-3 w-3" />
                                ) : (
                                  <Lock className="h-3 w-3" />
                                )}
                                {ev.isPublic ? "Publik" : "Internal"}
                              </span>
                            </div>

                            <p className="font-display text-sm font-bold text-[#06231D]">
                              {ev.title}
                            </p>

                            <p className="text-[11px] tabular-nums text-[#475569]">
                              {formatDateTimeId(ev.startAt)} –{" "}
                              {formatDateTimeId(ev.endAt)}
                            </p>

                            <p className="flex items-center gap-1.5 text-[11px] text-[#334155]">
                              <MapPin className="h-3.5 w-3.5 shrink-0 text-[#076653]" />
                              <span>{ev.location}</span>
                            </p>

                            {ev.prokerTitle ? (
                              <p className="text-[11px] font-medium text-[#076653]">
                                Proker: {ev.prokerTitle}
                              </p>
                            ) : null}

                            {(canUpdate || canDelete) ? (
                              <div className="flex justify-end gap-1.5 pt-1">
                                {canUpdate ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingEvent(ev);
                                      setModalOpen(true);
                                    }}
                                    className="inline-flex min-h-[30px] cursor-pointer items-center gap-1 rounded-[6px] border border-[#D4E4DC] bg-white px-2.5 text-[11px] font-semibold text-[#06231D] hover:border-[#076653]"
                                  >
                                    <Edit3 className="h-3 w-3" />
                                    Edit
                                  </button>
                                ) : null}
                                {canDelete ? (
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(ev)}
                                    className="inline-flex min-h-[30px] cursor-pointer items-center gap-1 rounded-[6px] border border-red-200 bg-red-50 px-2.5 text-[11px] font-semibold text-red-700 hover:bg-red-600 hover:text-white"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    Hapus
                                  </button>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* List View */
              <div className="rounded-2xl border border-[#D4E4DC] bg-white p-5 shadow-sm">
                <h3 className="mb-4 font-display text-base font-extrabold text-[#06231D]">
                  Daftar Seluruh Agenda ({events.length})
                </h3>
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#D4E4DC] border-t-[#076653]" />
                  </div>
                ) : events.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#CBD5E1] py-10 text-center text-xs text-[#64748B]">
                    Belum ada agenda kalender yang sesuai filter.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#E2E8F0] text-[11px] uppercase tracking-wider text-[#64748B]">
                          <th className="py-2.5 pr-4">Agenda</th>
                          <th className="py-2.5 pr-4">Kategori</th>
                          <th className="py-2.5 pr-4">Waktu Pelaksanaan</th>
                          <th className="py-2.5 pr-4">Lokasi</th>
                          <th className="py-2.5 pr-4">Visibilitas</th>
                          <th className="py-2.5 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F1F5F9]">
                        {events.map((ev) => {
                          const catMeta = CALENDAR_CATEGORY_META[ev.category];
                          return (
                            <tr key={ev.id}>
                              <td className="py-3 pr-4">
                                <p className="font-bold text-[#06231D]">
                                  {ev.title}
                                </p>
                                {ev.prokerTitle ? (
                                  <p className="text-[11px] text-[#076653]">
                                    Proker: {ev.prokerTitle}
                                  </p>
                                ) : null}
                              </td>
                              <td className="py-3 pr-4">
                                <span
                                  className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${catMeta.badgeClass}`}
                                >
                                  {catMeta.label}
                                </span>
                              </td>
                              <td className="py-3 pr-4 tabular-nums text-[#475569]">
                                {formatDateTimeId(ev.startAt)} –{" "}
                                {formatDateTimeId(ev.endAt)}
                              </td>
                              <td className="py-3 pr-4 text-[#334155]">
                                {ev.location}
                              </td>
                              <td className="py-3 pr-4">
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                    ev.isPublic
                                      ? "bg-[#06231D] text-[#E3EF26]"
                                      : "bg-[#F1F5F9] text-[#475569]"
                                  }`}
                                >
                                  {ev.isPublic ? "Publik Web" : "Internal"}
                                </span>
                              </td>
                              <td className="py-3 text-right">
                                <div className="inline-flex gap-1.5">
                                  {canUpdate ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingEvent(ev);
                                        setModalOpen(true);
                                      }}
                                      className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-[6px] border border-[#D4E4DC] bg-white text-[#076653] hover:bg-[#E2FBCE]/50"
                                      title="Edit Agenda"
                                    >
                                      <Edit3 className="h-3.5 w-3.5" />
                                    </button>
                                  ) : null}
                                  {canDelete ? (
                                    <button
                                      type="button"
                                      onClick={() => handleDelete(ev)}
                                      className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-[6px] border border-red-200 bg-red-50 text-red-700 hover:bg-red-600 hover:text-white"
                                      title="Hapus Agenda"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
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
              </div>
            )}
          </>
        )}
      </div>

      <CalendarEventModal
        open={modalOpen}
        initial={editingEvent}
        defaultDayKey={selectedDayKey}
        prokerOptions={prokerOptions}
        onClose={() => setModalOpen(false)}
        onSaved={async (isEdit) => {
          setModalOpen(false);
          notify(
            isEdit
              ? "Agenda kalender berhasil diperbarui."
              : "Agenda kalender berhasil ditambahkan."
          );
          await loadEvents();
        }}
      />
    </AppShell>
  );
}
