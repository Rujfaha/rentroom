import { bookingRepository } from "../repositories/booking.repository";
import type { CreateBookingLeadInput } from "../validators/booking.schema";

export const bookingService = {
  listBookings(hotelId: string) {
    return bookingRepository.listByHotel(hotelId);
  },

  createBookingLead(hotelId: string, input: CreateBookingLeadInput) {
    return bookingRepository.createLead(hotelId, input);
  },
};
