import { createClient } from "@/lib/supabase/server";
import { LoginFormClient } from "./ClientLoginForm";

interface LoginHotelRow {
  name: string | null;
}

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: hotelData } = await supabase.from("hotels").select("name").limit(1).single();
  const hotel = hotelData as unknown as LoginHotelRow | null;
  const hotelName = hotel?.name || "Arkkarawin";

  return <LoginFormClient hotelName={hotelName} />;
}
