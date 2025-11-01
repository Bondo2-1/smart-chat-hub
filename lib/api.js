const API_BASE = "http://localhost:3000/api";

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
