// All calls to the backend go through this one function.
const BASE = import.meta.env.VITE_API_URL || "/api";

export async function api(path, { method = "GET", body } = {}) {
  const headers = {};
  const token = localStorage.getItem("token");
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers["Content-Type"] = "application/json";

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    let message = "Something went wrong. Please try again.";
    if (typeof data?.detail === "string") message = data.detail;
    else if (Array.isArray(data?.detail)) {
      const first = data.detail[0];
      message = `${first.loc?.slice(-1)[0] ?? "Field"}: ${first.msg}`;
    }
    throw new Error(message);
  }
  return data;
}
