"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LogOut,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { apiRequest, getDefaultLandingRoute } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  INTEREST_CATEGORIES,
  type KaderInterestCategory,
} from "@/lib/kader";

export default function LengkapiAkunPage() {
  const { user, loading, logout, refreshMe } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [prodi, setProdi] = useState("");
  const [fakultas, setFakultas] = useState("");
  const [interestCategory, setInterestCategory] =
    useState<KaderInterestCategory>("Belum Punya Bisnis");
  const [instagram, setInstagram] = useState("");
  const [businessName, setBusinessName] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!user.onboardingMode || user.onboardingMode === "none") {
      router.replace(getDefaultLandingRoute(user));
    }
  }, [loading, user, router]);

  if (
    loading ||
    !user ||
    !user.onboardingMode ||
    user.onboardingMode === "none"
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFFDEE]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#D4E4DC] border-t-[#076653]" />
      </div>
    );
  }

  const isResetOnly = user.onboardingMode === "reset-password";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedPass = newPassword.trim();
    if (trimmedPass.length < 6) {
      setError("Password baru minimal 6 karakter.");
      return;
    }
    if (trimmedPass === user.nim) {
      setError("Password baru tidak boleh sama dengan NIM Anda.");
      return;
    }
    if (trimmedPass !== confirmPassword.trim()) {
      setError("Konfirmasi password baru tidak cocok.");
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, any> = {
        newPassword: trimmedPass,
      };
      if (!isResetOnly) {
        payload.fullName = fullName.trim();
        payload.whatsappNumber = whatsappNumber.trim();
        payload.prodi = prodi.trim();
        payload.fakultas = fakultas.trim();
        payload.interestCategory = interestCategory;
        if (instagram.trim()) payload.instagram = instagram.trim();
        if (businessName.trim()) payload.businessName = businessName.trim();
      }

      await apiRequest("/api/auth/complete-onboarding", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const refreshed = await refreshMe();
      router.replace(getDefaultLandingRoute(refreshed));
    } catch (err: any) {
      setError(err?.message || "Gagal menyimpan aktivasi akun.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDEE] px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-2xl">
        {/* Top Brand + Logout */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#124236] bg-[#06231D] px-5 py-4 text-[#FFFDEE] shadow-sm">
          <div className="flex items-center gap-3">
            <img
              src="/assets/logo-bintang.png"
              alt="Logo Bintang HIPMI"
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
            />
            <img
              src="/assets/logo-hipmi-pt-telkom.png"
              alt="Logo HIPMI PT Telkom"
              width={30}
              height={30}
              className="h-7.5 w-7.5 rounded-full object-contain"
            />
            <div>
              <p className="font-display text-xs font-extrabold">
                HIPMI PT TELKOM UNIVERSITY
              </p>
              <p className="font-display text-[10px] font-bold text-[#E3EF26]">
                NIM: {user.nim} • Role: {user.roleName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              logout();
              router.replace("/login");
            }}
            className="inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-[6px] border border-[#124236] bg-[#0C342C] px-3 text-xs font-bold text-[#FCA5A5] hover:bg-[#124236]"
          >
            <LogOut className="h-3.5 w-3.5" />
            Keluar
          </button>
        </div>

        {/* Locked Onboarding Card */}
        <div className="rounded-2xl border border-[#D4E4DC] bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <Lock className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div>
              <h1 className="font-display text-base font-extrabold text-[#06231D] sm:text-lg">
                {isResetOnly
                  ? "Buat Password Baru (Pasca Reset Password)"
                  : "Lengkapi Data Kader & Ubah Password Default"}
              </h1>
              <p className="mt-1 text-xs leading-relaxed text-[#475569]">
                {isResetOnly
                  ? "Akun Anda baru saja direset ke NIM setelah disetujui Admin. Untuk melanjutkan masuk ke ERP, buat password baru yang berbeda dengan NIM Anda."
                  : "Sistem mendeteksi akun ini masih menggunakan password default (= NIM) dari import kader. Silakan lengkapi biodata Anda dan buat password baru yang berbeda dengan NIM."}
              </p>
            </div>
          </div>

          {isResetOnly ? (
            <div className="mb-6 grid gap-3 rounded-xl border border-[#D4E4DC] bg-[#FFFDEE] p-4 text-xs sm:grid-cols-2">
              <div>
                <p className="text-[#64748B]">Nama Lengkap</p>
                <p className="mt-0.5 font-bold text-[#06231D]">
                  {user.fullName}
                </p>
              </div>
              <div>
                <p className="text-[#64748B]">NIM</p>
                <p className="mt-0.5 font-bold tabular-nums text-[#06231D]">
                  {user.nim}
                </p>
              </div>
              <div>
                <p className="text-[#64748B]">Prodi / Fakultas</p>
                <p className="mt-0.5 font-semibold text-[#06231D]">
                  {user.prodi || "-"} / {user.fakultas || "-"}
                </p>
              </div>
              <div>
                <p className="text-[#64748B]">Kategori Minat</p>
                <p className="mt-0.5 font-semibold text-[#06231D]">
                  {user.interestCategory || "-"}
                </p>
              </div>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isResetOnly ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2">
                  <UserCheck className="h-4 w-4 text-[#076653]" />
                  <h2 className="font-display text-xs font-extrabold uppercase tracking-[0.06em] text-[#076653]">
                    Biodata Kader
                  </h2>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#06231D]">
                      Nama Lengkap *
                    </label>
                    <input
                      type="text"
                      required
                      minLength={3}
                      maxLength={120}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nama sesuai KTM"
                      className="min-h-[42px] w-full rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-sm text-[#06231D]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#06231D]">
                      No. WhatsApp Aktif *
                    </label>
                    <input
                      type="text"
                      required
                      minLength={8}
                      maxLength={20}
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      placeholder="0812xxxxxxxx"
                      className="min-h-[42px] w-full rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-sm tabular-nums text-[#06231D]"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#06231D]">
                      Program Studi (Prodi) *
                    </label>
                    <input
                      type="text"
                      required
                      minLength={2}
                      maxLength={80}
                      value={prodi}
                      onChange={(e) => setProdi(e.target.value)}
                      placeholder="Contoh: S1 Sistem Informasi"
                      className="min-h-[42px] w-full rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-sm text-[#06231D]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#06231D]">
                      Fakultas *
                    </label>
                    <input
                      type="text"
                      required
                      minLength={2}
                      maxLength={80}
                      value={fakultas}
                      onChange={(e) => setFakultas(e.target.value)}
                      placeholder="Contoh: Fakultas Rekayasa Industri"
                      className="min-h-[42px] w-full rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-sm text-[#06231D]"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-1">
                    <label className="mb-1 block text-xs font-bold text-[#06231D]">
                      Kategori Minat Bisnis *
                    </label>
                    <select
                      value={interestCategory}
                      onChange={(e) =>
                        setInterestCategory(
                          e.target.value as KaderInterestCategory
                        )
                      }
                      className="min-h-[42px] w-full rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-2.5 text-xs font-semibold text-[#06231D]"
                    >
                      {INTEREST_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#06231D]">
                      Instagram (Opsional)
                    </label>
                    <input
                      type="text"
                      maxLength={60}
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="@username"
                      className="min-h-[42px] w-full rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-sm text-[#06231D]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#06231D]">
                      Nama Bisnis (Opsional)
                    </label>
                    <input
                      type="text"
                      maxLength={120}
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Bila sudah punya usaha"
                      className="min-h-[42px] w-full rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-sm text-[#06231D]"
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {/* Password Section */}
            <div className="space-y-4 pt-1">
              <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2">
                <KeyRound className="h-4 w-4 text-[#076653]" />
                <h2 className="font-display text-xs font-extrabold uppercase tracking-[0.06em] text-[#076653]">
                  Keamanan Password Baru (Tidak Boleh Sama Dengan NIM)
                </h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#06231D]">
                    Password Baru * (Min. 6 karakter)
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      required
                      minLength={6}
                      maxLength={100}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Buat password baru"
                      className="min-h-[42px] w-full rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 pr-10 text-sm text-[#06231D]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      aria-label="Toggle lihat password"
                      className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-[#64748B]"
                    >
                      {showPass ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-[#06231D]">
                    Konfirmasi Password Baru *
                  </label>
                  <input
                    type={showPass ? "text" : "password"}
                    required
                    minLength={6}
                    maxLength={100}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password baru"
                    className="min-h-[42px] w-full rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-sm text-[#06231D]"
                  />
                </div>
              </div>
            </div>

            {error ? (
              <div className="flex items-center gap-2 rounded-[8px] border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-[46px] w-full cursor-pointer items-center justify-center gap-2 rounded-[8px] bg-[#06231D] px-5 font-display text-sm font-bold text-[#E3EF26] transition hover:bg-[#076653] disabled:opacity-60"
            >
              <ShieldCheck className="h-4 w-4" />
              {saving
                ? "Menyimpan..."
                : isResetOnly
                ? "Simpan Password Baru & Masuk Portal"
                : "Simpan Data & Aktifkan Akun"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
