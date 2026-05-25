import { AppError } from "../http/api-error";
import type { CurrentAccount } from "./types";

export function requireHotelAccess(account: CurrentAccount, requestedHotelId?: string): string {
  if (account.role === "super_admin") {
    if (!requestedHotelId) {
      throw new AppError("Hotel id is required", 400, "HOTEL_ID_REQUIRED");
    }

    return requestedHotelId;
  }

  if (!account.hotelId) {
    throw new AppError("Account is not assigned to a hotel", 403, "HOTEL_REQUIRED");
  }

  if (requestedHotelId && requestedHotelId !== account.hotelId) {
    throw new AppError("Forbidden hotel access", 403, "FORBIDDEN_HOTEL");
  }

  return account.hotelId;
}
