import { z } from "zod";

export const createRoomtypeSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().optional(),
  moodDescription: z.string().trim().optional(),
  basePrice: z.number().nonnegative().default(0),
  bedType: z.string().trim().optional(),
  bedSize: z.string().trim().optional(),
  standardCapacity: z.number().int().positive().default(2),
  maxCapacity: z.number().int().positive().default(2),
  maxExtraBeds: z.number().int().nonnegative().default(0),
  extraBedPrice: z.number().nonnegative().default(0),
  petPolicy: z.string().trim().optional(),
  totalRooms: z.number().int().nonnegative().default(0),
});

export const updateRoomtypeSchema = createRoomtypeSchema.partial();

export type CreateRoomtypeInput = z.infer<typeof createRoomtypeSchema>;
export type UpdateRoomtypeInput = z.infer<typeof updateRoomtypeSchema>;
