export type CalendarCategory =
  | "PROKER"
  | "INTERNAL_MEETING"
  | "RBPL"
  | "COMPETITION_DEADLINE"
  | "ORGANIZATION_HOLIDAY";

export interface CalendarRoleOption {
  id: string;
  name: string;
  isSystemDefault?: boolean;
}

export interface CalendarEventItem {
  id: string;
  prokerId: string | null;
  prokerTitle: string | null;
  title: string;
  category: CalendarCategory;
  startAt: string;
  endAt: string;
  location: string;
  isPublic: boolean;
  googleEventId: string | null;
  createdBy: string | null;
  createdByName: string | null;
  enableQrAttendance: boolean;
  pointsPerAttendance: number;
  qrIsOpen: boolean;
  meetingId: string | null;
  targetRoles: CalendarRoleOption[];
  canManageQr: boolean;
  qrPayload: string | null;
  myAttendanceStatus: string | null;
  createdAt: string;
}

export interface CalendarAttendanceRow {
  no: number;
  kaderId: string;
  nim: string;
  fullName: string;
  roleId: string;
  roleName: string;
  status: string;
  pointsAwarded: number;
  attendedAt: string | null;
}

export interface CalendarAttendanceData {
  eventId: string;
  title: string;
  category: CalendarCategory;
  pointsPerAttendance: number;
  qrIsOpen: boolean;
  canManageQr: boolean;
  totalEligible: number;
  totalHadir: number;
  totalBelumHadir: number;
  rows: CalendarAttendanceRow[];
}

export interface QrScanResult {
  type: string;
  eventId?: string;
  eventTitle?: string;
  category?: CalendarCategory;
  status?: string;
  alreadyAttended?: boolean;
  pointsAwarded?: number;
  attendedAt?: string;
  message: string;
}

export const CALENDAR_CATEGORIES: CalendarCategory[] = [
  "PROKER",
  "INTERNAL_MEETING",
  "RBPL",
  "COMPETITION_DEADLINE",
  "ORGANIZATION_HOLIDAY",
];

export const CALENDAR_CATEGORY_META: Record<
  CalendarCategory,
  { label: string; badgeClass: string; chipClass: string; dotClass: string }
> = {
  PROKER: {
    label: "Program Kerja",
    badgeClass: "border-[#B6E8B8] bg-[#E2FBCE] text-[#076653]",
    chipClass: "bg-[#E2FBCE] text-[#06231D] border-[#A7F3D0]",
    dotClass: "bg-[#076653]",
  },
  INTERNAL_MEETING: {
    label: "Rapat Internal",
    badgeClass: "border-[#BAE6FD] bg-[#E0F2FE] text-[#075985]",
    chipClass: "bg-[#E0F2FE] text-[#075985] border-[#BAE6FD]",
    dotClass: "bg-[#0284C7]",
  },
  RBPL: {
    label: "RBPL (Rapat Pengurus)",
    badgeClass: "border-[#06231D]/30 bg-[#06231D] text-[#E3EF26]",
    chipClass: "bg-[#06231D] text-[#E3EF26] border-[#06231D]",
    dotClass: "bg-[#06231D]",
  },
  COMPETITION_DEADLINE: {
    label: "Deadline Kompetisi",
    badgeClass: "border-[#FECACA] bg-[#FEE2E2] text-[#991B1B]",
    chipClass: "bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]",
    dotClass: "bg-[#DC2626]",
  },
  ORGANIZATION_HOLIDAY: {
    label: "Hari Besar Organisasi",
    badgeClass: "border-[#FDE68A] bg-[#FEF3C7] text-[#92400E]",
    chipClass: "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]",
    dotClass: "bg-[#D97706]",
  },
};

export const WEEKDAY_LABELS = [
  "Sen",
  "Sel",
  "Rab",
  "Kam",
  "Jum",
  "Sab",
  "Min",
];

export function formatMonthYearId(year: number, monthIndex: number): string {
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, monthIndex, 1));
}

export function formatDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function toLocalDateTimeInput(iso?: string): string {
  const date = iso ? new Date(iso) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

/**
 * Generates 35 or 42 day cells for a Monday-first month grid.
 */
export function buildMonthGridDays(year: number, monthIndex: number): Date[] {
  const firstDay = new Date(year, monthIndex, 1);
  // JS Sunday=0 -> Monday=0 offset
  const startOffset = (firstDay.getDay() + 6) % 7;
  const gridStart = new Date(year, monthIndex, 1 - startOffset);

  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const totalCells = startOffset + daysInMonth > 35 ? 42 : 35;

  const cells: Date[] = [];
  for (let i = 0; i < totalCells; i++) {
    cells.push(
      new Date(
        gridStart.getFullYear(),
        gridStart.getMonth(),
        gridStart.getDate() + i
      )
    );
  }
  return cells;
}

export function eventOccursOnDay(event: CalendarEventItem, dayKey: string): boolean {
  const startKey = formatDayKey(new Date(event.startAt));
  const endKey = formatDayKey(new Date(event.endAt));
  return dayKey >= startKey && dayKey <= endKey;
}
