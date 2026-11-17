"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  Eye,
  FileSpreadsheet,
  KeyRound,
  Plus,
  Search,
  Upload,
  UserX,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  ImportKaderModal,
  KaderDetailModal,
  KaderFormModal,
  ResetPasswordModal,
} from "@/components/erp/KaderModals";
import {
  apiDownloadBlob,
  apiRequest,
  apiRequestWithMeta,
  type ApiMeta,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { triggerBlobDownload } from "@/lib/finance";
import {
  INTEREST_BADGE_MAP,
  INTEREST_CATEGORIES,
  KADER_STATUSES,
  KADER_STATUS_META,
  type KaderInterestCategory,
  type KaderRecord,
  type KaderStatus,
  type RoleOption,
} from "@/lib/kader";

export default function MasterKaderPage() {
  const { can } = useAuth();
  const canRead = can("kaders", "read");
  const canCreate = can("kaders", "create");
  const canUpdate = can("kaders", "update");
  const canDelete = can("kaders", "delete");

  const [search, setSearch] = useState("");
  const [prodiFilter, setProdiFilter] = useState("");
  const [fakultasFilter, setFakultasFilter] = useState("");
  const [interestFilter, setInterestFilter] = useState<"" | KaderInterestCategory>(
    ""
  );
  const [statusFilter, setStatusFilter] = useState<"" | KaderStatus>("");
  const [roleFilter, setRoleFilter] = useState("");
  const [sortBy, setSortBy] = useState<"createdAt" | "fullName" | "nim" | "totalScore">(
    "createdAt"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const [kaders, setKaders] = useState<KaderRecord[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [meta, setMeta] = useState<ApiMeta>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<"xlsx" | "csv" | null>(null);
  const [toast, setToast] = useState<{ message: string; isError: boolean } | null>(
    null
  );

  // Modals
  const [formOpen, setFormOpen] = useState(false);
  const [editingKader, setEditingKader] = useState<KaderRecord | null>(null);
  const [detailKader, setDetailKader] = useState<KaderRecord | null>(null);
  const [resetTarget, setResetTarget] = useState<KaderRecord | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const notify = useCallback((message: string, isError = false) => {
    setToast({ message, isError });
    window.setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  }, []);

  const buildFilterQuery = useCallback(() => {
    const qs = new URLSearchParams();
    if (search.trim()) qs.set("search", search.trim());
    if (prodiFilter.trim()) qs.set("prodi", prodiFilter.trim());
    if (fakultasFilter.trim()) qs.set("fakultas", fakultasFilter.trim());
    if (interestFilter) qs.set("interest", interestFilter);
    if (statusFilter) qs.set("status", statusFilter);
    if (roleFilter) qs.set("roleId", roleFilter);
    qs.set("sortBy", sortBy);
    qs.set("sortOrder", sortOrder);
    return qs;
  }, [
    search,
    prodiFilter,
    fakultasFilter,
    interestFilter,
    statusFilter,
    roleFilter,
    sortBy,
    sortOrder,
  ]);

  const loadRoles = useCallback(async () => {
    if (!canRead) return;
    try {
      const list = await apiRequest<RoleOption[]>("/api/kaders/roles");
      setRoles(list || []);
    } catch {
      // Non-fatal; role dropdown stays empty if failed.
    }
  }, [canRead]);

  const loadKaders = useCallback(async () => {
    if (!canRead) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const qs = buildFilterQuery();
      qs.set("page", String(page));
      qs.set("limit", "20");

      const res = await apiRequestWithMeta<KaderRecord[]>(
        `/api/kaders?${qs.toString()}`
      );
      setKaders(res.data || []);
      setMeta(res.meta);
    } catch (err: any) {
      notify(err?.message || "Gagal memuat data master kader", true);
    } finally {
      setLoading(false);
    }
  }, [canRead, buildFilterQuery, page, notify]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  useEffect(() => {
    loadKaders();
  }, [loadKaders]);

  const handleExport = async (format: "xlsx" | "csv") => {
    setExporting(format);
    try {
      const qs = buildFilterQuery();
      qs.set("format", format);
      const { blob, filename } = await apiDownloadBlob(
        `/api/kaders/export?${qs.toString()}`
      );
      triggerBlobDownload(
        blob,
        filename || `data-kader-hipmi.${format}`
      );
      notify(`Data kader (${format.toUpperCase()}) berhasil diunduh.`);
    } catch (err: any) {
      notify(err?.message || "Gagal mengekspor data kader", true);
    } finally {
      setExporting(null);
    }
  };

  const handleDeactivate = async (k: KaderRecord) => {
    const confirmed = window.confirm(
      `Nonaktifkan kader ${k.fullName} (NIM ${k.nim})? Status kader akan diubah menjadi Non-Aktif.`
    );
    if (!confirmed) return;

    try {
      await apiRequest(`/api/kaders/${k.id}`, { method: "DELETE" });
      notify(`Kader ${k.fullName} berhasil dinonaktifkan.`);
      await loadKaders();
    } catch (err: any) {
      notify(err?.message || "Gagal menonaktifkan kader", true);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setProdiFilter("");
    setFakultasFilter("");
    setInterestFilter("");
    setStatusFilter("");
    setRoleFilter("");
    setSortBy("createdAt");
    setSortOrder("desc");
    setPage(1);
  };

  const activeOnPage = kaders.filter((k) => k.status === "Aktif").length;
  const businessOnPage = kaders.filter(
    (k) => k.interestCategory === "Punya Bisnis"
  ).length;
  const competitionOnPage = kaders.filter((k) =>
    k.interestCategory.includes("Kompetisi")
  ).length;

  return (
    <AppShell
      title="Database Master Kader"
      breadcrumb="Operasional ERP / Master Kader"
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
            Akun Anda tidak memiliki izin <code>kaders:read</code> untuk membuka Database Master Kader.
          </div>
        ) : (
          <>
            {/* Top Banner & Import/Export/Add Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#D4E4DC] bg-white p-5 shadow-sm">
              <div>
                <h2 className="font-display text-lg font-extrabold text-[#06231D]">
                  Direktori Induk Kader &amp; Pengurus HIPMI PT Telkom
                </h2>
                <p className="mt-0.5 text-xs text-[#64748B]">
                  Kelola biodata kader, NIM, prodi/fakultas, kategori minat bisnis, role jabatan, reset password, serta Import/Export Excel &amp; CSV.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={exporting !== null}
                  onClick={() => handleExport("xlsx")}
                  className="inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-[8px] border border-[#D4E4DC] bg-white px-3 text-xs font-bold text-[#06231D] hover:border-[#076653] disabled:opacity-50"
                >
                  <FileSpreadsheet className="h-4 w-4 text-[#076653]" />
                  {exporting === "xlsx" ? "..." : "Export Excel"}
                </button>
                <button
                  type="button"
                  disabled={exporting !== null}
                  onClick={() => handleExport("csv")}
                  className="inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-[8px] border border-[#D4E4DC] bg-white px-3 text-xs font-bold text-[#06231D] hover:border-[#076653] disabled:opacity-50"
                >
                  <FileSpreadsheet className="h-4 w-4 text-[#0284C7]" />
                  {exporting === "csv" ? "..." : "Export CSV"}
                </button>
                {canCreate ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setImportOpen(true)}
                      className="inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-[8px] border border-[#076653] bg-white px-3.5 text-xs font-bold text-[#076653] hover:bg-[#076653] hover:text-white"
                    >
                      <Upload className="h-4 w-4" />
                      Import Excel/CSV
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingKader(null);
                        setFormOpen(true);
                      }}
                      className="inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-[8px] bg-[#076653] px-4 font-display text-xs font-bold text-[#FFFDEE] hover:bg-[#06231D]"
                    >
                      <Plus className="h-4 w-4 text-[#E3EF26]" />
                      Tambah Kader
                    </button>
                  </>
                ) : null}
              </div>
            </div>

            {/* KPI Strip */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-[#124236] bg-[#06231D] p-4 text-[#FFFDEE]">
                <p className="font-display text-[10px] font-bold uppercase tracking-[0.08em] text-[#E3EF26]">
                  TOTAL KADER (FILTER)
                </p>
                <p className="mt-1 font-display text-2xl font-extrabold tabular-nums">
                  {meta.total}
                </p>
              </div>
              <div className="rounded-xl border border-[#D4E4DC] bg-white p-4">
                <p className="text-[11px] font-semibold text-[#64748B]">
                  Berstatus Aktif (Halaman Ini)
                </p>
                <p className="mt-1 font-display text-2xl font-extrabold tabular-nums text-[#076653]">
                  {activeOnPage}
                </p>
              </div>
              <div className="rounded-xl border border-[#D4E4DC] bg-white p-4">
                <p className="text-[11px] font-semibold text-[#64748B]">
                  Sudah Punya Bisnis
                </p>
                <p className="mt-1 font-display text-2xl font-extrabold tabular-nums text-[#06231D]">
                  {businessOnPage}
                </p>
              </div>
              <div className="rounded-xl border border-[#D4E4DC] bg-white p-4">
                <p className="text-[11px] font-semibold text-[#64748B]">
                  Minat / Aktif Kompetisi
                </p>
                <p className="mt-1 font-display text-2xl font-extrabold tabular-nums text-[#0284C7]">
                  {competitionOnPage}
                </p>
              </div>
            </div>

            {/* Multi-Filter & Search Toolbar */}
            <div className="rounded-2xl border border-[#D4E4DC] bg-white p-5 shadow-sm">
              <div className="mb-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-6">
                <div className="relative lg:col-span-2">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setPage(1);
                      setSearch(e.target.value);
                    }}
                    placeholder="Cari nama, NIM, IG, bisnis..."
                    className="min-h-[38px] w-full rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] pl-9 pr-3 text-xs text-[#06231D]"
                  />
                </div>

                <select
                  aria-label="Filter Role"
                  value={roleFilter}
                  onChange={(e) => {
                    setPage(1);
                    setRoleFilter(e.target.value);
                  }}
                  className="min-h-[38px] rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-2.5 text-xs font-semibold text-[#06231D]"
                >
                  <option value="">Semua Role</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Filter Kategori Minat"
                  value={interestFilter}
                  onChange={(e) => {
                    setPage(1);
                    setInterestFilter(e.target.value as "" | KaderInterestCategory);
                  }}
                  className="min-h-[38px] rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-2.5 text-xs font-semibold text-[#06231D]"
                >
                  <option value="">Semua Minat</option>
                  {INTEREST_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Filter Status Kader"
                  value={statusFilter}
                  onChange={(e) => {
                    setPage(1);
                    setStatusFilter(e.target.value as "" | KaderStatus);
                  }}
                  className="min-h-[38px] rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-2.5 text-xs font-semibold text-[#06231D]"
                >
                  <option value="">Semua Status</option>
                  {KADER_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>

                <div className="flex gap-1.5">
                  <select
                    aria-label="Urutkan Berdasarkan"
                    value={`${sortBy}:${sortOrder}`}
                    onChange={(e) => {
                      const [by, ord] = e.target.value.split(":") as [
                        "createdAt" | "fullName" | "nim" | "totalScore",
                        "asc" | "desc",
                      ];
                      setSortBy(by);
                      setSortOrder(ord);
                    }}
                    className="min-h-[38px] flex-1 rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-2.5 text-xs font-semibold text-[#06231D]"
                  >
                    <option value="createdAt:desc">Terbaru</option>
                    <option value="fullName:asc">Nama (A–Z)</option>
                    <option value="nim:asc">NIM (Urut)</option>
                    <option value="totalScore:desc">Skor Tertinggi</option>
                  </select>
                </div>
              </div>

              <div className="mb-4 flex flex-wrap items-center gap-2.5">
                <input
                  type="text"
                  value={prodiFilter}
                  onChange={(e) => {
                    setPage(1);
                    setProdiFilter(e.target.value);
                  }}
                  placeholder="Filter Prodi (mis. Sistem Informasi)..."
                  className="min-h-[36px] min-w-[200px] flex-1 rounded-[8px] border border-[#D4E4DC] bg-white px-3 text-xs text-[#06231D]"
                />
                <input
                  type="text"
                  value={fakultasFilter}
                  onChange={(e) => {
                    setPage(1);
                    setFakultasFilter(e.target.value);
                  }}
                  placeholder="Filter Fakultas (mis. Rekayasa Industri)..."
                  className="min-h-[36px] min-w-[200px] flex-1 rounded-[8px] border border-[#D4E4DC] bg-white px-3 text-xs text-[#06231D]"
                />
                {(search ||
                  prodiFilter ||
                  fakultasFilter ||
                  interestFilter ||
                  statusFilter ||
                  roleFilter) ? (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="min-h-[36px] cursor-pointer rounded-[8px] border border-[#CBD5E1] px-3 text-xs font-semibold text-[#475569] hover:bg-[#F8FAFC]"
                  >
                    Reset Filter
                  </button>
                ) : null}
              </div>

              {/* Kader Table */}
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#D4E4DC] border-t-[#076653]" />
                </div>
              ) : kaders.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#CBD5E1] py-10 text-center text-xs text-[#64748B]">
                  Tidak ada data kader yang sesuai filter.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#E2E8F0] text-[11px] uppercase tracking-wider text-[#64748B]">
                        <th className="py-2.5 pr-4">Kader &amp; Kontak</th>
                        <th className="py-2.5 pr-4">Prodi &amp; Fakultas</th>
                        <th className="py-2.5 pr-4">Role</th>
                        <th className="py-2.5 pr-4">Minat &amp; Bisnis</th>
                        <th className="py-2.5 pr-4">Status</th>
                        <th className="py-2.5 pr-4 text-right">Skor</th>
                        <th className="py-2.5 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      {kaders.map((k) => {
                        const stMeta = KADER_STATUS_META[k.status];
                        const interestClass = INTEREST_BADGE_MAP[k.interestCategory];
                        return (
                          <tr key={k.id}>
                            <td className="py-3 pr-4 align-top">
                              <p className="font-bold text-[#06231D]">
                                {k.fullName}
                              </p>
                              <p className="mt-0.5 tabular-nums text-[11px] text-[#475569]">
                                NIM {k.nim} • WA {k.whatsappNumber}
                              </p>
                              {k.instagram ? (
                                <p className="text-[11px] text-[#076653]">
                                  IG: {k.instagram}
                                </p>
                              ) : null}
                            </td>
                            <td className="py-3 pr-4 align-top">
                              <p className="font-semibold text-[#06231D]">
                                {k.prodi}
                              </p>
                              <p className="text-[11px] text-[#64748B]">
                                {k.fakultas}
                              </p>
                            </td>
                            <td className="py-3 pr-4 align-top">
                              <span className="inline-flex rounded-full border border-[#D4E4DC] bg-[#FFFDEE] px-2.5 py-0.5 text-[11px] font-semibold text-[#06231D]">
                                {k.roleName}
                              </span>
                            </td>
                            <td className="py-3 pr-4 align-top">
                              <span
                                className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${interestClass}`}
                              >
                                {k.interestCategory}
                              </span>
                              {k.businessName ? (
                                <p className="mt-1 text-[11px] font-medium text-[#334155]">
                                  Bisnis: {k.businessName}
                                </p>
                              ) : null}
                            </td>
                            <td className="py-3 pr-4 align-top">
                              <span
                                className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${stMeta.className}`}
                              >
                                {stMeta.label}
                              </span>
                            </td>
                            <td className="py-3 pr-4 text-right align-top font-display text-sm font-extrabold tabular-nums text-[#076653]">
                              {k.totalScore}
                            </td>
                            <td className="py-3 text-right align-top">
                              <div className="inline-flex flex-wrap justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => setDetailKader(k)}
                                  title="Detail Profil"
                                  className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-[6px] border border-[#D4E4DC] bg-white text-[#06231D] hover:border-[#076653]"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </button>
                                {canUpdate ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingKader(k);
                                        setFormOpen(true);
                                      }}
                                      title="Edit Kader"
                                      className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-[6px] border border-[#D4E4DC] bg-white text-[#076653] hover:bg-[#E2FBCE]/50"
                                    >
                                      <Edit3 className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setResetTarget(k)}
                                      title="Reset Password Kader"
                                      className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-[6px] border border-[#D4E4DC] bg-white text-[#92400E] hover:bg-[#FEF3C7]/60"
                                    >
                                      <KeyRound className="h-3.5 w-3.5" />
                                    </button>
                                  </>
                                ) : null}
                                {canDelete && k.status !== "Non-Aktif" ? (
                                  <button
                                    type="button"
                                    onClick={() => handleDeactivate(k)}
                                    title="Nonaktifkan Kader"
                                    className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-[6px] border border-red-200 bg-red-50 text-red-700 hover:bg-red-600 hover:text-white"
                                  >
                                    <UserX className="h-3.5 w-3.5" />
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

      <KaderFormModal
        open={formOpen}
        initial={editingKader}
        roles={roles}
        onClose={() => setFormOpen(false)}
        onSaved={async (isEdit) => {
          setFormOpen(false);
          notify(
            isEdit
              ? "Data kader berhasil diperbarui."
              : "Kader baru berhasil ditambahkan."
          );
          await loadKaders();
        }}
      />

      <ResetPasswordModal
        kader={resetTarget}
        onClose={() => setResetTarget(null)}
        onResetDone={(msg) => {
          setResetTarget(null);
          notify(msg);
        }}
      />

      <ImportKaderModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={async () => {
          await loadKaders();
        }}
      />

      <KaderDetailModal
        kader={detailKader}
        onClose={() => setDetailKader(null)}
      />
    </AppShell>
  );
}
