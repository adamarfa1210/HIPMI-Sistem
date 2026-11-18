const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

export const TOKEN_KEY = "hipmi_erp_token";

export interface PermissionEntry {
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
  approve: boolean;
}

export interface RawPermissionEntry {
  moduleId?: string;
  moduleCode?: string;
  moduleLabel?: string;
  canRead?: boolean;
  canCreate?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
  canApprove?: boolean;
  read?: boolean;
  create?: boolean;
  update?: boolean;
  delete?: boolean;
  approve?: boolean;
}

export type RawPermissionsInput =
  | RawPermissionEntry[]
  | Record<string, Partial<PermissionEntry> & Partial<RawPermissionEntry>>
  | null
  | undefined;

export type OnboardingMode = "none" | "complete-profile" | "reset-password";

export interface AuthUserProfile {
  id: string;
  nim: string;
  fullName: string;
  roleId: string;
  roleName: string;
  roleCode?: string;
  status: string;
  totalScore?: number;
  profileCompleted?: boolean;
  onboardingMode?: OnboardingMode;
  whatsappNumber?: string | null;
  prodi?: string | null;
  fakultas?: string | null;
  instagram?: string | null;
  businessName?: string | null;
  interestCategory?: string | null;
  permissions: Record<string, PermissionEntry>;
}

export interface RawAuthPayload {
  accessToken?: string;
  user?: Partial<AuthUserProfile> & {
    permissions?: RawPermissionsInput;
  };
  role?: {
    id?: string;
    name?: string;
    code?: string;
  };
  permissions?: RawPermissionsInput;
  totalScore?: number;
  profileCompleted?: boolean;
  onboardingMode?: OnboardingMode;
  id?: string;
  nim?: string;
  fullName?: string;
  roleId?: string;
  roleName?: string;
  roleCode?: string;
  status?: string;
  whatsappNumber?: string | null;
  prodi?: string | null;
  fakultas?: string | null;
  instagram?: string | null;
  businessName?: string | null;
  interestCategory?: string | null;
}

function toPermissionEntry(
  raw: Partial<PermissionEntry> & Partial<RawPermissionEntry>
): PermissionEntry {
  return {
    read: Boolean(raw.read ?? raw.canRead),
    create: Boolean(raw.create ?? raw.canCreate),
    update: Boolean(raw.update ?? raw.canUpdate),
    delete: Boolean(raw.delete ?? raw.canDelete),
    approve: Boolean(raw.approve ?? raw.canApprove),
  };
}

export function normalizePermissions(
  raw: RawPermissionsInput
): Record<string, PermissionEntry> {
  if (!raw) return {};

  if (Array.isArray(raw)) {
    const normalized: Record<string, PermissionEntry> = {};
    for (const item of raw) {
      if (item && typeof item.moduleCode === "string") {
        const moduleCode = item.moduleCode.trim();
        if (moduleCode) {
          normalized[moduleCode] = toPermissionEntry(item);
        }
      }
    }
    return normalized;
  }

  if (typeof raw === "object") {
    const normalized: Record<string, PermissionEntry> = {};
    for (const [rawCode, entry] of Object.entries(raw)) {
      const moduleCode = rawCode.trim();
      if (
        moduleCode &&
        entry &&
        typeof entry === "object" &&
        !Array.isArray(entry)
      ) {
        normalized[moduleCode] = toPermissionEntry(entry);
      }
    }
    return normalized;
  }

  return {};
}

export function normalizeAuthUser(payload: RawAuthPayload): AuthUserProfile {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Respons profil pengguna tidak valid");
  }

  const rawUser =
    payload.user && typeof payload.user === "object" && !Array.isArray(payload.user)
      ? payload.user
      : payload;

  if (!rawUser || (!rawUser.id && !rawUser.nim)) {
    throw new Error("Respons profil pengguna tidak valid");
  }

  const roleName = String(rawUser.roleName || payload.role?.name || "").trim();
  const roleId = String(rawUser.roleId || payload.role?.id || "").trim();
  const rawRoleCode = String(
    rawUser.roleCode || payload.role?.code || ""
  ).trim();
  const roleCode =
    rawRoleCode ||
    (roleName ? roleName.toLowerCase().replace(/\s+/g, "_") : undefined);

  return {
    id: String(rawUser.id ?? ""),
    nim: String(rawUser.nim ?? ""),
    fullName: String(rawUser.fullName ?? ""),
    roleId,
    roleName,
    roleCode,
    status: String(rawUser.status ?? "Aktif"),
    totalScore: rawUser.totalScore ?? payload.totalScore,
    profileCompleted: rawUser.profileCompleted ?? payload.profileCompleted ?? true,
    onboardingMode: rawUser.onboardingMode ?? payload.onboardingMode ?? "none",
    whatsappNumber: rawUser.whatsappNumber,
    prodi: rawUser.prodi,
    fakultas: rawUser.fakultas,
    instagram: rawUser.instagram,
    businessName: rawUser.businessName,
    interestCategory: rawUser.interestCategory,
    permissions: normalizePermissions(
      payload.permissions ?? rawUser.permissions
    ),
  };
}

export function getDefaultLandingRoute(user: AuthUserProfile | null): string {
  if (!user) return "/login";
  if (user.onboardingMode && user.onboardingMode !== "none") {
    return "/lengkapi-akun";
  }
  const routePriority: Array<[string, string]> = [
    ["cms", "/cms"],
    ["kaders", "/kader"],
    ["news", "/berita"],
    ["tracking", "/proker"],
    ["leaderboard", "/leaderboard"],
    ["calendar", "/kalender"],
    ["finance-request", "/keuangan/pengajuan"],
    ["finance", "/keuangan"],
    ["profile", "/profil"],
    ["password-reset", "/reset-password"],
    ["news-manage", "/berita/kelola"],
    ["admin-rbac", "/settings"],
  ];
  for (const [mod, route] of routePriority) {
    if (hasPermission(user, mod, "read")) return route;
  }
  return "/berita";
}

export function hasPermission(
  user: AuthUserProfile | null,
  moduleCode: string,
  action: keyof PermissionEntry
): boolean {
  if (!user) return false;
  if (
    user.roleName.trim().toLowerCase() === "admin" ||
    user.roleCode?.trim().toLowerCase() === "admin"
  ) {
    return true;
  }
  return Boolean(user.permissions?.[moduleCode]?.[action]);
}

export interface ApiMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: ApiMeta;
  error?: {
    code: string;
    message: string;
    details?: { field: string; message: string }[];
  };
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function executeApiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });
  } catch (err) {
    if (options.body instanceof FormData) {
      throw new Error(
        "Gagal mengunggah file ke server (koneksi terputus atau ukuran file melebihi batas gateway 4,5 MB). Coba kompres ulang atau periksa jaringan Anda."
      );
    }
    throw new Error(
      err instanceof Error && err.message && err.message !== "Failed to fetch"
        ? err.message
        : "Gagal terhubung ke server API. Periksa koneksi internet Anda lalu coba lagi."
    );
  }

  const json = (await res.json().catch(() => ({}))) as ApiResponse<T>;
  if (!res.ok || !json.success) {
    const errMsg =
      json?.error?.message ||
      json?.message ||
      `Permintaan gagal (${res.status})`;
    throw new Error(errMsg);
  }

  return json;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const json = await executeApiRequest<T>(path, options);
  return json.data;
}

export async function apiRequestWithMeta<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T; meta: ApiMeta }> {
  const json = await executeApiRequest<T>(path, options);
  return {
    data: json.data,
    meta: json.meta ?? {
      page: 1,
      limit: 20,
      total: Array.isArray(json.data) ? json.data.length : 0,
      totalPages: 1,
    },
  };
}

export interface MediaUploadResult {
  key: string;
  url: string;
  size: number;
  width: number;
  height: number;
  contentType: string;
}

export async function uploadMediaFile(params: {
  file: Blob;
  filename: string;
  slot: string;
  imageAlt?: string;
}): Promise<MediaUploadResult> {
  const form = new FormData();
  form.append("file", params.file, params.filename);
  form.append("slot", params.slot);
  if (params.imageAlt) {
    form.append("imageAlt", params.imageAlt);
  }

  return apiRequest<MediaUploadResult>("/api/media/upload", {
    method: "POST",
    body: form,
  });
}

export async function apiDownloadBlob(
  path: string
): Promise<{ blob: Blob; filename: string | null }> {
  const token = getStoredToken();
  const headers = new Headers();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    headers,
  });

  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as ApiResponse<unknown>;
    throw new Error(
      json?.error?.message ||
        json?.message ||
        `Gagal mengunduh berkas (${res.status})`
    );
  }

  const disposition = res.headers.get("Content-Disposition") || "";
  const match = /filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i.exec(disposition);
  const blob = await res.blob();
  return {
    blob,
    filename: match ? decodeURIComponent(match[1]) : null,
  };
}
