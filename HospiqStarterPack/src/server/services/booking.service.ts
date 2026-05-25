import { bookingRepository } from "../repositories/booking.repository";
import type { CreateBookingLeadInput, UpdateBookingLeadInput } from "../validators/booking.schema";

export const bookingService = {
  listBookings(hotelId: string) {
    return bookingRepository.listByHotel(hotelId);
  },

  createBookingLead(hotelId: string, input: CreateBookingLeadInput) {
    return bookingRepository.createLead(hotelId, input);
  },

  updateBookingLead(hotelId: string, id: string, input: UpdateBookingLeadInput) {
    return bookingRepository.updateLead(hotelId, id, input);
  },
};
