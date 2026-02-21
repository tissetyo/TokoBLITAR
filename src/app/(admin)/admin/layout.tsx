export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      {/* AdminNav will be wired in Sprint 6 */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
