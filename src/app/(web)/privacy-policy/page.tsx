import { permanentRedirect } from "next/navigation";

/** Kebijakan Privasi kini bagian dari halaman user-agreement. */
export default function PrivacyPolicyPage() {
  permanentRedirect("/user-agreement#privacy-policy");
}
