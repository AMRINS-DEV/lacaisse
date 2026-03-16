export const SERVICE_COOKIE_NAME = "active_service";
export const DEFAULT_SERVICE_KEY = "bestside";
const SERVICE_KEY_REGEX = /^[a-z0-9_-]{2,32}$/;

export type ServiceKey = string;

export function normalizeServiceKey(value: string | null | undefined): ServiceKey {
  if (!value) return DEFAULT_SERVICE_KEY;
  const normalized = value.trim().toLowerCase();
  return SERVICE_KEY_REGEX.test(normalized) ? normalized : DEFAULT_SERVICE_KEY;
}
