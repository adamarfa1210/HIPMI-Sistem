import { apiRequest } from "./api";

export type ProkerBidang = "OKK" | "MEDKOMINFO" | "EKSTERNAL" | "EKRAF";
export type ProkerStatus = "PLANNED" | "ON_PROGRESS" | "COMPLETED";
export type AttendanceStatus = "HADIR" | "IZIN" | "SAKIT" | "ALPHA";
export type ScoreSourceType =
  | "PROKER_COMMITTEE"
  | "MEETING_ATTENDANCE"
  | "MANUAL_ADJUSTMENT";

export interface ProkerItem {
  id: string;
  bidang: ProkerBidang;
  title: string;
  picKaderId: string;
  picName: string | null;
  picNim?: string | null;
  startDate: string;
  endDate: string;
  status: ProkerStatus;
  createdAt: string;
}

export interface ProkerCommitteeItem {
  id: string;
  prokerId: string;
  kaderId: string;
  committeeRole: string;
  pointsAwarded: number;
  createdAt: string;
  kaderName: string | null;
  nim: string | null;
  prodi: string | null;
}

export interface MeetingItem {
  id: string;
  prokerId: string | null;
  prokerTitle?: string | null;
  prokerBidang?: ProkerBidang | null;
  title: string;
  meetingDate: string;
  pointsPerAttendance: number;
  createdAt: string;
  attendanceCount?: number;
  hadirCount?: number;
}

export interface ProkerDetail extends ProkerItem {
  committees: ProkerCommitteeItem[];
  meetings: MeetingItem[];
}

export interface MeetingAttendanceItem {
  id: string;
  meetingId: string;
  kaderId: string;
  status: AttendanceStatus;
  pointsAwarded: number;
  createdAt: string;
  kaderName: string | null;
  nim: string | null;
}

export interface MeetingDetail extends MeetingItem {
  attendances: MeetingAttendanceItem[];
}

export interface KaderOption {
  id: string;
  nim: string;
  fullName: string;
  prodi?: string;
  roleName?: string;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  nim: string;
  fullName: string;
  prodi: string;
  role: string;
  totalScore: number;
}

export interface CurrentUserRank {
  rank: number;
  id: string;
  fullName: string;
  totalScore: number;
}

export interface ScoreLedgerEntry {
  id: string;
  kaderId: string;
  sourceType: ScoreSourceType;
  sourceId: string;
  points: number;
  description: string;
  createdAt: string;
}

export interface CadreLedgerResponse {
  kader: {
    id: string;
    nim: string;
    fullName: string;
    prodi: string;
    status: string;
    totalScore: number;
  };
  ledgers: ScoreLedgerEntry[];
}

export const BIDANG_OPTIONS: Array<{ value: ProkerBidang; label: string }> = [
  { value: "OKK", label: "OKK (Organisasi & Kaderisasi)" },
  { value: "MEDKOMINFO", label: "MEDKOMINFO (Media & Komunikasi)" },
  { value: "EKSTERNAL", label: "EKSTERNAL (Relasi & Kemitraan)" },
  { value: "EKRAF", label: "EKRAF (Ekonomi Kreatif & Bisnis)" },
];

export const BIDANG_BADGE_MAP: Record<ProkerBidang, string> = {
  OKK: "bg-[#E2FBCE] text-[#076653] border-[#B6E8B8]",
  MEDKOMINFO: "bg-[#E0F2FE] text-[#075985] border-[#BAE6FD]",
  EKSTERNAL: "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]",
  EKRAF: "bg-[#FCE7F3] text-[#9D174D] border-[#FBCFE8]",
};

export const PROKER_STATUS_META: Record<
  ProkerStatus,
  { label: string; className: string }
> = {
  PLANNED: {
    label: "Terencana",
    className: "bg-[#F1F5F9] text-[#334155] border-[#CBD5E1]",
  },
  ON_PROGRESS: {
    label: "Berjalan",
    className: "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]",
  },
  COMPLETED: {
    label: "Selesai",
    className: "bg-[#E2FBCE] text-[#076653] border-[#B6E8B8]",
  },
};

export const ATTENDANCE_STATUS_META: Record<
  AttendanceStatus,
  { label: string; activeClass: string }
> = {
  HADIR: {
    label: "HADIR",
    activeClass: "border-[#076653] bg-[#076653] text-white",
  },
  IZIN: {
    label: "IZIN",
    activeClass: "border-[#D97706] bg-[#D97706] text-white",
  },
  SAKIT: {
    label: "SAKIT",
    activeClass: "border-[#0284C7] bg-[#0284C7] text-white",
  },
  ALPHA: {
    label: "ALPHA",
    activeClass: "border-[#DC2626] bg-[#DC2626] text-white",
  },
};

export const SCORE_SOURCE_META: Record<
  ScoreSourceType,
  { label: string; className: string }
> = {
  PROKER_COMMITTEE: {
    label: "Kepanitiaan Proker",
    className: "bg-[#E2FBCE] text-[#076653] border-[#B6E8B8]",
  },
  MEETING_ATTENDANCE: {
    label: "Presensi Rapat",
    className: "bg-[#E0F2FE] text-[#075985] border-[#BAE6FD]",
  },
  MANUAL_ADJUSTMENT: {
    label: "Penyesuaian Manual",
    className: "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]",
  },
};

export function formatDateId(value: string | null | undefined): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatDateTimeId(value: string | null | undefined): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/**
 * Loads active kader choices for PIC, committee assignment, and meeting attendance.
 * Falls back to `/api/leaderboard` if the caller role lacks `kaders:read`.
 */
export async function fetchActiveKaderOptions(): Promise<KaderOption[]> {
  try {
    const kaders = await apiRequest<KaderOption[]>(
      "/api/kaders?status=Aktif&limit=100&sortBy=fullName&sortOrder=asc"
    );
    if (Array.isArray(kaders)) return kaders;
  } catch {
    // Fallback below when role has tracking permission without kaders:read.
  }

  try {
    const lb = await apiRequest<{ leaderboard: LeaderboardEntry[] }>(
      "/api/leaderboard?page=1&limit=100"
    );
    return (lb.leaderboard || []).map((k) => ({
      id: k.id,
      nim: k.nim,
      fullName: k.fullName,
      prodi: k.prodi,
      roleName: k.role,
    }));
  } catch {
    return [];
  }
}
