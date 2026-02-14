export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      {/* Sidebar is removed - now full width content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}