import { z } from "zod";

export const createAiFaqSchema = z.object({
  question: z.string().trim().min(1),
  answer: z.string().trim().min(1),
  category: z.string().trim().optional(),
  language: z.string().trim().default("th"),
  keywords: z.array(z.string().trim().min(1)).default([]),
});

export const createAiFaqsSchema = z.object({
  faqs: z.array(createAiFaqSchema).min(1),
});

export const testAiReplySchema = z.object({
  message: z.string().trim().min(1),
  lineUserId: z.string().trim().default("manual-test-user"),
  lineSessionId: z.string().trim().optional(),
});

export type CreateAiFaqInput = z.infer<typeof createAiFaqSchema>;
