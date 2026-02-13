// app/dashboard/layout.tsx
import Sidebar from '@/components/Sidebar'
import LogoutButton from '@/components/LogoutButton'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      {/* SIDEBAR AREA */}
      <aside className="w-64 border-r border-gray-800 flex flex-col">
        <div className="p-6 font-bold text-xl border-b border-gray-800">
          RAG AI
        </div>
        <div className="flex-1 overflow-y-auto">
          <Sidebar />
        </div>
        <div className="p-4 border-t border-gray-800">
          <LogoutButton />
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col relative">
        {children}
      </main>
    </div>
  )
}