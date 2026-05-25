import { z } from "zod";

export const updateHotelSchema = z.object({
  name: z.string().trim().min(1).optional(),
  address: z.string().trim().optional(),
  description: z.string().trim().optional(),
  contactPhone: z.string().trim().optional(),
  contactEmail: z.string().email().optional(),
  facebookUrl: z.string().url().optional(),
  websiteUrl: z.string().url().optional(),
  mapUrl: z.string().url().optional(),
  hasWebbooking: z.boolean().optional(),
  webbookingUrl: z.string().url().nullable().optional(),
});

export type UpdateHotelInput = z.infer<typeof updateHotelSchema>;
