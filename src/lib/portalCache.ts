import { revalidateTag } from "next/cache";

// Cache tag of the public site's property list (own + MLS). See getAvailableProperties().
export const PORTAL_PROPERTIES_TAG = "portal-properties";

/** Call after creating, editing or removing a property or MLS listing so the public site refreshes. */
export function invalidatePortalProperties(): void {
  try {
    revalidateTag(PORTAL_PROPERTIES_TAG, "max");
  } catch (e) {
    console.error("revalidateTag failed", e);
  }
}
