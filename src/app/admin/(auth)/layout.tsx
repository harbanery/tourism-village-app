// Auth pages (login/registrasi) render without the AdminShell sidebar.
// The root layout already provides ThemeProvider/AntdRegistry.
export default function AdminAuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
