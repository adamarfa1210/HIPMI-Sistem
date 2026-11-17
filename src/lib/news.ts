export type NewsCategory = "Kegiatan" | "Pengumuman" | "Prestasi" | "Bisnis";
export type NewsAudience = "INTERNAL" | "PUBLIC" | "BOTH";

export interface NewsArticleItem {
  id: string;
  title: string;
  category: NewsCategory;
  summary: string;
  content: string;
  imageSrc: string | null;
  imageAlt: string | null;
  slotStatus: "ready" | "pending-asset";
  targetAudience: NewsAudience;
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder?: number;
  publishedAt: string;
  createdBy: string | null;
  authorName: string | null;
  createdAt: string;
  updatedAt: string;
}

export const NEWS_CATEGORIES: NewsCategory[] = [
  "Kegiatan",
  "Pengumuman",
  "Prestasi",
  "Bisnis",
];

export const NEWS_AUDIENCE_OPTIONS: Array<{
  value: NewsAudience;
  label: string;
  badgeClass: string;
}> = [
  {
    value: "BOTH",
    label: "Internal ERP & Web UKM",
    badgeClass: "border-[#B6E8B8] bg-[#E2FBCE] text-[#076653]",
  },
  {
    value: "PUBLIC",
    label: "Khusus Web Profil UKM",
    badgeClass: "border-[#BAE6FD] bg-[#E0F2FE] text-[#075985]",
  },
  {
    value: "INTERNAL",
    label: "Khusus Internal ERP",
    badgeClass: "border-[#FDE68A] bg-[#FEF3C7] text-[#92400E]",
  },
];

export const NEWS_AUDIENCE_META: Record<
  NewsAudience,
  { label: string; shortTag: string; badgeClass: string }
> = {
  BOTH: {
    label: "Internal ERP & Web UKM",
    shortTag: "ERP & WEB",
    badgeClass: "border-[#B6E8B8] bg-[#E2FBCE] text-[#076653]",
  },
  PUBLIC: {
    label: "Khusus Web Profil UKM",
    shortTag: "WEB PROFIL",
    badgeClass: "border-[#BAE6FD] bg-[#E0F2FE] text-[#075985]",
  },
  INTERNAL: {
    label: "Khusus Internal ERP",
    shortTag: "INTERNAL ERP",
    badgeClass: "border-[#FDE68A] bg-[#FEF3C7] text-[#92400E]",
  },
};

export const NEWS_CATEGORY_BADGE: Record<NewsCategory, string> = {
  Kegiatan: "bg-[#06231D] text-[#E3EF26]",
  Pengumuman: "bg-[#FEF3C7] text-[#92400E]",
  Prestasi: "bg-[#E2FBCE] text-[#076653]",
  Bisnis: "bg-[#E0F2FE] text-[#075985]",
};
