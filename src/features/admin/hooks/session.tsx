"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import type { AdminRole } from "@prisma/client";

export interface AdminSessionInfo {
  id: string;
  email: string;
  username: string;
  name: string | null;
  avatar: string | null;
  role: AdminRole;
}

interface AdminSessionContextValue {
  /** Sesi admin aktif; null bila belum termuat / tidak valid. */
  session: AdminSessionInfo | null;
  /** True selama sesi masih diambil dari server. */
  loading: boolean;
  /** Ambil ulang sesi (dipakai setelah profil diperbarui). */
  refresh: () => Promise<void>;
}

const AdminSessionContext = createContext<AdminSessionContextValue>({
  session: null,
  loading: true,
  refresh: async () => {},
});

/** Ambil sesi admin (role, dll) dari layout shell admin. */
export function useAdminSession() {
  return useContext(AdminSessionContext);
}

/**
 * Provider sesi admin — diisi sekali di AdminShell agar sider, header,
 * dan halaman (decorator) membaca role dari sumber yang sama.
 */
export function AdminSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, setSession] = useState<AdminSessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/auth/session");
      const result = await res.json();
      if (result.success) {
        setSession(result.data as AdminSessionInfo);
      }
    } catch {
      // Proxy akan redirect ke login bila sesi invalid.
    } finally {
      setLoading(false);
    }
  }, []);

  // Ambil sesi saat mount DAN setiap kali rute admin berubah: provider
  // hidup di admin/layout (tetap ter-mount saat pindah login → panel),
  // sehingga tanpa refetch per-pathname data user & menu role di navbar
  // baru muncul setelah refresh manual (bug DROID).
  useEffect(() => {
    void Promise.resolve().then(fetchSession);
  }, [fetchSession, pathname]);

  return (
    <AdminSessionContext.Provider value={{ session, loading, refresh: fetchSession }}>
      {children}
    </AdminSessionContext.Provider>
  );
}
