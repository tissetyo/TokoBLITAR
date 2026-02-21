import { DashboardLayout } from '@/components/layout/DashboardLayout'

export default function SellerDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardLayout>{children}</DashboardLayout>
}
