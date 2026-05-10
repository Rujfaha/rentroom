import { createClient } from "@/lib/supabase/server";
import { LoginFormClient } from "./ClientLoginForm";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: hotelData } = await supabase.from("hotels").select("name").limit(1).single();
  const hotel = hotelData as any;
  const hotelName = hotel?.name || "Arkkarawin";

  return <LoginFormClient hotelName={hotelName} />;
}
