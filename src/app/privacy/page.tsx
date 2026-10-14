import { redirect } from "next/navigation";

/**
 * Standard /privacy route redirecting to our comprehensive data privacy transparency center.
 */
export default function PrivacyRedirect() {
  redirect("/data-privacy");
}
