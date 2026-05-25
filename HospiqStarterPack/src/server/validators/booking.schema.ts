import { z } from "zod";

export const createBookingLeadSchema = z.object({
  roomtypeId: z.string().uuid().optional(),
  lineSessionId: z.string().uuid().optional(),
  guestName: z.string().trim().optional(),
  guestPhone: z.string().trim().optional(),
  guestLineUserId: z.string().trim().optional(),
  checkinDate: z.string().date().optional(),
  checkoutDate: z.string().date().optional(),
  guestCount: z.number().int().positive().default(1),
  roomCount: z.number().int().positive().default(1),
  preferredContactChannel: z.string().trim().optional(),
  conversationSummary: z.string().trim().optional(),
  note: z.string().trim().optional(),
  adminNote: z.string().trim().optional(),
  aiSummary: z.string().trim().optional(),
});

export const updateBookingLeadSchema = createBookingLeadSchema.partial().extend({
  leadStatus: z.enum(["new", "contacted", "converted", "lost"]).optional(),
  webbookingRedirectedAt: z.string().datetime().optional(),
});

export type CreateBookingLeadInput = z.infer<typeof createBookingLeadSchema>;
export type UpdateBookingLeadInput = z.infer<typeof updateBookingLeadSchema>;
