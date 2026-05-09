const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function req(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...opts.headers },
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  register: (username: string, password: string) =>
    req("/api/accounts/register/", { method: "POST", body: JSON.stringify({ username, password }) }),

  login: (username: string, password: string) =>
    req("/api/accounts/login/", { method: "POST", body: JSON.stringify({ username, password }) }),

  logout: () => req("/api/accounts/logout/", { method: "POST" }),

  me: () => req("/api/accounts/me/"),

  createGame: (num_decks: number) =>
    req("/api/game/create/", { method: "POST", body: JSON.stringify({ num_decks }) }),

  joinGame: (code: string) =>
    req("/api/game/join/", { method: "POST", body: JSON.stringify({ code }) }),

  getGame: (code: string) => req(`/api/game/${code}/`),
};
