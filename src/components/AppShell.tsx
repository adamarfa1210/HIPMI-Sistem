"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  ExternalLink,
  FolderKanban,
  Globe,
  KeyRound,
  LogOut,
  Menu,
  Newspaper,
  PenSquare,
  Send,
  ShieldCheck,
  Trophy,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/api";

const PUBLIC_WEB_URL =
  process.env.NEXT_PUBLIC_PUBLIC_WEB_URL || "http://localhost:3001";

interface AppShellProps {
  title: string;
  breadcrumb: string;
  children: React.ReactNode;
}

export function AppShell({ title, breadcrumb, children }: AppShellProps) {
  const { user, loading, logout, can } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwErr(null);
    setPwMsg(null);
    try {
      await apiRequest("/api/auth/change-password", {
        method: "PATCH",
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      setPwMsg("Password berhasil diperbarui.");
      setOldPassword("");
      setNewPassword("");
    } catch (err: any) {
      setPwErr(err?.message || "Gagal memperbarui password.");
    }
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFFDEE]">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#D4E4DC] border-t-[#076653]" />
          <p className="font-display text-xs font-bold text-[#06231D]">
            Memuat Portal HIPMI ERP &amp; CMS...
          </p>
        </div>
      </div>
    );
  }

  const canAccessCms = can("cms", "read");
  const canAccessNews = can("news", "read");
  const canAccessNewsManage =
    can("news-manage", "read") ||
    can("news-manage", "create") ||
    can("news-manage", "update");
  const canAccessKaders = can("kaders", "read");
  const canAccessFinanceRequest =
    can("finance-request", "read") || can("finance-request", "create");
  const canAccessFinance = can("finance", "read") || can("finance", "approve");
  const canAccessTracking = can("tracking", "read");
  const canAccessLeaderboard = can("leaderboard", "read");
  const canAccessCalendar = can("calendar", "read");
  const canAccessSettings = can("admin-rbac", "read");

  const navLinkClass = (active: boolean) =>
    `flex min-h-[42px] items-center gap-2.5 rounded-[6px] px-3 text-sm font-medium transition ${
      active
        ? "border border-[#E3EF26] bg-[#09352C] text-[#FFFDEE]"
        : "text-[#C7DCD2] hover:bg-[#0C342C] hover:text-[#FFFDEE]"
    }`;

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-[#06231D] p-4 text-[#FFFDEE]">
      <div>
        {/* Dual Logo Brand Header matching FigCraft & Web UKM */}
        <div className="flex items-center justify-between gap-2 rounded-[8px] border border-[#124236] bg-[#0C342C] px-3 py-2.5">
          <div className="flex items-center gap-2.5">
            <img
              src="/assets/logo-bintang.png"
              alt="Logo Bintang HIPMI"
              width={26}
              height={26}
              className="h-6.5 w-6.5 shrink-0 object-contain"
            />
            <img
              src="/assets/logo-hipmi-pt-telkom.png"
              alt="Logo HIPMI PT Telkom"
              width={28}
              height={28}
              className="h-7 w-7 shrink-0 rounded-full object-contain"
            />
            <div className="min-w-0 leading-tight">
              <p className="truncate font-display text-xs font-extrabold text-[#FFFDEE]">
                HIPMI PT TELKOM
              </p>
              <p className="truncate font-display text-[9px] font-bold tracking-[0.06em] text-[#E3EF26]">
                ERP &amp; CMS INTERNAL
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="inline-flex h-8 w-8 items-center justify-center rounded text-[#C7DCD2] hover:text-white lg:hidden"
            aria-label="Tutup menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation Sections */}
        <p className="mb-2 mt-6 px-2 font-display text-[10px] font-bold uppercase tracking-[0.08em] text-[#C7DCD2]">
          OPERASIONAL ERP
        </p>
        <nav className="space-y-1.5" aria-label="Menu Operasional ERP">
          {canAccessKaders ? (
            <Link
              href="/kader"
              onClick={() => setDrawerOpen(false)}
              className={navLinkClass(pathname.startsWith("/kader"))}
            >
              <Users className="h-4 w-4 text-[#E3EF26]" />
              <span>Master Kader</span>
            </Link>
          ) : null}
          {canAccessFinanceRequest ? (
            <Link
              href="/keuangan/pengajuan"
              onClick={() => setDrawerOpen(false)}
              className={navLinkClass(pathname.startsWith("/keuangan/pengajuan"))}
            >
              <Send className="h-4 w-4 text-[#E3EF26]" />
              <span>Pengajuan Keuangan</span>
            </Link>
          ) : null}
          {canAccessFinance ? (
            <Link
              href="/keuangan"
              onClick={() => setDrawerOpen(false)}
              className={navLinkClass(pathname === "/keuangan")}
            >
              <Wallet className="h-4 w-4 text-[#E3EF26]" />
              <span>Persetujuan &amp; Kas</span>
            </Link>
          ) : null}
          {canAccessTracking ? (
            <Link
              href="/proker"
              onClick={() => setDrawerOpen(false)}
              className={navLinkClass(pathname.startsWith("/proker"))}
            >
              <FolderKanban className="h-4 w-4 text-[#E3EF26]" />
              <span>Proker &amp; Rapat</span>
            </Link>
          ) : null}
          {canAccessLeaderboard ? (
            <Link
              href="/leaderboard"
              onClick={() => setDrawerOpen(false)}
              className={navLinkClass(pathname.startsWith("/leaderboard"))}
            >
              <Trophy className="h-4 w-4 text-[#E3EF26]" />
              <span>Leaderboard Poin</span>
            </Link>
          ) : null}
          {canAccessCalendar ? (
            <Link
              href="/kalender"
              onClick={() => setDrawerOpen(false)}
              className={navLinkClass(pathname.startsWith("/kalender"))}
            >
              <CalendarDays className="h-4 w-4 text-[#E3EF26]" />
              <span>Calendar HIPMI</span>
            </Link>
          ) : null}
          {canAccessNews ? (
            <Link
              href="/berita"
              onClick={() => setDrawerOpen(false)}
              className={navLinkClass(pathname === "/berita")}
            >
              <Newspaper className="h-4 w-4 text-[#E3EF26]" />
              <span>Berita HIPMI</span>
            </Link>
          ) : null}
          {!canAccessKaders &&
          !canAccessFinanceRequest &&
          !canAccessFinance &&
          !canAccessTracking &&
          !canAccessLeaderboard &&
          !canAccessCalendar &&
          !canAccessNews ? (
            <div className="rounded-[6px] border border-[#124236] bg-[#0C342C]/60 px-3 py-2.5 text-xs text-[#C7DCD2]">
              Role Anda ({user.roleName}) tidak memiliki akses modul Operasional ERP.
            </div>
          ) : null}
        </nav>

        <p className="mb-2 mt-6 px-2 font-display text-[10px] font-bold uppercase tracking-[0.08em] text-[#C7DCD2]">
          KONTEN &amp; WEBSITE
        </p>
        <nav className="space-y-1.5" aria-label="Menu Portal">
          {canAccessCms ? (
            <Link
              href="/cms"
              onClick={() => setDrawerOpen(false)}
              className={navLinkClass(pathname.startsWith("/cms"))}
            >
              <Globe className="h-4 w-4 text-[#E3EF26]" />
              <span>UKM Profile CMS</span>
            </Link>
          ) : null}
          {canAccessNewsManage ? (
            <Link
              href="/berita/kelola"
              onClick={() => setDrawerOpen(false)}
              className={navLinkClass(pathname.startsWith("/berita/kelola"))}
            >
              <PenSquare className="h-4 w-4 text-[#E3EF26]" />
              <span>Setting Berita</span>
            </Link>
          ) : null}
          {!canAccessCms && !canAccessNewsManage ? (
            <div className="rounded-[6px] border border-[#124236] bg-[#0C342C]/60 px-3 py-2.5 text-xs text-[#C7DCD2]">
              Role Anda ({user.roleName}) tidak memiliki izin kelola konten CMS atau Berita.
            </div>
          ) : null}

          <a
            href={PUBLIC_WEB_URL}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-[42px] items-center justify-between rounded-[6px] px-3 text-sm font-medium text-[#C7DCD2] transition hover:bg-[#0C342C] hover:text-[#E3EF26]"
          >
            <span>Lihat Web Profil Publik</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </nav>

        <p className="mb-2 mt-6 px-2 font-display text-[10px] font-bold uppercase tracking-[0.08em] text-[#C7DCD2]">
          AKUN &amp; KEAMANAN
        </p>
        <div className="space-y-1.5">
          {canAccessSettings ? (
            <Link
              href="/settings"
              onClick={() => setDrawerOpen(false)}
              className={navLinkClass(pathname.startsWith("/settings"))}
            >
              <ShieldCheck className="h-4 w-4 text-[#E3EF26]" />
              <span>Settings Hak Akses</span>
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => {
              setDrawerOpen(false);
              setPwModalOpen(true);
            }}
            className="flex min-h-[42px] w-full cursor-pointer items-center gap-2.5 rounded-[6px] px-3 text-left text-sm font-medium text-[#C7DCD2] transition hover:bg-[#0C342C] hover:text-[#FFFDEE]"
          >
            <KeyRound className="h-4 w-4" />
            <span>Ubah Password</span>
          </button>
          <button
            type="button"
            onClick={() => {
              logout();
              router.replace("/login");
            }}
            className="flex min-h-[42px] w-full cursor-pointer items-center gap-2.5 rounded-[6px] px-3 text-left text-sm font-medium text-[#FCA5A5] transition hover:bg-[#0C342C]"
          >
            <LogOut className="h-4 w-4" />
            <span>Keluar Sesi</span>
          </button>
        </div>
      </div>

      {/* User Profile Footer Card */}
      <div className="rounded-[8px] border border-[#124236] bg-[#0C342C] p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#076653] font-display text-xs font-extrabold text-[#FFFDEE]">
            {user.fullName
              .split(" ")
              .slice(0, 2)
              .map((w) => w[0])
              .join("")
              .toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-[#FFFDEE]">
              {user.fullName}
            </p>
            <p className="truncate font-display text-[10px] font-bold text-[#E3EF26]">
              {user.roleName} • {user.nim}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#FFFDEE]">
      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden w-[260px] shrink-0 border-r border-[#124236] lg:block">
          {sidebarContent}
        </aside>

        {/* Mobile Drawer */}
        {drawerOpen ? (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div
              className="fixed inset-0 bg-[#06231D]/60"
              onClick={() => setDrawerOpen(false)}
            />
            <aside className="relative z-10 w-[276px] max-w-[85vw] border-r border-[#124236]">
              {sidebarContent}
            </aside>
          </div>
        ) : null}

        {/* Main Workspace */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex min-h-[64px] flex-wrap items-center justify-between gap-3 border-b border-[#D4E4DC] bg-[#FFFDEE] px-4 py-3 sm:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="inline-flex min-h-[40px] min-w-[40px] cursor-pointer items-center justify-center rounded-[6px] border border-[#D4E4DC] bg-white text-[#06231D] lg:hidden"
                aria-label="Buka menu navigasi"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <p className="text-[11px] font-medium text-[#2F4F46]">
                  {breadcrumb}
                </p>
                <h1 className="font-display text-lg font-extrabold tracking-[-0.02em] text-[#06231D] sm:text-xl">
                  {title}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <a
                href={PUBLIC_WEB_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-[6px] border border-[#D4E4DC] bg-white px-3.5 text-xs font-semibold text-[#06231D] hover:border-[#076653]"
              >
                <span>Lihat Web</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <span className="inline-flex min-h-[34px] items-center rounded-[6px] bg-[#E2FBCE] px-3 font-display text-[10px] font-bold text-[#076653]">
                ● ONLINE
              </span>
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1440px] flex-1 p-4 sm:p-8">
            {children}
          </main>
        </div>
      </div>

      {/* Change Password Modal */}
      {pwModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#06231D]/70 p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleChangePassword}
            className="w-full max-w-md space-y-4 rounded-[12px] border border-[#D4E4DC] bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-extrabold text-[#06231D]">
                Ubah Password Akun
              </h2>
              <button
                type="button"
                onClick={() => setPwModalOpen(false)}
                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded text-[#2F4F46] hover:bg-[#F1F5F9]"
              >
                ✕
              </button>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#06231D]">
                Password Lama
              </label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="min-h-[42px] w-full rounded-[6px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#06231D]">
                Password Baru (Min. 6 karakter)
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="min-h-[42px] w-full rounded-[6px] border border-[#D4E4DC] bg-[#FFFDEE] px-3 text-sm"
              />
            </div>
            {pwErr ? (
              <p className="rounded bg-[#FEE2E2] px-3 py-2 text-xs text-[#991B1B]">
                {pwErr}
              </p>
            ) : null}
            {pwMsg ? (
              <p className="rounded bg-[#E2FBCE] px-3 py-2 text-xs text-[#076653]">
                {pwMsg}
              </p>
            ) : null}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPwModalOpen(false)}
                className="min-h-[40px] cursor-pointer rounded-[6px] border border-[#D4E4DC] px-4 text-xs font-semibold text-[#06231D]"
              >
                Tutup
              </button>
              <button
                type="submit"
                className="min-h-[40px] cursor-pointer rounded-[6px] bg-[#076653] px-4 font-display text-xs font-bold text-[#FFFDEE]"
              >
                Simpan Password
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
