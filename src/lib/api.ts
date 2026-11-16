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

export interface AuthUserProfile {
  id: string;
  nim: string;
  fullName: string;
  roleId: string;
  roleName: string;
  roleCode?: string;
  status: string;
  totalScore?: number;
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
      if (item && typeof item.moduleCode === "string" && item.moduleCode.trim()) {
        normalized[item.moduleCode] = toPermissionEntry(item);
      }
    }
    return normalized;
  }

  if (typeof raw === "object") {
    const normalized: Record<string, PermissionEntry> = {};
    for (const [moduleCode, entry] of Object.entries(raw)) {
      if (entry && typeof entry === "object") {
        normalized[moduleCode] = toPermissionEntry(entry);
      }
    }
    return normalized;
  }

  return {};
}

export function normalizeAuthUser(payload: RawAuthPayload): AuthUserProfile {
  if (!payload || typeof payload !== "object") {
    throw new Error("Respons profil pengguna tidak valid");
  }

  const rawUser =
    payload.user && typeof payload.user === "object" ? payload.user : payload;

  if (!rawUser || (!rawUser.id && !rawUser.nim)) {
    throw new Error("Respons profil pengguna tidak valid");
  }

  const roleName = String(rawUser.roleName || payload.role?.name || "");
  const roleId = String(rawUser.roleId || payload.role?.id || "");
  const roleCode =
    rawUser.roleCode ||
    payload.role?.code ||
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

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
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

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const json = (await res.json().catch(() => ({}))) as ApiResponse<T>;
  if (!res.ok || !json.success) {
    const errMsg =
      json?.error?.message ||
      json?.message ||
      `Permintaan gagal (${res.status})`;
    throw new Error(errMsg);
  }

  return json.data;
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
