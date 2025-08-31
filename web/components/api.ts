export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";
let ADMIN_API_KEY = "";
export function setApiKey(k?: string) {
  ADMIN_API_KEY = k || "";
}

async function req(path: string, init?: RequestInit) {
  const r = await fetch(API_BASE + path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(ADMIN_API_KEY ? { "X-API-KEY": ADMIN_API_KEY } : {}),
      ...(init?.headers || {})
    },
    cache: "no-store"
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || (data && (data.error || data.errMsg))) {
    const msg = data?.error || data?.errMsg || `HTTP ${r.status}`;
    throw new Error(msg);
  }
  return data;
}

export function setAuth(token?: string): Record<string, string> {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

// Auth
export async function login(body: { phone?: string; wechatId?: string; platformId?: string }) {
  return req("/auth/login", { method: "POST", body: JSON.stringify(body) });
}
export async function me(token: string) {
  return req("/me", { headers: setAuth(token) });
}

// SBT/Proof/Points
export async function getProofById(proofId: string) {
  return req(`/proof/${encodeURIComponent(proofId)}`);
}
export async function getSbtOf(address: string) {
  return req(`/sbt/of/${encodeURIComponent(address)}`);
}
export async function sbtMint(userId: string, tokenUri: string, kycHex: string) {
  return req("/sbt/mint", { method: "POST", body: JSON.stringify({ userId, tokenUri, kycHex }) });
}
export async function pointsMint(userId: string, amount: string | number) {
  return req("/points/mint", { method: "POST", body: JSON.stringify({ userId, amount }) });
}
export async function pointsMintForSbt(tokenId: string | number, amount: string | number) {
  return req("/points/mintForSbt", { method: "POST", body: JSON.stringify({ tokenId, amount }) });
}
export async function bindTba(tokenId: string | number) {
  return req("/tba/bind", { method: "POST", body: JSON.stringify({ tokenId }) });
}

// Proof submit (user JWT required)
export async function proofSubmit(token: string, sbtId: string | number, cid: string, contentHash: string) {
  return req("/proof/submit", {
    method: "POST",
    headers: setAuth(token),
    body: JSON.stringify({ sbtId, cid, contentHash })
  });
}

// Verify by hash
export async function verifyByHash(contentHash: string) {
  return req(`/verify/byHash?contentHash=${encodeURIComponent(contentHash)}`);
}

// IPFS upload (browser file -> server)
export async function ipfsUpload(file: File) {
  const form = new FormData();
  form.append("file", file);
  const r = await fetch(API_BASE + "/ipfs/upload", { method: "POST", body: form });
  const data = await r.json();
  if (!r.ok || data.error) throw new Error(data.error || `HTTP ${r.status}`);
  return data as { ok: boolean; cid: string; contentHash: string };
}