"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Edit3,
  FolderKanban,
  Plus,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  AttendanceModal,
  MeetingFormModal,
  ProkerFormModal,
} from "@/components/erp/ProkerModals";
import { apiRequest, apiRequestWithMeta, type ApiMeta } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  BIDANG_BADGE_MAP,
  BIDANG_OPTIONS,
  PROKER_STATUS_META,
  fetchActiveKaderOptions,
  formatDateId,
  formatDateTimeId,
  type KaderOption,
  type MeetingItem,
  type ProkerBidang,
  type ProkerDetail,
  type ProkerItem,
  type ProkerStatus,
} from "@/lib/tracking";

type ViewTab = "prokers" | "meetings";

export default function ProkerPage() {
  const { can } = useAuth();
  const canRead = can("tracking", "read");
  const canCreate = can("tracking", "create");
  const canUpdate = can("tracking", "update");

  const [tab, setTab] = useState<ViewTab>("prokers");
  const [bidangFilter, setBidangFilter] = useState<"" | ProkerBidang>("");
  const [statusFilter, setStatusFilter] = useState<"" | ProkerStatus>("");
  const [page, setPage] = useState(1);

  const [prokers, setProkers] = useState<ProkerItem[]>([]);
  const [meta, setMeta] = useState<ApiMeta>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [loadingProkers, setLoadingProkers] = useState(true);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  selectedIdRef.current = selectedId;
  const [detail, setDetail] = useState<ProkerDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [allMeetings, setAllMeetings] = useState<MeetingItem[]>([]);
  const [loadingMeetings, setLoadingMeetings] = useState(false);

  const [kaderOptions, setKaderOptions] = useState<KaderOption[]>([]);
  const [toast, setToast] = useState<{ message: string; isError: boolean } | null>(
    null
  );

  // Committee assignment inline form state
  const [committeeKaderId, setCommitteeKaderId] = useState("");
  const [committeeRole, setCommitteeRole] = useState("");
  const [committeePoints, setCommitteePoints] = useState(20);
  const [assigning, setAssigning] = useState(false);

  // Modals
  const [prokerModalOpen, setProkerModalOpen] = useState(false);
  const [editingProker, setEditingProker] = useState<ProkerItem | null>(null);
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);
  const [meetingDefaultProkerId, setMeetingDefaultProkerId] = useState<string | null>(
    null
  );
  const [attendanceMeetingId, setAttendanceMeetingId] = useState<string | null>(
    null
  );

  const notify = useCallback((message: string, isError = false) => {
    setToast({ message, isError });
    window.setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  }, []);

  const loadKaders = useCallback(async () => {
    if (!canRead) return;
    const list = await fetchActiveKaderOptions();
    setKaderOptions(list);
  }, [canRead]);

  const loadProkerDetail = useCallback(
    async (id: string) => {
      setLoadingDetail(true);
      try {
        const res = await apiRequest<ProkerDetail>(`/api/tracking/prokers/${id}`);
        setDetail(res);
      } catch (err: any) {
        notify(err?.message || "Gagal memuat detail program kerja", true);
      } finally {
        setLoadingDetail(false);
      }
    },
    [notify]
  );

  const loadProkers = useCallback(
    async (preferredId?: string | null) => {
      if (!canRead) {
        setLoadingProkers(false);
        return;
      }
      setLoadingProkers(true);
      try {
        const qs = new URLSearchParams({
          page: String(page),
          limit: "20",
        });
        if (bidangFilter) qs.set("bidang", bidangFilter);
        if (statusFilter) qs.set("status", statusFilter);

        const res = await apiRequestWithMeta<ProkerItem[]>(
          `/api/tracking/prokers?${qs.toString()}`
        );
        setProkers(res.data || []);
        setMeta(res.meta);

        const candidateId = preferredId ?? selectedIdRef.current;
        const stillExists = res.data.some((p) => p.id === candidateId);
        const nextId = stillExists ? candidateId ?? null : res.data[0]?.id ?? null;
        setSelectedId(nextId);
        if (nextId) {
          loadProkerDetail(nextId);
        } else {
          setDetail(null);
        }
      } catch (err: any) {
        notify(err?.message || "Gagal memuat daftar program kerja", true);
      } finally {
        setLoadingProkers(false);
      }
    },
    [canRead, page, bidangFilter, statusFilter, loadProkerDetail, notify]
  );

  const loadAllMeetings = useCallback(async () => {
    if (!canRead) return;
    setLoadingMeetings(true);
    try {
      const list = await apiRequest<MeetingItem[]>("/api/tracking/meetings");
      setAllMeetings(list || []);
    } catch (err: any) {
      notify(err?.message || "Gagal memuat daftar rapat", true);
    } finally {
      setLoadingMeetings(false);
    }
  }, [canRead, notify]);

  useEffect(() => {
    loadKaders();
  }, [loadKaders]);

  useEffect(() => {
    loadProkers();
  }, [loadProkers]);

  useEffect(() => {
    if (tab === "meetings") {
      loadAllMeetings();
    }
  }, [tab, loadAllMeetings]);

  const handleQuickStatusUpdate = async (prokerId: string, nextStatus: ProkerStatus) => {
    try {
      await apiRequest(`/api/tracking/prokers/${prokerId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      notify(`Status proker diperbarui menjadi ${PROKER_STATUS_META[nextStatus].label}.`);
      await loadProkers();
    } catch (err: any) {
      notify(err?.message || "Gagal memperbarui status proker", true);
    }
  };

  const handleAssignCommittee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !committeeKaderId) return;
    setAssigning(true);
    try {
      await apiRequest(`/api/tracking/prokers/${selectedId}/committees`, {
        method: "POST",
        body: JSON.stringify({
          kaderId: committeeKaderId,
          committeeRole: committeeRole.trim(),
          pointsAwarded: Number(committeePoints) || 20,
        }),
      });
      setCommitteeKaderId("");
      setCommitteeRole("");
      setCommitteePoints(20);
      notify("Panitia ditambahkan dan poin kader otomatis dikreditkan.");
      await loadProkerDetail(selectedId);
    } catch (err: any) {
      notify(err?.message || "Gagal menugaskan panitia", true);
    } finally {
      setAssigning(false);
    }
  };

  const assignedKaderIds = new Set(
    (detail?.committees || []).map((c) => c.kaderId)
  );
  const availableCommitteeKaders = kaderOptions.filter(
    (k) => !assignedKaderIds.has(k.id)
  );

  const plannedCount = prokers.filter((p) => p.status === "PLANNED").length;
  const activeCount = prokers.filter((p) => p.status === "ON_PROGRESS").length;
  const completedCount = prokers.filter((p) => p.status === "COMPLETED").length;

  return (
    <AppShell
      title="Program Kerja & Presensi Rapat"
      breadcrumb="Operasional ERP / Proker & Rapat"
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
            Akun Anda tidak memiliki izin <code>tracking:read</code> untuk mengakses modul Program Kerja dan Rapat.
          </div>
        ) : (
          <>
            {/* Top Summary & Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#D4E4DC] bg-white p-5 shadow-sm">
              <div>
                <h2 className="font-display text-lg font-extrabold text-[#06231D]">
                  Tracking Program Kerja, Kepanitiaan &amp; Rapat
                </h2>
                <p className="mt-0.5 text-xs text-[#64748B]">
                  Penugasan panitia dan presensi rapat otomatis mencatat poin ke <code>score_ledgers</code> kader.
                </p>
              </div>
              {canCreate ? (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMeetingDefaultProkerId(selectedId);
                      setMeetingModalOpen(true);
                    }}
                    className="inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-[8px] border border-[#076653] bg-white px-3.5 text-xs font-bold text-[#076653] transition hover:bg-[#076653] hover:text-white"
                  >
                    <CalendarDays className="h-4 w-4" />
                    Buat Rapat
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProker(null);
                      setProkerModalOpen(true);
                    }}
                    className="inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-[8px] bg-[#076653] px-4 font-display text-xs font-bold text-[#FFFDEE] transition hover:bg-[#06231D]"
                  >
                    <Plus className="h-4 w-4 text-[#E3EF26]" />
                    Tambah Proker
                  </button>
                </div>
              ) : null}
            </div>

            {/* KPI Strip */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-[#D4E4DC] bg-[#06231D] p-4 text-[#FFFDEE]">
                <p className="font-display text-[10px] font-bold uppercase tracking-[0.08em] text-[#E3EF26]">
                  TOTAL PROKER (FILTER)
                </p>
                <p className="mt-1 font-display text-2xl font-extrabold tabular-nums">
                  {meta.total}
                </p>
              </div>
              <div className="rounded-xl border border-[#D4E4DC] bg-white p-4">
                <p className="text-[11px] font-semibold text-[#64748B]">Terencana (Planned)</p>
                <p className="mt-1 font-display text-2xl font-extrabold tabular-nums text-[#334155]">
                  {plannedCount}
                </p>
              </div>
              <div className="rounded-xl border border-[#D4E4DC] bg-white p-4">
                <p className="text-[11px] font-semibold text-[#64748B]">Sedang Berjalan</p>
                <p className="mt-1 font-display text-2xl font-extrabold tabular-nums text-[#D97706]">
                  {activeCount}
                </p>
              </div>
              <div className="rounded-xl border border-[#D4E4DC] bg-white p-4">
                <p className="text-[11px] font-semibold text-[#64748B]">Selesai (Completed)</p>
                <p className="mt-1 font-display text-2xl font-extrabold tabular-nums text-[#076653]">
                  {completedCount}
                </p>
              </div>
            </div>

            {/* Sub-Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#D4E4DC] bg-white p-2.5 shadow-sm">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setTab("prokers")}
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                    tab === "prokers"
                      ? "bg-[#06231D] text-[#E3EF26]"
                      : "text-[#475569] hover:bg-[#F1F5F9]"
                  }`}
                >
                  <FolderKanban className="h-4 w-4" />
                  Program Kerja &amp; Kepanitiaan
                </button>
                <button
                  type="button"
                  onClick={() => setTab("meetings")}
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                    tab === "meetings"
                      ? "bg-[#06231D] text-[#E3EF26]"
                      : "text-[#475569] hover:bg-[#F1F5F9]"
                  }`}
                >
                  <ClipboardCheck className="h-4 w-4" />
                  Semua Rapat &amp; Presensi
                </button>
              </div>

              {tab === "prokers" ? (
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    aria-label="Filter Bidang"
                    value={bidangFilter}
                    onChange={(e) => {
                      setPage(1);
                      setBidangFilter(e.target.value as "" | ProkerBidang);
                    }}
                    className="min-h-[36px] rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-xs font-semibold text-[#06231D]"
                  >
                    <option value="">Semua Bidang</option>
                    {BIDANG_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.value}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="Filter Status"
                    value={statusFilter}
                    onChange={(e) => {
                      setPage(1);
                      setStatusFilter(e.target.value as "" | ProkerStatus);
                    }}
                    className="min-h-[36px] rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-xs font-semibold text-[#06231D]"
                  >
                    <option value="">Semua Status</option>
                    <option value="PLANNED">PLANNED</option>
                    <option value="ON_PROGRESS">ON_PROGRESS</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>
              ) : null}
            </div>

            {tab === "prokers" ? (
              <div className="grid gap-6 lg:grid-cols-12">
                {/* Proker Master List */}
                <div className="space-y-3 lg:col-span-5">
                  <div className="rounded-2xl border border-[#D4E4DC] bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-display text-sm font-extrabold text-[#06231D]">
                        Daftar Program Kerja
                      </h3>
                      <span className="text-xs text-[#64748B] tabular-nums">
                        {prokers.length} item
                      </span>
                    </div>

                    {loadingProkers ? (
                      <div className="flex justify-center py-10">
                        <div className="h-7 w-7 animate-spin rounded-full border-4 border-[#D4E4DC] border-t-[#076653]" />
                      </div>
                    ) : prokers.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-[#CBD5E1] p-6 text-center text-xs text-[#64748B]">
                        Belum ada program kerja untuk filter ini.
                        {canCreate ? " Klik Tambah Proker untuk membuat proker pertama." : ""}
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {prokers.map((p) => {
                          const active = p.id === selectedId;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setSelectedId(p.id);
                                loadProkerDetail(p.id);
                              }}
                              className={`w-full cursor-pointer rounded-xl border p-3.5 text-left transition ${
                                active
                                  ? "border-[#076653] bg-[#E2FBCE]/35 shadow-sm"
                                  : "border-[#E2E8F0] bg-white hover:border-[#076653]/50"
                              }`}
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span
                                  className={`rounded-full border px-2.5 py-0.5 font-display text-[10px] font-bold ${
                                    BIDANG_BADGE_MAP[p.bidang]
                                  }`}
                                >
                                  {p.bidang}
                                </span>
                                <span
                                  className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                                    PROKER_STATUS_META[p.status].className
                                  }`}
                                >
                                  {PROKER_STATUS_META[p.status].label}
                                </span>
                              </div>
                              <p className="mt-2 font-display text-sm font-bold text-[#06231D]">
                                {p.title}
                              </p>
                              <p className="mt-1 text-xs text-[#475569]">
                                PIC: <span className="font-semibold">{p.picName || "-"}</span>
                              </p>
                              <p className="mt-0.5 text-[11px] text-[#64748B] tabular-nums">
                                {formatDateId(p.startDate)} – {formatDateId(p.endDate)}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {meta.totalPages > 1 ? (
                      <div className="mt-4 flex items-center justify-between border-t border-[#E2E8F0] pt-3 text-xs">
                        <button
                          type="button"
                          disabled={page <= 1}
                          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                          className="cursor-pointer rounded border border-[#D4E4DC] px-3 py-1.5 font-semibold disabled:opacity-40"
                        >
                          Sebelumnya
                        </button>
                        <span className="tabular-nums text-[#64748B]">
                          Hal {meta.page} / {meta.totalPages}
                        </span>
                        <button
                          type="button"
                          disabled={page >= meta.totalPages}
                          onClick={() =>
                            setPage((prev) => Math.min(meta.totalPages, prev + 1))
                          }
                          className="cursor-pointer rounded border border-[#D4E4DC] px-3 py-1.5 font-semibold disabled:opacity-40"
                        >
                          Berikutnya
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Proker Detail Workspace */}
                <div className="space-y-5 lg:col-span-7">
                  {loadingDetail ? (
                    <div className="flex items-center justify-center rounded-2xl border border-[#D4E4DC] bg-white py-20">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#D4E4DC] border-t-[#076653]" />
                    </div>
                  ) : !detail ? (
                    <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white p-10 text-center text-sm text-[#64748B]">
                      Pilih salah satu program kerja di sebelah kiri untuk mengelola kepanitiaan dan rapat proker.
                    </div>
                  ) : (
                    <>
                      {/* Proker Header Card */}
                      <div className="rounded-2xl border border-[#D4E4DC] bg-white p-5 shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-full border px-2.5 py-0.5 font-display text-[10px] font-bold ${
                                  BIDANG_BADGE_MAP[detail.bidang]
                                }`}
                              >
                                {detail.bidang}
                              </span>
                              <span
                                className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                                  PROKER_STATUS_META[detail.status].className
                                }`}
                              >
                                {PROKER_STATUS_META[detail.status].label}
                              </span>
                            </div>
                            <h3 className="mt-2 font-display text-lg font-extrabold text-[#06231D]">
                              {detail.title}
                            </h3>
                            <p className="mt-1 text-xs text-[#475569]">
                              PIC: <strong>{detail.picName || "-"}</strong>
                              {detail.picNim ? ` (${detail.picNim})` : ""} • Jadwal:{" "}
                              <span className="tabular-nums">
                                {formatDateId(detail.startDate)} – {formatDateId(detail.endDate)}
                              </span>
                            </p>
                          </div>

                          {canUpdate ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <select
                                aria-label="Ubah status proker cepat"
                                value={detail.status}
                                onChange={(e) =>
                                  handleQuickStatusUpdate(
                                    detail.id,
                                    e.target.value as ProkerStatus
                                  )
                                }
                                className="min-h-[36px] rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-2.5 text-xs font-semibold text-[#06231D]"
                              >
                                <option value="PLANNED">PLANNED</option>
                                <option value="ON_PROGRESS">ON_PROGRESS</option>
                                <option value="COMPLETED">COMPLETED</option>
                              </select>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingProker(detail);
                                  setProkerModalOpen(true);
                                }}
                                className="inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-[8px] border border-[#D4E4DC] px-3 text-xs font-semibold text-[#06231D] hover:bg-[#F8FAFC]"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                                Edit
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </div>

                      {/* Committees Panel */}
                      <div className="rounded-2xl border border-[#D4E4DC] bg-white p-5 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-[#076653]" />
                            <h4 className="font-display text-sm font-extrabold text-[#06231D]">
                              Kepanitiaan Proker ({detail.committees.length})
                            </h4>
                          </div>
                          <span className="text-[11px] font-semibold text-[#076653]">
                            Otomatis kredit poin kader
                          </span>
                        </div>

                        {canCreate ? (
                          <form
                            onSubmit={handleAssignCommittee}
                            className="mb-4 grid gap-2.5 rounded-xl border border-[#D4E4DC] bg-[#FFFDEE] p-3.5 sm:grid-cols-12"
                          >
                            <div className="sm:col-span-5">
                              <label className="mb-1 block text-[11px] font-semibold text-[#06231D]">
                                Pilih Kader
                              </label>
                              <select
                                required
                                value={committeeKaderId}
                                onChange={(e) => setCommitteeKaderId(e.target.value)}
                                className="min-h-[38px] w-full rounded-[8px] border border-[#D4E4DC] bg-white px-2.5 text-xs text-[#06231D]"
                              >
                                <option value="">
                                  {availableCommitteeKaders.length
                                    ? "Pilih kader panitia..."
                                    : "Semua kader aktif sudah terdaftar"}
                                </option>
                                {availableCommitteeKaders.map((k) => (
                                  <option key={k.id} value={k.id}>
                                    {k.fullName} ({k.nim})
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="sm:col-span-4">
                              <label className="mb-1 block text-[11px] font-semibold text-[#06231D]">
                                Jabatan Kepanitiaan
                              </label>
                              <input
                                type="text"
                                required
                                minLength={2}
                                maxLength={60}
                                value={committeeRole}
                                onChange={(e) => setCommitteeRole(e.target.value)}
                                placeholder="Ketua Pelaksana / Acara"
                                className="min-h-[38px] w-full rounded-[8px] border border-[#D4E4DC] bg-white px-2.5 text-xs text-[#06231D]"
                              />
                            </div>
                            <div className="sm:col-span-3 flex items-end gap-2">
                              <div className="w-20">
                                <label className="mb-1 block text-[11px] font-semibold text-[#06231D]">
                                  Poin
                                </label>
                                <input
                                  type="number"
                                  min={1}
                                  max={500}
                                  required
                                  value={committeePoints}
                                  onChange={(e) =>
                                    setCommitteePoints(Number(e.target.value))
                                  }
                                  className="min-h-[38px] w-full rounded-[8px] border border-[#D4E4DC] bg-white px-2.5 text-xs tabular-nums text-[#06231D]"
                                />
                              </div>
                              <button
                                type="submit"
                                disabled={assigning || !committeeKaderId}
                                className="min-h-[38px] flex-1 cursor-pointer rounded-[8px] bg-[#076653] px-3 font-display text-xs font-bold text-[#FFFDEE] hover:bg-[#06231D] disabled:opacity-50"
                              >
                                {assigning ? "..." : "Tugaskan"}
                              </button>
                            </div>
                          </form>
                        ) : null}

                        {detail.committees.length === 0 ? (
                          <p className="rounded-xl border border-dashed border-[#CBD5E1] py-6 text-center text-xs text-[#64748B]">
                            Belum ada panitia yang ditugaskan untuk proker ini.
                          </p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="border-b border-[#E2E8F0] text-[11px] uppercase tracking-wider text-[#64748B]">
                                  <th className="py-2 pr-3">Kader</th>
                                  <th className="py-2 pr-3">Jabatan</th>
                                  <th className="py-2 text-right">Poin</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#F1F5F9]">
                                {detail.committees.map((c) => (
                                  <tr key={c.id}>
                                    <td className="py-2.5 pr-3">
                                      <p className="font-semibold text-[#06231D]">
                                        {c.kaderName || "-"}
                                      </p>
                                      <p className="text-[11px] text-[#64748B] tabular-nums">
                                        {c.nim || "-"}
                                        {c.prodi ? ` • ${c.prodi}` : ""}
                                      </p>
                                    </td>
                                    <td className="py-2.5 pr-3 font-medium text-[#334155]">
                                      {c.committeeRole}
                                    </td>
                                    <td className="py-2.5 text-right">
                                      <span className="inline-flex rounded-full bg-[#E2FBCE] px-2.5 py-0.5 font-display text-[11px] font-bold tabular-nums text-[#076653]">
                                        +{c.pointsAwarded}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      {/* Linked Meetings Panel */}
                      <div className="rounded-2xl border border-[#D4E4DC] bg-white p-5 shadow-sm">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-[#076653]" />
                            <h4 className="font-display text-sm font-extrabold text-[#06231D]">
                              Rapat Terkait Proker ({detail.meetings.length})
                            </h4>
                          </div>
                          {canCreate ? (
                            <button
                              type="button"
                              onClick={() => {
                                setMeetingDefaultProkerId(detail.id);
                                setMeetingModalOpen(true);
                              }}
                              className="inline-flex min-h-[34px] cursor-pointer items-center gap-1 rounded-[8px] border border-[#076653] px-3 text-xs font-bold text-[#076653] hover:bg-[#076653] hover:text-white"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Buat Rapat Proker
                            </button>
                          ) : null}
                        </div>

                        {detail.meetings.length === 0 ? (
                          <p className="rounded-xl border border-dashed border-[#CBD5E1] py-6 text-center text-xs text-[#64748B]">
                            Belum ada rapat untuk proker ini.
                          </p>
                        ) : (
                          <div className="space-y-2.5">
                            {detail.meetings.map((m) => (
                              <div
                                key={m.id}
                                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E2E8F0] p-3.5"
                              >
                                <div>
                                  <p className="text-sm font-bold text-[#06231D]">
                                    {m.title}
                                  </p>
                                  <p className="mt-0.5 text-xs text-[#64748B]">
                                    {formatDateTimeId(m.meetingDate)} •{" "}
                                    <span className="font-semibold text-[#076653]">
                                      +{m.pointsPerAttendance} pts/hadir
                                    </span>{" "}
                                    • Presensi:{" "}
                                    <span className="tabular-nums font-semibold">
                                      {m.hadirCount ?? 0}/{m.attendanceCount ?? 0} hadir
                                    </span>
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setAttendanceMeetingId(m.id)}
                                  className="inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-[8px] bg-[#06231D] px-3.5 text-xs font-bold text-[#E3EF26] hover:bg-[#076653] hover:text-white"
                                >
                                  <ClipboardCheck className="h-3.5 w-3.5" />
                                  Kelola Presensi
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              /* Tab 2: Semua Rapat & Presensi */
              <div className="rounded-2xl border border-[#D4E4DC] bg-white p-5 shadow-sm">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-display text-base font-extrabold text-[#06231D]">
                      Daftar Seluruh Sesi Rapat
                    </h3>
                    <p className="text-xs text-[#64748B]">
                      Mencakup rapat proker dan rapat internal umum tanpa proker.
                    </p>
                  </div>
                  {canCreate ? (
                    <button
                      type="button"
                      onClick={() => {
                        setMeetingDefaultProkerId(null);
                        setMeetingModalOpen(true);
                      }}
                      className="inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-[8px] bg-[#076653] px-4 font-display text-xs font-bold text-[#FFFDEE] hover:bg-[#06231D]"
                    >
                      <Plus className="h-4 w-4 text-[#E3EF26]" />
                      Buat Rapat Baru
                    </button>
                  ) : null}
                </div>

                {loadingMeetings ? (
                  <div className="flex justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#D4E4DC] border-t-[#076653]" />
                  </div>
                ) : allMeetings.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#CBD5E1] py-10 text-center text-xs text-[#64748B]">
                    Belum ada sesi rapat yang tercatat.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#E2E8F0] text-[11px] uppercase tracking-wider text-[#64748B]">
                          <th className="py-2.5 pr-4">Judul Rapat</th>
                          <th className="py-2.5 pr-4">Program Kerja</th>
                          <th className="py-2.5 pr-4">Waktu</th>
                          <th className="py-2.5 pr-4">Bobot</th>
                          <th className="py-2.5 pr-4">Tercatat</th>
                          <th className="py-2.5 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F1F5F9]">
                        {allMeetings.map((m) => (
                          <tr key={m.id}>
                            <td className="py-3 pr-4 font-bold text-[#06231D]">
                              {m.title}
                            </td>
                            <td className="py-3 pr-4 text-[#475569]">
                              {m.prokerTitle ? (
                                <span>
                                  {m.prokerBidang ? `[${m.prokerBidang}] ` : ""}
                                  {m.prokerTitle}
                                </span>
                              ) : (
                                <span className="italic text-[#94A3B8]">
                                  Rapat Internal Umum
                                </span>
                              )}
                            </td>
                            <td className="py-3 pr-4 tabular-nums text-[#475569]">
                              {formatDateTimeId(m.meetingDate)}
                            </td>
                            <td className="py-3 pr-4">
                              <span className="rounded-full bg-[#E2FBCE] px-2.5 py-0.5 font-display text-[10px] font-bold tabular-nums text-[#076653]">
                                +{m.pointsPerAttendance} pts
                              </span>
                            </td>
                            <td className="py-3 pr-4 tabular-nums text-[#334155]">
                              {m.hadirCount ?? 0} hadir / {m.attendanceCount ?? 0} log
                            </td>
                            <td className="py-3 text-right">
                              <button
                                type="button"
                                onClick={() => setAttendanceMeetingId(m.id)}
                                className="inline-flex min-h-[34px] cursor-pointer items-center gap-1.5 rounded-[8px] bg-[#06231D] px-3 text-xs font-bold text-[#E3EF26] hover:bg-[#076653] hover:text-white"
                              >
                                <ClipboardCheck className="h-3.5 w-3.5" />
                                Presensi
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit Proker Modal */}
      <ProkerFormModal
        open={prokerModalOpen}
        initial={editingProker}
        kaderOptions={kaderOptions}
        onClose={() => setProkerModalOpen(false)}
        onSaved={async (saved, isEdit) => {
          setProkerModalOpen(false);
          setSelectedId(saved.id);
          notify(
            isEdit
              ? "Program kerja berhasil diperbarui."
              : "Program kerja baru berhasil dibuat."
          );
          await loadProkers(saved.id);
        }}
      />

      {/* Create Meeting Modal */}
      <MeetingFormModal
        open={meetingModalOpen}
        defaultProkerId={meetingDefaultProkerId}
        prokerOptions={prokers}
        onClose={() => setMeetingModalOpen(false)}
        onCreated={async () => {
          setMeetingModalOpen(false);
          notify("Sesi rapat berhasil dibuat.");
          if (selectedId) await loadProkerDetail(selectedId);
          if (tab === "meetings") await loadAllMeetings();
        }}
      />

      {/* Attendance Modal */}
      <AttendanceModal
        meetingId={attendanceMeetingId}
        canCreate={canCreate}
        kaderOptions={kaderOptions}
        onClose={() => setAttendanceMeetingId(null)}
        onSaved={async (msg) => {
          setAttendanceMeetingId(null);
          notify(msg);
          if (selectedId) await loadProkerDetail(selectedId);
          if (tab === "meetings") await loadAllMeetings();
        }}
      />
    </AppShell>
  );
}
