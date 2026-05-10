import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { SeoSettingsEditor } from "@/components/admin/cms/SeoSettingsEditor";

export const metadata = {
  title: "CMS | SEO",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SeoCMSPage() {
  const session = await getSession();
  if (!session || !session.hotelId) {
    redirect("/login");
  }

  const supabase = await createServiceClient();
  const { data: hotel } = await supabase
    .from("hotels")
    .select("settings")
    .eq("id", session.hotelId)
    .single();

  const seo = ((hotel as any)?.settings as Record<string, any>)?.seo || {};

  return (
    <div className="w-full min-h-full flex flex-col justify-center pb-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-xl md:text-2xl font-serif text-[#1a3c2a]">SEO</h1>
          <p className="text-[#8b7355] text-sm mt-1">ตั้งค่าข้อมูลสำหรับ Google, social sharing และ canonical URL</p>
        </div>

        <div className="max-w-3xl">
          <SeoSettingsEditor initialData={seo} />
        </div>
      </div>
    </div>
  );
}
