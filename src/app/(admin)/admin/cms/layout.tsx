import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { CmsSidebar } from "@/components/admin/cms/CmsSidebar";

export default async function CmsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (session?.role !== "admin" && session?.role !== "super_admin") {
    redirect("/admin");
  }

  return (
    <div className="-m-4 md:-m-8 flex flex-col lg:flex-row h-[calc(100vh-4rem)]">
      {/* CMS Internal Sidebar */}
      <CmsSidebar />

      {/* Main content area */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
