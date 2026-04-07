const API_BASE = "http://localhost:3000/api";

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem("mechadex_token");
  }

  private headers(multipart = false): HeadersInit {
    const h: HeadersInit = {};
    const token = this.getToken();
    if (token) h["Authorization"] = `Bearer ${token}`;
    if (!multipart) h["Content-Type"] = "application/json";
    return h;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, options);
    if (res.status === 401) {
      localStorage.removeItem("mechadex_token");
      localStorage.removeItem("mechadex_user");
      window.location.href = "/auth";
      throw new Error("Session expired");
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({ message: "Something went wrong" }));
      throw new Error(data.message || `Error ${res.status}`);
    }
    return res.json();
  }

  get<T>(path: string) {
    return this.request<T>(path, { headers: this.headers() });
  }

  post<T>(path: string, body: unknown) {
    return this.request<T>(path, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
    });
  }

  put<T>(path: string, body: unknown) {
    return this.request<T>(path, {
      method: "PUT",
      headers: this.headers(),
      body: JSON.stringify(body),
    });
  }

  delete<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: "DELETE",
      headers: this.headers(),
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async upload<T>(path: string, formData: FormData, method: "POST" | "PUT" = "POST") {
    return this.request<T>(path, {
      method,
      headers: this.headers(true),
      body: formData,
    });
  }
}

export const api = new ApiClient();
export const getImageUrl = (path: string | null | undefined) => {
  if (!path) return "/placeholder.svg";
  if (path.startsWith("http")) return path;
  return `http://localhost:3000${path}`;
};
