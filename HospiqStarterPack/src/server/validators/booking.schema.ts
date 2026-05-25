import { z } from "zod";

export const createBookingLeadSchema = z.object({
  roomtypeId: z.string().uuid().optional(),
  guestName: z.string().trim().optional(),
  guestPhone: z.string().trim().optional(),
  guestLineUserId: z.string().trim().optional(),
  checkinDate: z.string().date().optional(),
  checkoutDate: z.string().date().optional(),
  guestCount: z.number().int().positive().default(1),
  roomCount: z.number().int().positive().default(1),
  note: z.string().trim().optional(),
  aiSummary: z.string().trim().optional(),
});

export type CreateBookingLeadInput = z.infer<typeof createBookingLeadSchema>;
