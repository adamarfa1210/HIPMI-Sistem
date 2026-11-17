export type KaderInterestCategory =
  | "Kompetisi"
  | "Punya Bisnis"
  | "Belum Punya Bisnis"
  | "Belum Punya Bisnis tapi Minat Kompetisi";

export type KaderStatus = "Aktif" | "Non-Aktif" | "Alumni";

export interface RoleOption {
  id: string;
  name: string;
  isSystemDefault: boolean;
}

export interface KaderRecord {
  id: string;
  nim: string;
  fullName: string;
  whatsappNumber: string;
  prodi: string;
  fakultas: string;
  instagram: string | null;
  businessName: string | null;
  interestCategory: KaderInterestCategory;
  status: KaderStatus;
  totalScore: number;
  roleId: string;
  roleName: string;
  createdAt: string;
  updatedAt: string;
}

export interface KaderImportResult {
  totalProcessed: number;
  created: number;
  updated: number;
  failed: number;
  errors: Array<{ row: number; nim?: string; error: string }>;
}

export const INTEREST_CATEGORIES: KaderInterestCategory[] = [
  "Kompetisi",
  "Punya Bisnis",
  "Belum Punya Bisnis",
  "Belum Punya Bisnis tapi Minat Kompetisi",
];

export const KADER_STATUSES: KaderStatus[] = ["Aktif", "Non-Aktif", "Alumni"];

export const KADER_STATUS_META: Record<
  KaderStatus,
  { label: string; className: string }
> = {
  Aktif: {
    label: "Aktif",
    className: "border-[#A7F3D0] bg-[#E2FBCE] text-[#076653]",
  },
  "Non-Aktif": {
    label: "Non-Aktif",
    className: "border-[#FECACA] bg-[#FEE2E2] text-[#991B1B]",
  },
  Alumni: {
    label: "Alumni",
    className: "border-[#CBD5E1] bg-[#F1F5F9] text-[#2F4F46]",
  },
};

export const INTEREST_BADGE_MAP: Record<KaderInterestCategory, string> = {
  Kompetisi: "border-[#BAE6FD] bg-[#E0F2FE] text-[#075985]",
  "Punya Bisnis": "border-[#B6E8B8] bg-[#E2FBCE] text-[#076653]",
  "Belum Punya Bisnis": "border-[#CBD5E1] bg-[#F8FAFC] text-[#475569]",
  "Belum Punya Bisnis tapi Minat Kompetisi":
    "border-[#FDE68A] bg-[#FEF3C7] text-[#92400E]",
};

export function downloadKaderImportTemplateCsv(): void {
  const headers = [
    "NIM",
    "Nama Lengkap",
    "WhatsApp",
    "Prodi",
    "Fakultas",
    "Instagram",
    "Nama Bisnis",
    "Kategori Minat",
    "Status",
    "Role",
  ];
  const sampleRow = [
    "1201240001",
    "Contoh Nama Kader",
    "081234567890",
    "S1 Sistem Informasi",
    "Fakultas Rekayasa Industri",
    "@hipmipttelkom",
    "Usaha Kuliner Contoh",
    "Punya Bisnis",
    "Aktif",
    "Kader 1",
  ];
  const csv = [headers.join(","), sampleRow.join(",")].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "template-import-kader-hipmi.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
