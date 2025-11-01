// Dynamically detect correct API base URL
const API_BASE =
  typeof window !== "undefined"
    ? `${window.location.origin}/api`
    : process.env.NEXT_PUBLIC_BASE_URL
    ? `${process.env.NEXT_PUBLIC_BASE_URL}/api`
    : "http://localhost:3000/api";

export async function apiRequest(path, method = "GET", body, token) {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      ...(body && { body: JSON.stringify(body) }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage = payload?.error || "Request failed";
      return {
        ...payload,
        error: errorMessage,
        ok: false,
        status: response.status,
      };
    }

    return {
      ...payload,
      ok: true,
      status: response.status,
    };
  } catch (error) {
    return {
      error: error.message || "Network error",
      ok: false,
      status: 0,
    };
  }
}
