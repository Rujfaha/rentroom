export type AccountRole = "super_admin" | "hotel_admin";

export interface CurrentAccount {
  id: string;
  email: string;
  fullName: string | null;
  role: AccountRole;
  hotelId: string | null;
  status: "active" | "inactive" | "pending";
}
