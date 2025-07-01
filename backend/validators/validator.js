import { z } from "zod";

// User Schema
export const userSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(255, "Name cannot exceed 255 characters"),
  email: z
    .string()
    .email("Invalid email format")
    .max(255, "Email cannot exceed 255 characters"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password cannot exceed 100 characters"),
  role: z.enum(["admin", "user"]).default("user"),
});

// Login Schema
export const loginSchema = z.object({
  email: z
    .string()
    .email("Invalid email format")
    .max(255, "Email cannot exceed 255 characters"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password cannot exceed 100 characters"),
});

// Jam Post Schema
export const jamPostSchema = z.object({
  latitude: z
    .string()
    .or(z.number())
    .transform((val) => parseFloat(val))
    .refine((val) => !isNaN(val) && val >= -90 && val <= 90, {
      message: "Latitude must be between -90 and 90",
    }),
  longitude: z
    .string()
    .or(z.number())
    .transform((val) => parseFloat(val))
    .refine((val) => !isNaN(val) && val >= -180 && val <= 180, {
      message: "Longitude must be between -180 and 180",
    }),
  note: z.string().optional(),
  image: z.string().optional(),
  level: z.enum(["low", "medium", "high", "critical"]).default("medium"),
});

// Comment Schema
export const commentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(1000, "Comment cannot exceed 1000 characters"),
  jam_post_id: z.number().int("Jam post ID must be an integer"),
});

// Reaction Schema
export const reactionSchema = z.object({
  reaction_type: z.enum(["like", "dislike", "helpful", "accurate"]),
  jam_post_id: z.number().int("Jam post ID must be an integer"),
});

// Conversation Schema
export const conversationSchema = z.object({
  user1_id: z.coerce.number().int().positive().optional(),
  user2_id: z.coerce.number().int().positive().optional(),
});

// Message Schema
export const messageSchema = z.object({
  sender_id: z.coerce.number().int().positive().optional(),
  content: z.string().max(2000).optional(),
  message_type: z.enum(["text", "image", "text_image"]).default("text"),
});
