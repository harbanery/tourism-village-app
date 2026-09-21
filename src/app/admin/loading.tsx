/**
 * Loading fallback khusus segmen admin — memakai loader push admin
 * (bukan ripple web di root loading) dengan background warna konten
 * panel (antd colorBgLayout: #f5f5f5 light / #000000 dark), sesuai
 * permintaan DROID.
 */
export default function AdminLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5] dark:bg-[#000000]">
      <span className="loader-push" aria-hidden />
    </div>
  );
}
