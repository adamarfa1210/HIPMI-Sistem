"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  Lock,
  ShieldCheck,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiRequest, getDefaultLandingRoute } from "@/lib/api";

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();

  const [nim, setNim] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotNim, setForgotNim] = useState("");
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);
  const [forgotErr, setForgotErr] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      router.replace(getDefaultLandingRoute(user));
    }
  }, [loading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const loggedUser = await login(nim.trim(), password);
      router.replace(getDefaultLandingRoute(loggedUser));
    } catch (err: any) {
      setError(err?.message || "NIM atau password tidak valid.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotErr(null);
    setForgotMsg(null);
    setForgotSubmitting(true);
    try {
      await apiRequest("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ nim: forgotNim.trim() }),
      });
      setForgotMsg(
        "Pengajuan reset password berhasil dikirim ke antrean ACC Admin. Setelah di-ACC Admin, silakan login dengan Password = NIM Anda untuk membuat password baru."
      );
      setForgotNim("");
    } catch (err: any) {
      setForgotErr(err?.message || "Gagal mengajukan reset password.");
    } finally {
      setForgotSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Left Brand Panel (#06231D) */}
      <section className="flex flex-col justify-between bg-[#06231D] px-6 py-8 text-[#FFFDEE] lg:w-[44%] lg:px-14 lg:py-12">
        <div>
          {/* Dual Logo matching Web UKM Profile & FigCraft */}
          <div className="flex items-center gap-3">
            <img
              src="/assets/logo-bintang.png"
              alt="Logo Bintang HIPMI"
              width={38}
              height={38}
              className="h-9.5 w-9.5 object-contain"
            />
            <img
              src="/assets/logo-hipmi-pt-telkom.png"
              alt="Logo HIPMI PT Telkom"
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-contain"
            />
            <div className="leading-tight">
              <p className="font-display text-sm font-extrabold tracking-tight text-[#FFFDEE]">
                HIPMI PT TELKOM UNIVERSITY
              </p>
              <p className="font-display text-[10px] font-bold tracking-[0.08em] text-[#E3EF26]">
                INTEGRATED ERP &amp; HEADLESS CMS PORTAL
              </p>
            </div>
          </div>

          <div className="mt-10 lg:mt-20">
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.12em] text-[#E3EF26]">
              PORTAL OPERASIONAL PENGURUS &amp; KADER
            </p>
            <h1 className="mt-3 font-display text-2xl font-extrabold leading-[1.2] tracking-[-0.02em] text-[#FFFDEE] sm:text-4xl">
              Satu Portal Terpadu Untuk Tata Kelola HIPMI PT Telkom.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-[#C7DCD2]">
              Kelola konten Website Profil UKM, hero banner, kemitraan, bisnis
              kader, prestasi, program kerja, hingga pengumuman resmi secara
              real-time.
            </p>
          </div>

          <div className="mt-8 hidden space-y-3 lg:block">
            <div className="rounded-[8px] border border-[#124236] bg-[#0C342C] p-4">
              <div className="flex items-center gap-2 font-display text-xs font-bold text-[#FFFDEE]">
                <ShieldCheck className="h-4 w-4 text-[#E3EF26]" />
                <span>Dynamic RBAC &amp; Server-Side Audit Trail</span>
              </div>
              <p className="mt-1 text-xs text-[#C7DCD2]">
                Visibilitas menu &amp; izin CRUD menyesuaikan matriks jabatan
                Anda.
              </p>
            </div>
            <div className="rounded-[8px] border border-[#124236] bg-[#0C342C] p-4">
              <div className="flex items-center gap-2 font-display text-xs font-bold text-[#FFFDEE]">
                <Globe className="h-4 w-4 text-[#E3EF26]" />
                <span>Single Source of Truth CMS &amp; ISR Sync</span>
              </div>
              <p className="mt-1 text-xs text-[#C7DCD2]">
                Setiap pembaruan CMS langsung tersinkron ke Website Profil
                Publik.
              </p>
            </div>
          </div>
        </div>

        <p className="mt-8 hidden text-[11px] text-[#C7DCD2] lg:block">
          UKM HIPMI PT Universitas Telkom • Gedung Student Center Lt. 2, Bandung
        </p>
      </section>

      {/* Right Auth Workspace (#FFFDEE) */}
      <section className="flex flex-1 flex-col justify-between bg-[#FFFDEE] px-6 py-8 sm:px-12 lg:px-16 lg:py-10">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-[#2F4F46]">
            Portal Internal / Autentikasi (/login)
          </p>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#A7F3D0] bg-[#E2FBCE] px-3 py-1 font-display text-[10px] font-bold text-[#076653]">
            ● JWT AUTH • READY
          </span>
        </div>

        <div className="mx-auto my-8 w-full max-w-[480px] rounded-[12px] border border-[#D4E4DC] bg-white p-6 shadow-xs sm:p-9">
          <h2 className="font-display text-2xl font-extrabold tracking-[-0.02em] text-[#06231D]">
            Masuk ke Portal Internal
          </h2>
          <p className="mt-1.5 text-sm text-[#2F4F46]">
            Gunakan Nomor Induk Mahasiswa (NIM) dan password terdaftar.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="nim"
                className="mb-1.5 block text-xs font-semibold text-[#06231D]"
              >
                Nomor Induk Mahasiswa (NIM)
              </label>
              <input
                id="nim"
                type="text"
                inputMode="numeric"
                required
                value={nim}
                onChange={(e) => setNim(e.target.value)}
                placeholder="Contoh: 1201220001"
                className="tabular-nums min-h-[44px] w-full rounded-[6px] border border-[#D4E4DC] bg-[#FFFDEE] px-3.5 text-sm text-[#06231D] focus:border-[#076653] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-semibold text-[#06231D]"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password Anda"
                  className="min-h-[44px] w-full rounded-[6px] border border-[#D4E4DC] bg-[#FFFDEE] px-3.5 pr-11 text-sm text-[#06231D] focus:border-[#076653] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={
                    showPassword ? "Sembunyikan password" : "Tampilkan password"
                  }
                  className="absolute right-1.5 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded text-[#2F4F46] hover:bg-[#E2FBCE]/50"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error ? (
              <div className="rounded-[6px] border border-[#FECACA] bg-[#FEE2E2] px-3.5 py-2.5 text-xs font-medium text-[#991B1B]">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex min-h-[46px] w-full cursor-pointer items-center justify-center rounded-[6px] bg-[#E3EF26] px-5 font-display text-sm font-bold text-[#06231D] transition hover:bg-[#d5e11e] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Memverifikasi..." : "Masuk ke Portal ERP →"}
            </button>

            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-[#475569]">Lupa atau belum pernah ubah password?</span>
              <button
                type="button"
                onClick={() => {
                  setForgotNim(nim.trim());
                  setForgotErr(null);
                  setForgotMsg(null);
                  setForgotOpen(true);
                }}
                className="cursor-pointer font-bold text-[#076653] underline hover:text-[#06231D]"
              >
                Lupa Password?
              </button>
            </div>
          </form>

          <div className="mt-6 rounded-[6px] border border-[#A7F3D0] bg-[#E2FBCE] p-3.5">
            <p className="flex items-center gap-1.5 font-display text-[11px] font-bold text-[#076653]">
              <Lock className="h-3.5 w-3.5" />
              <span>AKUN KADER BARU &amp; LUPA PASSWORD</span>
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[#06231D]">
              Kader baru hasil import NIM menggunakan{" "}
              <strong>Password = NIM</strong> pada login pertama. Jika lupa
              password, ajukan lewat tombol <strong>Lupa Password?</strong> agar
              di-ACC Admin.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-[#2F4F46]">
          © 2026 UKM HIPMI PT Universitas Telkom
        </p>
      </section>

      {forgotOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#06231D]/70 p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleForgotSubmit}
            className="w-full max-w-md space-y-4 rounded-[14px] border border-[#D4E4DC] bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-[10px] font-bold uppercase tracking-[0.08em] text-[#076653]">
                  PENGAJUAN RESET PASSWORD
                </p>
                <h2 className="mt-0.5 font-display text-base font-extrabold text-[#06231D]">
                  Lupa Password Portal ERP
                </h2>
                <p className="mt-1 text-xs text-[#475569]">
                  Masukkan NIM Anda untuk mengirim permintaan reset password ke Admin.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setForgotOpen(false)}
                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded text-[#475569] hover:bg-[#F1F5F9]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <label
                htmlFor="forgot-nim"
                className="mb-1.5 block text-xs font-semibold text-[#06231D]"
              >
                Nomor Induk Mahasiswa (NIM)
              </label>
              <input
                id="forgot-nim"
                type="text"
                inputMode="numeric"
                required
                minLength={5}
                maxLength={20}
                value={forgotNim}
                onChange={(e) => setForgotNim(e.target.value)}
                placeholder="Masukkan NIM terdaftar Anda"
                className="tabular-nums min-h-[42px] w-full rounded-[6px] border border-[#D4E4DC] bg-[#FFFDEE] px-3.5 text-sm text-[#06231D] focus:border-[#076653] focus:outline-none"
              />
            </div>

            {forgotErr ? (
              <div className="rounded-[6px] border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                {forgotErr}
              </div>
            ) : null}

            {forgotMsg ? (
              <div className="flex items-start gap-2 rounded-[6px] border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-medium text-emerald-900">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{forgotMsg}</span>
              </div>
            ) : null}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setForgotOpen(false)}
                className="min-h-[38px] cursor-pointer rounded-[6px] border border-[#D4E4DC] px-4 text-xs font-semibold text-[#06231D]"
              >
                Tutup
              </button>
              <button
                type="submit"
                disabled={forgotSubmitting}
                className="inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-[6px] bg-[#076653] px-4 font-display text-xs font-bold text-[#FFFDEE] hover:bg-[#06231D] disabled:opacity-50"
              >
                <KeyRound className="h-3.5 w-3.5 text-[#E3EF26]" />
                {forgotSubmitting ? "Mengirim..." : "Ajukan Reset Password"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
