const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

if (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL não definida em produção");
}

export const api = {
  async fetch(endpoint: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers);

    // JSON padrão
    if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    // Token (client ou server)
    let token: string | null = null;

    if (typeof window !== "undefined") {
      token = localStorage.getItem("vitta_token");
    } else {
      try {
        const { cookies } = await import("next/headers");
        const cookieStore = cookies();
        token = cookieStore.get("vitta_token")?.value || null;
      } catch { }
    }

    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const isJson = response.headers.get("content-type")?.includes("application/json");
    const data = isJson ? await response.json() : null;

    if (!response.ok) {
      throw new Error(
        data?.message || "Erro na requisição",
        { cause: response.status }
      );
    }

    return { data, response };
  },

  get(endpoint: string, options?: RequestInit) {
    return this.fetch(endpoint, { ...options, method: "GET" });
  },

  post(endpoint: string, body: unknown, options?: RequestInit) {
    return this.fetch(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  put(endpoint: string, body: unknown, options?: RequestInit) {
    return this.fetch(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  delete(endpoint: string, options?: RequestInit) {
    return this.fetch(endpoint, { ...options, method: "DELETE" });
  },
};