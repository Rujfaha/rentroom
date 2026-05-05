// Dashboard layout — สำหรับหน้า Admin/Staff
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar จะอยู่ตรงนี้ */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
