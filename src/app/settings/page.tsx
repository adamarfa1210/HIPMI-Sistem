"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  CheckSquare,
  Lock,
  RotateCcw,
  Save,
  ShieldCheck,
  Square,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface RbacRole {
  id: string;
  name: string;
  isSystemDefault: boolean;
}

interface RbacModule {
  id: string;
  code: string;
  label: string;
}

interface RbacMatrixEntry {
  id: string;
  roleId: string;
  moduleId: string;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canApprove: boolean;
  roleName: string;
  moduleCode: string;
  moduleLabel: string;
}

interface RbacMatrixResponse {
  roles: RbacRole[];
  modules: RbacModule[];
  matrix: RbacMatrixEntry[];
}

type PermissionFlagKey =
  | "canRead"
  | "canCreate"
  | "canUpdate"
  | "canDelete"
  | "canApprove";

interface DraftPermissionRow {
  moduleId: string;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canApprove: boolean;
}

const PERMISSION_COLUMNS: Array<{
  key: PermissionFlagKey;
  label: string;
  shortDesc: string;
}> = [
  { key: "canRead", label: "Read", shortDesc: "Lihat & Buka Modul" },
  { key: "canCreate", label: "Create", shortDesc: "Tambah Data" },
  { key: "canUpdate", label: "Update", shortDesc: "Ubah Data" },
  { key: "canDelete", label: "Delete", shortDesc: "Hapus / Nonaktif" },
  { key: "canApprove", label: "Approve", shortDesc: "Otorisasi / ACC" },
];

const ROLE_ORDER = ["Admin", "Topman", "Kabid", "Kadiv", "Staff", "Kader 1"];

const MODULE_ORDER = [
  "dashboard",
  "kaders",
  "finance-request",
  "finance",
  "tracking",
  "leaderboard",
  "calendar",
  "rbpl",
  "qr-scanner",
  "documents",
  "cms",
  "news",
  "news-manage",
  "profile",
  "password-reset",
  "admin-rbac",
];

function buildRoleDraftMap(
  roles: RbacRole[],
  modules: RbacModule[],
  matrix: RbacMatrixEntry[]
): Record<string, Record<string, DraftPermissionRow>> {
  const byRoleAndMod = new Map<string, RbacMatrixEntry>();
  for (const m of matrix) {
    byRoleAndMod.set(`${m.roleId}:${m.moduleId}`, m);
  }

  const out: Record<string, Record<string, DraftPermissionRow>> = {};
  for (const r of roles) {
    out[r.id] = {};
    for (const mod of modules) {
      const entry = byRoleAndMod.get(`${r.id}:${mod.id}`);
      out[r.id][mod.id] = {
        moduleId: mod.id,
        canRead: entry?.canRead ?? false,
        canCreate: entry?.canCreate ?? false,
        canUpdate: entry?.canUpdate ?? false,
        canDelete: entry?.canDelete ?? false,
        canApprove: entry?.canApprove ?? false,
      };
    }
  }
  return out;
}

export default function SettingsRbacPage() {
  const { can, refreshMe } = useAuth();
  const canRead = can("admin-rbac", "read");
  const canUpdate = can("admin-rbac", "update");

  const [roles, setRoles] = useState<RbacRole[]>([]);
  const [modules, setModules] = useState<RbacModule[]>([]);
  const [savedByRole, setSavedByRole] = useState<
    Record<string, Record<string, DraftPermissionRow>>
  >({});
  const [draftsByRole, setDraftsByRole] = useState<
    Record<string, Record<string, DraftPermissionRow>>
  >({});
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; isError: boolean } | null>(
    null
  );

  const notify = useCallback((message: string, isError = false) => {
    setToast({ message, isError });
    window.setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  }, []);

  const loadMatrix = useCallback(async () => {
    if (!canRead) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await apiRequest<RbacMatrixResponse>("/api/admin/rbac/matrix");
      const sortedRoles = [...(res.roles || [])].sort((a, b) => {
        const ia = ROLE_ORDER.indexOf(a.name);
        const ib = ROLE_ORDER.indexOf(b.name);
        if (ia !== -1 && ib !== -1) return ia - ib;
        if (ia !== -1) return -1;
        if (ib !== -1) return 1;
        return a.name.localeCompare(b.name);
      });

      const sortedModules = [...(res.modules || [])].sort((a, b) => {
        const ia = MODULE_ORDER.indexOf(a.code);
        const ib = MODULE_ORDER.indexOf(b.code);
        if (ia !== -1 && ib !== -1) return ia - ib;
        if (ia !== -1) return -1;
        if (ib !== -1) return 1;
        return a.label.localeCompare(b.label);
      });

      const map = buildRoleDraftMap(sortedRoles, sortedModules, res.matrix || []);
      setRoles(sortedRoles);
      setModules(sortedModules);
      setSavedByRole(map);
      setDraftsByRole(structuredClone(map));
      setSelectedRoleId((prev) =>
        sortedRoles.some((r) => r.id === prev)
          ? prev
          : sortedRoles[1]?.id || sortedRoles[0]?.id || ""
      );
    } catch (err: any) {
      notify(err?.message || "Gagal memuat matriks hak akses RBAC", true);
    } finally {
      setLoading(false);
    }
  }, [canRead, notify]);

  useEffect(() => {
    loadMatrix();
  }, [loadMatrix]);

  const activeRole = useMemo(
    () => roles.find((r) => r.id === selectedRoleId) ?? null,
    [roles, selectedRoleId]
  );

  const isRoleDirty = useCallback(
    (roleId: string) => {
      const draft = draftsByRole[roleId];
      const saved = savedByRole[roleId];
      if (!draft || !saved) return false;
      return modules.some((m) => {
        const d = draft[m.id];
        const s = saved[m.id];
        if (!d || !s) return false;
        return PERMISSION_COLUMNS.some((col) => d[col.key] !== s[col.key]);
      });
    },
    [draftsByRole, savedByRole, modules]
  );

  const countActiveModulesForRole = (roleId: string) => {
    const draft = draftsByRole[roleId];
    if (!draft) return 0;
    return modules.filter((m) => draft[m.id]?.canRead).length;
  };

  const isLockedAdminSelfPerm = (roleName: string, moduleCode: string, key: PermissionFlagKey) =>
    roleName === "Admin" &&
    (moduleCode === "admin-rbac" || moduleCode === "settings") &&
    key === "canRead";

  const toggleFlag = (moduleId: string, moduleCode: string, key: PermissionFlagKey) => {
    if (!canUpdate || !activeRole) return;
    if (isLockedAdminSelfPerm(activeRole.name, moduleCode, key)) return;

    setDraftsByRole((prev) => {
      const roleDraft = { ...(prev[activeRole.id] || {}) };
      const curr = roleDraft[moduleId];
      if (!curr) return prev;
      roleDraft[moduleId] = {
        ...curr,
        [key]: !curr[key],
      };
      return {
        ...prev,
        [activeRole.id]: roleDraft,
      };
    });
  };

  const setRowAll = (moduleId: string, moduleCode: string, enabled: boolean) => {
    if (!canUpdate || !activeRole) return;
    setDraftsByRole((prev) => {
      const roleDraft = { ...(prev[activeRole.id] || {}) };
      const curr = roleDraft[moduleId];
      if (!curr) return prev;
      const lockedRead = isLockedAdminSelfPerm(activeRole.name, moduleCode, "canRead");
      roleDraft[moduleId] = {
        moduleId,
        canRead: lockedRead ? true : enabled,
        canCreate: enabled,
        canUpdate: enabled,
        canDelete: enabled,
        canApprove: enabled,
      };
      return {
        ...prev,
        [activeRole.id]: roleDraft,
      };
    });
  };

  const handleResetActiveRole = () => {
    if (!activeRole || !savedByRole[activeRole.id]) return;
    setDraftsByRole((prev) => ({
      ...prev,
      [activeRole.id]: structuredClone(savedByRole[activeRole.id]),
    }));
  };

  const handleSaveActiveRole = async () => {
    if (!activeRole || !canUpdate) return;
    const roleDraft = draftsByRole[activeRole.id];
    if (!roleDraft) return;

    setSaving(true);
    try {
      const permissions = modules.map((m) => roleDraft[m.id]);
      await apiRequest(`/api/admin/rbac/matrix/${activeRole.id}`, {
        method: "PUT",
        body: JSON.stringify({ permissions }),
      });

      setSavedByRole((prev) => ({
        ...prev,
        [activeRole.id]: structuredClone(roleDraft),
      }));
      await refreshMe();
      notify(`Hak akses untuk role "${activeRole.name}" berhasil disimpan.`);
    } catch (err: any) {
      notify(err?.message || "Gagal menyimpan perubahan hak akses", true);
    } finally {
      setSaving(false);
    }
  };

  const activeDraft = activeRole ? draftsByRole[activeRole.id] || {} : {};
  const dirty = activeRole ? isRoleDirty(activeRole.id) : false;

  return (
    <AppShell
      title="Settings Hak Akses & RBAC"
      breadcrumb="Akun & Keamanan / Settings Hak Akses"
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
            Hanya Admin dengan izin <code>admin-rbac:read</code> yang dapat mengakses pengaturan matriks hak akses.
          </div>
        ) : (
          <>
            {/* Top Banner */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#D4E4DC] bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#06231D] text-[#E3EF26]">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-extrabold text-[#06231D]">
                    Pengaturan Matriks Hak Akses Role (Dynamic RBAC)
                  </h2>
                  <p className="mt-0.5 text-xs text-[#64748B]">
                    Atur visibilitas modul dan 5 kontrol aksi (<strong>Read, Create, Update, Delete, Approve</strong>) per jabatan pengurus secara dinamis tanpa mengubah kode.
                  </p>
                </div>
              </div>

              {activeRole && canUpdate ? (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={!dirty || saving}
                    onClick={handleResetActiveRole}
                    className="inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-[8px] border border-[#D4E4DC] bg-white px-3.5 text-xs font-semibold text-[#06231D] hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Batalkan Draft
                  </button>
                  <button
                    type="button"
                    disabled={!dirty || saving}
                    onClick={handleSaveActiveRole}
                    className="inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-[8px] bg-[#076653] px-5 font-display text-xs font-bold text-[#FFFDEE] hover:bg-[#06231D] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <Save className="h-4 w-4 text-[#E3EF26]" />
                    {saving ? "Menyimpan..." : `Simpan Role ${activeRole.name}`}
                  </button>
                </div>
              ) : null}
            </div>

            {loading ? (
              <div className="flex justify-center rounded-2xl border border-[#D4E4DC] bg-white py-16">
                <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#D4E4DC] border-t-[#076653]" />
              </div>
            ) : (
              <>
                {/* Role Tabs */}
                <div className="rounded-2xl border border-[#D4E4DC] bg-white p-3 shadow-sm">
                  <p className="mb-2.5 px-1 font-display text-[10px] font-bold uppercase tracking-[0.08em] text-[#64748B]">
                    PILIH ROLE ORGANISASI ({roles.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {roles.map((r) => {
                      const active = r.id === selectedRoleId;
                      const roleDirty = isRoleDirty(r.id);
                      const modCount = countActiveModulesForRole(r.id);
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setSelectedRoleId(r.id)}
                          className={`inline-flex min-h-[42px] cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold transition ${
                            active
                              ? "border-[#06231D] bg-[#06231D] text-[#FFFDEE] shadow-sm"
                              : "border-[#E2E8F0] bg-[#FFFDEE]/70 text-[#06231D] hover:border-[#076653]"
                          }`}
                        >
                          <span>{r.name}</span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] tabular-nums ${
                              active
                                ? "bg-[#09352C] text-[#E3EF26]"
                                : "bg-[#E2FBCE] text-[#076653]"
                            }`}
                          >
                            {modCount}/{modules.length}
                          </span>
                          {roleDirty ? (
                            <span className="h-2 w-2 rounded-full bg-[#E3EF26] ring-2 ring-[#076653]" title="Perubahan belum disimpan" />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Role Matrix Panel */}
                {activeRole ? (
                  <div className="rounded-2xl border border-[#D4E4DC] bg-white p-5 shadow-sm">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-display text-base font-extrabold text-[#06231D]">
                            Matriks Izin: {activeRole.name}
                          </h3>
                          {activeRole.name === "Admin" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#06231D] px-2.5 py-0.5 text-[10px] font-bold text-[#E3EF26]">
                              <Lock className="h-3 w-3" />
                              Superuser Guardrail Aktif
                            </span>
                          ) : null}
                          {dirty ? (
                            <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                              Ada perubahan belum disimpan
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 text-xs text-[#64748B]">
                          {activeRole.name === "Admin"
                            ? "Role Admin memiliki proteksi anti-lockout pada modul RBAC Admin serta bypass akses penuh di backend."
                            : "Centang aksi yang diizinkan untuk role ini. Modul hanya muncul di sidebar pengguna jika opsi Read aktif."}
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-[#E2E8F0] bg-[#FFFDEE] text-[11px] uppercase tracking-wider text-[#2F4F46]">
                            <th className="py-3 pl-3 pr-4">Modul Sistem</th>
                            {PERMISSION_COLUMNS.map((col) => (
                              <th key={col.key} className="px-3 py-3 text-center">
                                <span className="block font-display font-bold text-[#06231D]">
                                  {col.label}
                                </span>
                                <span className="block text-[10px] font-normal normal-case text-[#64748B]">
                                  {col.shortDesc}
                                </span>
                              </th>
                            ))}
                            <th className="py-3 pl-3 pr-3 text-right">Pintasan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F1F5F9]">
                          {modules.map((mod) => {
                            const row = activeDraft[mod.id] || {
                              moduleId: mod.id,
                              canRead: false,
                              canCreate: false,
                              canUpdate: false,
                              canDelete: false,
                              canApprove: false,
                            };
                            const allEnabled = PERMISSION_COLUMNS.every(
                              (col) => row[col.key]
                            );
                            const anyActionWithoutRead =
                              !row.canRead &&
                              (row.canCreate ||
                                row.canUpdate ||
                                row.canDelete ||
                                row.canApprove);

                            return (
                              <tr
                                key={mod.id}
                                className={row.canRead ? "bg-white" : "bg-[#F8FAFC]/60"}
                              >
                                <td className="py-3.5 pl-3 pr-4 align-middle">
                                  <p className="font-display text-sm font-bold text-[#06231D]">
                                    {mod.label}
                                  </p>
                                  <div className="mt-0.5 flex flex-wrap items-center gap-2">
                                    <code className="rounded bg-[#F1F5F9] px-1.5 py-0.5 text-[10px] font-semibold text-[#475569]">
                                      {mod.code}
                                    </code>
                                    {anyActionWithoutRead ? (
                                      <span className="text-[10px] font-medium text-amber-700">
                                        Read nonaktif — menu tersembunyi di sidebar
                                      </span>
                                    ) : null}
                                  </div>
                                </td>

                                {PERMISSION_COLUMNS.map((col) => {
                                  const checked = row[col.key];
                                  const locked = isLockedAdminSelfPerm(
                                    activeRole.name,
                                    mod.code,
                                    col.key
                                  );
                                  return (
                                    <td
                                      key={col.key}
                                      className="px-3 py-3 text-center align-middle"
                                    >
                                      <button
                                        type="button"
                                        role="checkbox"
                                        aria-checked={checked}
                                        aria-label={`${activeRole.name} - ${mod.label} - ${col.label}`}
                                        disabled={!canUpdate || locked}
                                        onClick={() =>
                                          toggleFlag(mod.id, mod.code, col.key)
                                        }
                                        className={`inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-[8px] border transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                          checked
                                            ? "border-[#076653] bg-[#E2FBCE] text-[#076653]"
                                            : "border-[#CBD5E1] bg-white text-[#94A3B8] hover:border-[#076653]/50"
                                        }`}
                                      >
                                        {locked ? (
                                          <Lock className="h-4 w-4 text-[#06231D]" />
                                        ) : checked ? (
                                          <CheckSquare className="h-4 w-4" />
                                        ) : (
                                          <Square className="h-4 w-4" />
                                        )}
                                      </button>
                                    </td>
                                  );
                                })}

                                <td className="py-3 pl-3 pr-3 text-right align-middle">
                                  {canUpdate ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setRowAll(mod.id, mod.code, !allEnabled)
                                      }
                                      className="min-h-[34px] cursor-pointer rounded-[6px] border border-[#D4E4DC] bg-white px-2.5 text-[11px] font-semibold text-[#06231D] hover:border-[#076653]"
                                    >
                                      {allEnabled ? "Kosongkan" : "Semua"}
                                    </button>
                                  ) : null}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
