import { roomtypeRepository } from "../repositories/roomtype.repository";
import type { CreateRoomtypeInput, UpdateRoomtypeInput } from "../validators/roomtype.schema";

export const roomtypeService = {
  listRoomtypes(hotelId: string, options: { checkinDate?: string; checkoutDate?: string } = {}) {
    return roomtypeRepository.listByHotel(hotelId, options);
  },

  createRoomtype(hotelId: string, input: CreateRoomtypeInput) {
    return roomtypeRepository.create(hotelId, input);
  },

  updateRoomtype(hotelId: string, id: string, input: UpdateRoomtypeInput) {
    return roomtypeRepository.update(hotelId, id, input);
  },
};
