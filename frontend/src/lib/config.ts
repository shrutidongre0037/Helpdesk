export function getBackendUrl() {
  return import.meta.env.VITE_BACKEND_URL || (import.meta.env.PROD ? "" : "http://localhost:3000");
}
