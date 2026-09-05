"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoaderPage from "@/components/admin/loader";

/**
 * Guard panel admin: validasi sesi ke database via /api/admin/auth/session.
 * Proxy sudah memblokir request tanpa cookie; cek ini menangani cookie
 * yang ada tapi tidak valid (mis. sesi kedaluwarsa 12 jam / dicabut).
 *
 * Saat sesi tidak valid, cookie lama dihapus dulu lewat /api/admin/auth/logout
 * sebelum redirect ke /admin/login. Tanpa ini terjadi loop redirect: proxy
 * melihat cookie ada → memantulkan balik dari /admin/login ke /admin.
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/auth/session")
      .then(async (response) => {
        const result = await response.json();
        if (!active) return;
        if (result.success) {
          setAuthenticated(true);
        } else {
          // Hapus cookie basi agar proxy mengizinkan akses ke /admin/login.
          await fetch("/api/admin/auth/logout", { method: "POST" }).catch(
            () => {},
          );
          if (active) router.replace("/admin/login");
        }
      })
      .catch(async () => {
        await fetch("/api/admin/auth/logout", { method: "POST" }).catch(
          () => {},
        );
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
