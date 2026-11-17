"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Award,
  Crown,
  History,
  Medal,
  Search,
  Trophy,
  X,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { apiRequest, apiRequestWithMeta, type ApiMeta } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  SCORE_SOURCE_META,
  formatDateTimeId,
  type CadreLedgerResponse,
  type CurrentUserRank,
  type LeaderboardEntry,
} from "@/lib/tracking";

const PODIUM_STYLES = [
  {
    rankLabel: "PERINGKAT #1",
    wrapper: "border-[#E3EF26] bg-[#06231D] text-[#FFFDEE] shadow-md",
    scoreClass: "text-[#E3EF26]",
    subClass: "text-[#C7DCD2]",
    Icon: Crown,
  },
  {
    rankLabel: "PERINGKAT #2",
    wrapper: "border-[#076653] bg-[#0C342C] text-[#FFFDEE]",
    scoreClass: "text-[#E2FBCE]",
    subClass: "text-[#C7DCD2]",
    Icon: Medal,
  },
  {
    rankLabel: "PERINGKAT #3",
    wrapper: "border-[#D4E4DC] bg-white text-[#06231D]",
    scoreClass: "text-[#076653]",
    subClass: "text-[#64748B]",
    Icon: Award,
  },
];

export default function LeaderboardPage() {
  const { user, can } = useAuth();
  const canRead = can("leaderboard", "read");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<CurrentUserRank | null>(
    null
  );
  const [meta, setMeta] = useState<ApiMeta>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Audit Ledger Drawer State
  const [ledgerKaderId, setLedgerKaderId] = useState<string | null>(null);
  const [ledgerData, setLedgerData] = useState<CadreLedgerResponse | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerError, setLedgerError] = useState<string | null>(null);

  const loadLeaderboard = useCallback(async () => {
    if (!canRead) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequestWithMeta<{
        leaderboard: LeaderboardEntry[];
        currentUserRank: CurrentUserRank | null;
      }>(`/api/leaderboard?page=${page}&limit=50`);
      setEntries(res.data?.leaderboard || []);
      setCurrentUserRank(res.data?.currentUserRank ?? null);
      setMeta(res.meta);
    } catch (err: any) {
      setError(err?.message || "Gagal memuat data leaderboard");
    } finally {
      setLoading(false);
    }
  }, [canRead, page]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const openLedger = async (kaderId: string) => {
    setLedgerKaderId(kaderId);
    setLedgerData(null);
    setLedgerError(null);
    setLedgerLoading(true);
    try {
      const res = await apiRequest<CadreLedgerResponse>(
        `/api/leaderboard/kaders/${kaderId}/ledger`
      );
      setLedgerData(res);
    } catch (err: any) {
      setLedgerError(err?.message || "Gagal memuat riwayat poin kader");
    } finally {
      setLedgerLoading(false);
    }
  };

  const filteredEntries = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.fullName.toLowerCase().includes(q) ||
        e.nim.toLowerCase().includes(q) ||
        e.prodi.toLowerCase().includes(q) ||
        e.role.toLowerCase().includes(q)
    );
  }, [entries, search]);

  const podiumItems = page === 1 && !search.trim() ? entries.slice(0, 3) : [];

  return (
    <AppShell
      title="Leaderboard & Audit Poin Kader"
      breadcrumb="Operasional ERP / Leaderboard Poin"
    >
      <div className="space-y-6">
        {!canRead ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
            Akun Anda tidak memiliki izin <code>leaderboard:read</code>.
          </div>
        ) : (
          <>
            {error ? (
              <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-800">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            ) : null}

            {/* Current User Rank Hero Strip */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#124236] bg-[#06231D] p-5 text-[#FFFDEE] shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0C342C] text-[#E3EF26]">
                  <Trophy className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-display text-[10px] font-bold uppercase tracking-[0.08em] text-[#E3EF26]">
                    POSISI SKOR ANDA SAAT INI
                  </p>
                  {currentUserRank ? (
                    <p className="mt-0.5 font-display text-lg font-extrabold">
                      Peringkat #{currentUserRank.rank} — {currentUserRank.fullName}
                    </p>
                  ) : (
                    <p className="mt-0.5 font-display text-base font-bold">
                      {user?.fullName || "Akun Aktif"} (Belum masuk peringkat aktif)
                    </p>
                  )}
                  <p className="mt-0.5 text-xs text-[#C7DCD2]">
                    Akumulasi transparan dari kepanitiaan proker dan presensi rapat.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {currentUserRank ? (
                  <div className="text-right">
                    <p className="text-[11px] text-[#C7DCD2]">Total Poin</p>
                    <p className="font-display text-2xl font-extrabold tabular-nums text-[#E3EF26]">
                      {currentUserRank.totalScore} pts
                    </p>
                  </div>
                ) : null}
                {user ? (
                  <button
                    type="button"
                    onClick={() => openLedger(user.id)}
                    className="inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-[8px] border border-[#E3EF26] bg-[#09352C] px-3.5 text-xs font-bold text-[#FFFDEE] transition hover:bg-[#E3EF26] hover:text-[#06231D]"
                  >
                    <History className="h-4 w-4" />
                    Audit Poin Saya
                  </button>
                ) : null}
              </div>
            </div>

            {/* Top 3 Podium Cards */}
            {podiumItems.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-3">
                {podiumItems.map((item, idx) => {
                  const style = PODIUM_STYLES[idx] || PODIUM_STYLES[2];
                  const Icon = style.Icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => openLedger(item.id)}
                      className={`cursor-pointer rounded-2xl border p-5 text-left transition hover:scale-[1.01] ${style.wrapper}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-display text-[10px] font-bold tracking-[0.08em] text-[#E3EF26]">
                          {style.rankLabel}
                        </span>
                        <Icon className={`h-5 w-5 ${style.scoreClass}`} />
                      </div>
                      <p className="mt-3 font-display text-base font-extrabold">
                        {item.fullName}
                      </p>
                      <p className={`mt-0.5 text-xs ${style.subClass}`}>
                        NIM {item.nim} • {item.role}
                      </p>
                      <p className={`mt-0.5 text-xs ${style.subClass}`}>
                        {item.prodi}
                      </p>
                      <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                        <span className={`font-display text-2xl font-extrabold tabular-nums ${style.scoreClass}`}>
                          {item.totalScore} pts
                        </span>
                        <span className="text-[11px] font-semibold underline opacity-90">
                          Lihat Ledger →
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {/* Ranked Leaderboard Table */}
            <div className="rounded-2xl border border-[#D4E4DC] bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-base font-extrabold text-[#06231D]">
                    Peringkat Kader Aktif
                  </h2>
                  <p className="text-xs text-[#64748B] tabular-nums">
                    Total {meta.total} kader aktif terdaftar dalam pemeringkatan.
                  </p>
                </div>

                <div className="relative min-w-[240px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari nama, NIM, prodi, role..."
                    className="min-h-[40px] w-full rounded-[8px] border border-[#D4E4DC] bg-[#FFFDEE] pl-9 pr-3 text-xs text-[#06231D]"
                  />
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#D4E4DC] border-t-[#076653]" />
                </div>
              ) : filteredEntries.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#CBD5E1] py-10 text-center text-xs text-[#64748B]">
                  Tidak ada data kader yang sesuai.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#E2E8F0] text-[11px] uppercase tracking-wider text-[#64748B]">
                        <th className="py-2.5 pr-4">Peringkat</th>
                        <th className="py-2.5 pr-4">Kader</th>
                        <th className="py-2.5 pr-4">Prodi</th>
                        <th className="py-2.5 pr-4">Role</th>
                        <th className="py-2.5 pr-4 text-right">Total Skor</th>
                        <th className="py-2.5 text-right">Transparansi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      {filteredEntries.map((row) => {
                        const isSelf = row.id === user?.id;
                        return (
                          <tr
                            key={row.id}
                            className={isSelf ? "bg-[#E2FBCE]/30" : undefined}
                          >
                            <td className="py-3 pr-4">
                              <span
                                className={`inline-flex min-w-[34px] items-center justify-center rounded-full px-2.5 py-1 font-display text-xs font-extrabold tabular-nums ${
                                  row.rank <= 3
                                    ? "bg-[#06231D] text-[#E3EF26]"
                                    : "bg-[#F1F5F9] text-[#334155]"
                                }`}
                              >
                                #{row.rank}
                              </span>
                            </td>
                            <td className="py-3 pr-4">
                              <p className="font-bold text-[#06231D]">
                                {row.fullName}
                                {isSelf ? (
                                  <span className="ml-1.5 rounded bg-[#076653] px-1.5 py-0.5 text-[10px] text-white">
                                    Anda
                                  </span>
                                ) : null}
                              </p>
                              <p className="text-[11px] text-[#64748B] tabular-nums">
                                NIM {row.nim}
                              </p>
                            </td>
                            <td className="py-3 pr-4 text-[#475569]">{row.prodi}</td>
                            <td className="py-3 pr-4">
                              <span className="rounded-full border border-[#D4E4DC] bg-[#FFFDEE] px-2.5 py-0.5 text-[11px] font-semibold text-[#06231D]">
                                {row.role}
                              </span>
                            </td>
                            <td className="py-3 pr-4 text-right font-display text-sm font-extrabold tabular-nums text-[#076653]">
                              {row.totalScore}
                            </td>
                            <td className="py-3 text-right">
                              <button
                                type="button"
                                onClick={() => openLedger(row.id)}
                                className="inline-flex min-h-[34px] cursor-pointer items-center gap-1.5 rounded-[8px] border border-[#D4E4DC] bg-white px-3 text-xs font-semibold text-[#06231D] hover:border-[#076653] hover:text-[#076653]"
                              >
                                <History className="h-3.5 w-3.5" />
                                Audit Ledger
                              </button>
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

      {/* Audit Ledger Modal */}
      {ledgerKaderId ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#06231D]/75 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-[14px] border border-[#D4E4DC] bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#E2E8F0] bg-[#06231D] px-6 py-4 text-[#FFFDEE]">
              <div>
                <p className="font-display text-[10px] font-bold uppercase tracking-[0.08em] text-[#E3EF26]">
                  TRANSPARANSI AUDIT SCORE LEDGER
                </p>
                <h3 className="mt-0.5 font-display text-base font-extrabold">
                  {ledgerData?.kader.fullName || "Memuat Audit Poin..."}
                </h3>
                {ledgerData ? (
                  <p className="mt-1 text-xs text-[#C7DCD2]">
                    NIM {ledgerData.kader.nim} • {ledgerData.kader.prodi} • Total Skor:{" "}
                    <strong className="tabular-nums text-[#E3EF26]">
                      {ledgerData.kader.totalScore} pts
                    </strong>
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setLedgerKaderId(null)}
                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded text-[#C7DCD2] hover:bg-[#0C342C] hover:text-white"
                aria-label="Tutup audit ledger"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-6">
              {ledgerLoading ? (
                <div className="flex justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#D4E4DC] border-t-[#076653]" />
                </div>
              ) : ledgerError ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
                  {ledgerError}
                </p>
              ) : !ledgerData || ledgerData.ledgers.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#CBD5E1] py-10 text-center text-xs text-[#64748B]">
                  Belum ada catatan mutasi poin pada <code>score_ledgers</code> untuk kader ini.
                </div>
              ) : (
                <div className="divide-y divide-[#E2E8F0] rounded-xl border border-[#E2E8F0]">
                  {ledgerData.ledgers.map((item) => {
                    const sourceMeta =
                      SCORE_SOURCE_META[item.sourceType] ??
                      SCORE_SOURCE_META.MANUAL_ADJUSTMENT;
                    const isNegative = item.points < 0;
                    return (
                      <div
                        key={item.id}
                        className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${sourceMeta.className}`}
                            >
                              {sourceMeta.label}
                            </span>
                            <span className="text-[11px] text-[#64748B] tabular-nums">
                              {formatDateTimeId(item.createdAt)}
                            </span>
                          </div>
                          <p className="mt-1 text-xs font-semibold text-[#06231D]">
                            {item.description}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 font-display text-xs font-extrabold tabular-nums ${
                            isNegative
                              ? "bg-red-100 text-red-700"
                              : "bg-[#E2FBCE] text-[#076653]"
                          }`}
                        >
                          {item.points > 0 ? `+${item.points}` : item.points} pts
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-[#E2E8F0] bg-[#F8FAFC] px-6 py-3.5">
              <button
                type="button"
                onClick={() => setLedgerKaderId(null)}
                className="min-h-[38px] cursor-pointer rounded-[8px] border border-[#D4E4DC] bg-white px-4 text-xs font-semibold text-[#06231D]"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
