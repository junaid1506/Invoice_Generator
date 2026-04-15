const base = import.meta.env.VITE_API_URL || '';

export function getToken() {
  return localStorage.getItem('token');
}

export function setToken(t) {
  if (t) localStorage.setItem('token', t);
  else localStorage.removeItem('token');
}

export async function api(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...opts.headers };
  const t = getToken();
  if (t) headers.Authorization = `Bearer ${t}`;
  const r = await fetch(`${base}${path}`, { ...opts, headers });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err = new Error(data.message || r.statusText);
    err.status = r.status;
    throw err;
  }
  return data;
}
