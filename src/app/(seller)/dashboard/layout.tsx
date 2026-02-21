export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      {/* SellerNav will be wired in Sprint 1 */}
      <main className="flex-1 p-6">{children}</main>
      {/* AISidebar will be wired in Sprint 4 */}
    </div>
  )
}
