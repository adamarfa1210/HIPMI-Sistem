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

export interface AuthUserProfile {
  id: string;
  nim: string;
  fullName: string;
  roleId: string;
  roleName: string;
  status: string;
  totalScore?: number;
  permissions: Record<string, PermissionEntry>;
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
