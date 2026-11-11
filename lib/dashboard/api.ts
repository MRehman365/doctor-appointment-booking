export type ApiSuccess<T> = { success: true; data: T };
export type ApiFailure = { success: false; error?: string; code?: string };
export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

export class ApiClientError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function apiFetch<T>(
  input: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    credentials: "include",
  });

  let json: ApiResult<T> | null = null;
  try {
    json = (await res.json()) as ApiResult<T>;
  } catch {
    throw new ApiClientError("Invalid server response", res.status);
  }

  if (!res.ok || !json || !json.success) {
    throw new ApiClientError(
      (json && "error" in json && json.error) || "Request failed",
      res.status,
      json && "code" in json ? json.code : undefined,
    );
  }

  return json.data;
}

export type SessionUser = {
  userId: string;
  role: "admin" | "doctor" | "receptionist";
  doctorId?: string;
  name: string;
  email: string;
};

export function roleHome(role: SessionUser["role"]) {
  if (role === "admin") return "/dashboard/admin";
  if (role === "doctor") return "/dashboard/doctor";
  return "/dashboard/reception";
}
