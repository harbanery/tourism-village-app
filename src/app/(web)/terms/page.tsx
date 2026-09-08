import { permanentRedirect } from "next/navigation";

/** Syarat & Ketentuan kini bagian dari halaman user-agreement. */
export default function TermsPage() {
  permanentRedirect("/user-agreement#terms");
}
