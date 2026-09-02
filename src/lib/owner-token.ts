// Anonymous ownership token, stored in this browser only.
const KEY = "ndr-owner-token";

export function getOwnerToken(): string {
  if (typeof window === "undefined") return "";
  let token = window.localStorage.getItem(KEY);
  if (!token) {
    token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
    window.localStorage.setItem(KEY, token);
  }
  return token;
}
