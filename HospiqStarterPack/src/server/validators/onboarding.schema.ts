import { z } from "zod";
import { createRoomtypeSchema } from "./roomtype.schema";

export const onboardingSchema = z.object({
  hotel: z.object({
    name: z.string().trim().min(1),
    address: z.string().trim().optional(),
    description: z.string().trim().optional(),
    contactPhone: z.string().trim().optional(),
    contactEmail: z.string().email().optional(),
    facebookUrl: z.string().url().optional(),
    websiteUrl: z.string().url().optional(),
    mapUrl: z.string().url().optional(),
    hasWebbooking: z.boolean().default(false),
    webbookingUrl: z.string().url().nullable().optional(),
  }),
  roomtype: createRoomtypeSchema.optional(),
  aiFaqs: z
    .array(
      z.object({
        question: z.string().trim().min(1),
        answer: z.string().trim().min(1),
        category: z.string().trim().optional(),
        language: z.string().trim().default("th"),
        keywords: z.array(z.string().trim()).default([]),
      }),
    )
    .default([]),
  complete: z.boolean().default(true),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
