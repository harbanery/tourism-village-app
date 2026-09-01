"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoaderPage from "@/components/admin/loader";

/**
 * Guard panel admin: validasi sesi ke database via /api/admin/auth/session.
 * Proxy sudah memblokir request tanpa cookie; cek ini menangani cookie
 * yang ada tapi tidak valid (mis. sesi kedaluwarsa 12 jam / dicabut).
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/auth/session")
      .then((response) => response.json())
      .then((result) => {
        if (!active) return;
        if (result.success) {
          setAuthenticated(true);
        } else {
          router.replace("/admin/login");
        }
      })
      .catch(() => {
        if (active) router.replace("/admin/login");
      });
    return () => {
      active = false;
    };
  }, [router]);

  if (authenticated === null) return <LoaderPage />;

  return <>{children}</>;
}

export default AdminGuard;
