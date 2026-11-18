import { z } from "zod";

export const emailSchema = z.email("Enter a valid email address").max(254).trim().toLowerCase();

export const requestCodeSchema = z.object({ email: emailSchema });

export const verifyCodeSchema = z.object({
  email: emailSchema,
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
  next: z.string().max(200).optional(),
});

export const profileSchema = z.object({
  displayName: z.string().trim().min(2, "Name is too short").max(80),
  headline: z.string().trim().min(3, "Add your role or headline").max(120),
  bio: z.string().trim().max(600).default(""),
  skills: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  openTo: z.string().trim().max(140).default(""),
  areaId: z.string().trim().min(2).max(40),
  discoverable: z.boolean().default(false),
});

export const createRequestSchema = z
  .object({
    kind: z.enum(["intro", "application", "pg_visit"]),
    toUserId: z.uuid().optional(),
    opportunityId: z.uuid().optional(),
    message: z.string().trim().min(1, "Add a short note").max(600, "Keep it under 600 characters"),
  })
  .superRefine((value, ctx) => {
    if (value.kind === "intro" && !value.toUserId) {
      ctx.addIssue({ code: "custom", path: ["toUserId"], message: "Choose a person" });
    }
    if (value.kind !== "intro" && !value.opportunityId) {
      ctx.addIssue({ code: "custom", path: ["opportunityId"], message: "Choose a listing" });
    }
  });

export const transitionRequestSchema = z.object({
  action: z.enum(["accept", "decline", "withdraw"]),
  note: z.string().trim().max(300).optional(),
});

export const placeQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  kind: z.string().trim().max(40).optional(),
});
