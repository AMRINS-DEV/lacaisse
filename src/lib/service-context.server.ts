import { cookies } from "next/headers";
import {
  normalizeServiceKey,
  SERVICE_COOKIE_NAME,
  type ServiceKey,
} from "@/lib/service-context";

export async function getCurrentService(): Promise<ServiceKey> {
  const cookieStore = await cookies();
  const value = cookieStore.get(SERVICE_COOKIE_NAME)?.value;
  return normalizeServiceKey(value);
}
