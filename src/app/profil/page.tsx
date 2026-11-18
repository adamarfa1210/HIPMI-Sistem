"use client";

import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Lock,
  Save,
  UserCog,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  INTEREST_CATEGORIES,
  KADER_STATUS_META,
  type KaderInterestCategory,
  type KaderStatus,
} from "@/lib/kader";

export default function SettingsProfilePage() {
  const { user, can, refreshMe } = useAuth();
  const canRead = can("profile", "read");
  const canUpdate = can("profile", "update");

  const [fullName, setFullName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [prodi, setProdi] = useState("");
  const [fakultas, setFakultas] = useState("");
  const [interestCategory, setInterestCategory] =
    useState<KaderInterestCategory>("Belum Punya Bisnis");
  const [instagram, setInstagram] = useState("");
  const [businessName, setBusinessName] = useState("");

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; isError: boolean } | null>(
    null
  );

  useEffect(() => {
    if (!user) return;
    setFullName(user.fullName || "");
    setWhatsappNumber(user.whatsappNumber || "");
    setProdi(user.prodi || "");
    setFakultas(user.fakultas || "");
    const rawCat = user.interestCategory as KaderInterestCategory | undefined;
    setInterestCategory(
      rawCat && INTEREST_CATEGORIES.includes(rawCat)
        ? rawCat
        : "Belum Punya Bisnis"
    );
    setInstagram(user.instagram || "");
    setBusinessName(user.businessName || "");
  }, [user]);

  const notify = (message: string, isError = false) => {
    setToast({ message, isError });
    window.setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canUpdate || saving) return;
    setSaving(true);
    try {
      await apiRequest("/api/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({
          fullName: fullName.trim(),
          whatsappNumber: whatsappNumber.trim(),
          prodi: prodi.trim(),
          fakultas: fakultas.trim(),
          interestCategory,
          instagram: instagram.trim() || null,
          businessName: businessName.trim() || null,
        }),
      });
      await refreshMe();
      notify("Profil pribadi Anda berhasil diperbarui.");
    } catch (err: any) {
      notify(err?.message || "Gagal memperbarui profil pribadi", true);
    } finally {
      setSaving(false);
    }
  };

  const statusMeta =
    KADER_STATUS_META[(user?.status as KaderStatus) || "Aktif"] ||
    KADER_STATUS_META.Aktif;

  return (
    <AppShell
      title="Settings Profile"
      breadcrumb="Akun & Keamanan / Settings Profile"
    >
      <div className="mx-auto max-w-4xl space-y-6">
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
            Akun Anda belum memiliki izin <code>profile:read</code> untuk
            mengakses modul Settings Profile. Atur izin modul{" "}
            <strong>Settings Profile</strong> melalui Settings Hak Akses.
          </div>
        ) : (
          <>
            {/* Top Identity Banner */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#D4E4DC] bg-white p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#06231D] font-display text-lg font-extrabold text-[#E3EF26]">
                  {(user?.fullName || "HP")
                    .split(" ")
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase()}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-lg font-extrabold text-[#06231D]">
                      {user?.fullName || "-"}
                    </h2>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${statusMeta.className}`}
                    >
                      {statusMeta.label}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-[#64748B]">
                    Kelola biodata diri Anda. Identitas NIM dan Role jabatan hanya dapat diubah oleh Admin.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-[#D4E4DC] bg-[#FFFDEE] px-4 py-2.5 text-right">
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#64748B]">
                  Poin Keaktifan
                </p>
                <p className="font-display text-xl font-extrabold tabular-nums text-[#076653]">
                  {user?.totalScore ?? 0}
                </p>
              </div>
            </div>

            {!canUpdate ? (
              <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900">
                <Lock className="h-4 w-4 shrink-0 text-amber-700" />
                <span>
                  Role Anda hanya memiliki izin baca (<code>profile:read</code>) tanpa izin ubah (<code>profile:update</code>). Formulir ditampilkan dalam mode baca saja.
                </span>
              </div>
            ) : null}

            {/* Edit Form */}
            <form
              onSubmit={handleSave}
              className="space-y-5 rounded-2xl border border-[#D4E4DC] bg-white p-6 shadow-sm"
            >
              <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
                <UserCog className="h-4 w-4 text-[#076653]" />
                <h3 className="font-display text-sm font-extrabold text-[#06231D]">
                  Informasi Akun &amp; Biodata Kader
                </h3>
              </div>

              {/* Read-Only Fields: NIM & Role */}
              <div className="grid gap-4 rounded-xl border border-[#D4E4DC] bg-[#F8FAFC] p-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="profile-nim"
                    className="mb-1 block text-xs font-bold text-[#475569]"
                  >
                    NIM (Read-Only)
                  </label>
                  <input
                    id="profile-nim"
                    type="text"
                    readOnly
                    disabled
                    value={user?.nim || ""}
                    className="min-h-[40px] w-full cursor-not-allowed rounded-[8px] border border-[#CBD5E1] bg-[#E2E8F0]/70 px-3 text-sm font-bold tabular-nums text-[#06231D]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="profile-role"
                    className="mb-1 block text-xs font-bold text-[#475569]"
                  >
                    Role Jabatan (Read-Only)
                  </label>
                  <input
                    id="profile-role"
                    type="text"
                    readOnly
                    disabled
                    value={user?.roleName || ""}
                    className="min-h-[40px] w-full cursor-not-allowed rounded-[8px] border border-[#CBD5E1] bg-[#E2E8F0]/70 px-3 text-sm font-bold text-[#076653]"
                  />
                </div>
              </div>

              {/* Editable Fields */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="profile-fullname"
                    className="mb-1 block text-xs font-bold text-[#06231D]"
                  >
                    Nama Lengkap *
                  </label>
                  <input
                    id="profile-fullname"
                    type="text"
                    required
                    disabled={!canUpdate}
                    minLength={3}
                    maxLength={120}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="min-h-[42px] w-full rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-sm text-[#06231D] disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="profile-wa"
                    className="mb-1 block text-xs font-bold text-[#06231D]"
                  >
                    No. WhatsApp Aktif *
                  </label>
                  <input
                    id="profile-wa"
                    type="text"
                    required
                    disabled={!canUpdate}
                    minLength={8}
                    maxLength={20}
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    className="min-h-[42px] w-full rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-sm tabular-nums text-[#06231D] disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="profile-prodi"
                    className="mb-1 block text-xs font-bold text-[#06231D]"
                  >
                    Program Studi (Prodi) *
                  </label>
                  <input
                    id="profile-prodi"
                    type="text"
                    required
                    disabled={!canUpdate}
                    minLength={2}
                    maxLength={80}
                    value={prodi}
                    onChange={(e) => setProdi(e.target.value)}
                    className="min-h-[42px] w-full rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-sm text-[#06231D] disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="profile-fakultas"
                    className="mb-1 block text-xs font-bold text-[#06231D]"
                  >
                    Fakultas *
                  </label>
                  <input
                    id="profile-fakultas"
                    type="text"
                    required
                    disabled={!canUpdate}
                    minLength={2}
                    maxLength={80}
                    value={fakultas}
                    onChange={(e) => setFakultas(e.target.value)}
                    className="min-h-[42px] w-full rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-sm text-[#06231D] disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label
                    htmlFor="profile-interest"
                    className="mb-1 block text-xs font-bold text-[#06231D]"
                  >
                    Kategori Minat Bisnis *
                  </label>
                  <select
                    id="profile-interest"
                    disabled={!canUpdate}
                    value={interestCategory}
                    onChange={(e) =>
                      setInterestCategory(
                        e.target.value as KaderInterestCategory
                      )
                    }
                    className="min-h-[42px] w-full rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-2.5 text-xs font-semibold text-[#06231D] disabled:cursor-not-allowed disabled:bg-slate-100"
                  >
                    {INTEREST_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="profile-ig"
                    className="mb-1 block text-xs font-bold text-[#06231D]"
                  >
                    Username Instagram (Opsional)
                  </label>
                  <input
                    id="profile-ig"
                    type="text"
                    disabled={!canUpdate}
                    maxLength={60}
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="@username"
                    className="min-h-[42px] w-full rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-sm text-[#06231D] disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="profile-business"
                    className="mb-1 block text-xs font-bold text-[#06231D]"
                  >
                    Nama Bisnis (Opsional)
                  </label>
                  <input
                    id="profile-business"
                    type="text"
                    disabled={!canUpdate}
                    maxLength={120}
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Bila memiliki usaha"
                    className="min-h-[42px] w-full rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-sm text-[#06231D] disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </div>
              </div>

              {canUpdate ? (
                <div className="flex justify-end border-t border-[#E2E8F0] pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex min-h-[42px] cursor-pointer items-center gap-2 rounded-[8px] bg-[#076653] px-5 font-display text-xs font-bold text-[#FFFDEE] transition hover:bg-[#06231D] disabled:opacity-50"
                  >
                    <Save className="h-4 w-4 text-[#E3EF26]" />
                    {saving ? "Menyimpan..." : "Simpan Perubahan Profil"}
                  </button>
                </div>
              ) : null}
            </form>
          </>
        )}
      </div>
    </AppShell>
  );
}
