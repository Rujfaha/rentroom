import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/admin/Sidebar";
import { TopHeader } from "@/components/admin/TopHeader";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data: hotelData } = await supabase
    .from("hotels")
    .select("name")
    .eq("id", session.hotelId as string)
    .single();

  const hotel = hotelData as any;
  const updatedSession = { ...session, hotelName: hotel?.name || session.hotelName };

  return (
    <div className="admin-layout flex min-h-screen bg-[#faf7f0]">
      <Sidebar session={updatedSession} />
      
      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader />
        
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
