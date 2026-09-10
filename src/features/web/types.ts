// ============================================================
// Tipe feature web — dipakai halaman (membership) web
// ============================================================

/** Profil user web (client) — dipetakan dari AuthUser Prisma di page profile. */
export interface User {
  id: string;
  email: string;
  phone: string | null;
  name: string;
  gender: "male" | "female" | null;
  birthDate: string | null;
  address: string | null;
  avatar: string | null;
}
