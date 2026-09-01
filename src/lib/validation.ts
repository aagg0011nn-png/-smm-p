import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().max(190),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128)
    .regex(/[A-Z]/, "Must include an uppercase letter")
    .regex(/[0-9]/, "Must include a number"),
});

export const createOrderSchema = z.object({
  serviceId: z.string().cuid(),
  link: z.string().url().max(2000),
  quantity: z.number().int().positive().max(10_000_000),
});

export const depositSchema = z.object({
  amount: z.number().positive().max(1_000_000),
  method: z.enum(["MANUAL_BANK_TRANSFER", "MANUAL_OTHER"]),
  referenceNote: z.string().max(500).optional(),
  proofUrl: z.string().url().max(2000).optional(),
});

export const providerCreateSchema = z.object({
  name: z.string().min(2).max(100),
  apiUrl: z.string().url(),
  apiKey: z.string().min(4).max(500),
  notes: z.string().max(1000).optional(),
});

export const paymentReviewSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  rejectionReason: z.string().max(500).optional(),
});

export const ticketCreateSchema = z.object({
  subject: z.string().min(3).max(200),
  message: z.string().min(3).max(5000),
});
