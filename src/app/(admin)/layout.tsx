import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/admin/Sidebar";
import { BottomNav } from "@/components/admin/BottomNav";
import { TopHeader } from "@/components/admin/TopHeader";
import { createClient } from "@/lib/supabase/server";
import { AdminSessionGuard } from "@/components/admin/AdminSessionGuard";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  let updatedSession = session;
  if (!session.hotelName && session.hotelId) {
    const supabase = await createClient();
    const { data: hotelData } = await supabase
      .from("hotels")
      .select("name")
      .eq("id", session.hotelId)
      .single();

    const hotel = hotelData as { name?: string } | null;
    updatedSession = { ...session, hotelName: hotel?.name || session.hotelName };
  }

  return (
    <AdminSessionGuard>
      <div className="admin-layout flex min-h-screen bg-[#faf7f0]">
        <Sidebar session={updatedSession} />

        <div className="flex-1 flex flex-col min-w-0">
          <TopHeader />

          <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-28 md:pb-8">
            {children}
          </main>
        </div>

        {/* Mobile bottom navigation */}
        <BottomNav session={updatedSession} />
      </div>
    </AdminSessionGuard>
  );
}
