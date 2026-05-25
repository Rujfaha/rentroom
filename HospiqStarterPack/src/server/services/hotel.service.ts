import { hotelRepository } from "../repositories/hotel.repository";
import type { UpdateHotelInput } from "../validators/hotel.schema";

export const hotelService = {
  getCurrentHotel(hotelId: string) {
    return hotelRepository.getById(hotelId);
  },

  updateHotel(hotelId: string, input: UpdateHotelInput) {
    return hotelRepository.update(hotelId, input);
  },
};
