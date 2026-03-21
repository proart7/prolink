import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export const registerParticulierSchema = z.object({
  firstName: z.string().min(2, "Minimum 2 caractères"),
  lastName: z.string().min(2, "Minimum 2 caractères"),
  email: z.string().email("Email invalide"),
  phone: z.string().optional(),
  password: z
    .string()
    .min(8, "Minimum 8 caractères")
    .regex(/[A-Z]/, "Au moins une majuscule")
    .regex(/[0-9]/, "Au moins un chiffre"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

export const registerProfessionnelSchema = z.object({
  firstName: z.string().min(2, "Minimum 2 caractères"),
  lastName: z.string().min(2, "Minimum 2 caractères"),
  email: z.string().email("Email invalide"),
  phone: z.string().optional(),
  password: z
    .string()
    .min(8, "Minimum 8 caractères")
    .regex(/[A-Z]/, "Au moins une majuscule")
    .regex(/[0-9]/, "Au moins un chiffre"),
  confirmPassword: z.string(),
  siren: z
    .string()
    .regex(/^\d{9}$|^\d{14}$/, "SIREN (9 chiffres) ou SIRET (14 chiffres)"),
  description: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  serviceArea: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

export const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().optional(),
  comment: z.string().min(10, "Minimum 10 caractères"),
  professionalId: z.string(),
});

export const messageSchema = z.object({
  content: z.string().min(1, "Le message ne peut pas être vide"),
  conversationId: z.string().optional(),
  recipientId: z.string().optional(),
  subject: z.string().optional(),
});

export const searchSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  minRating: z.number().min(0).max(5).optional(),
  insuranceVerified: z.boolean().optional(),
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(50).optional().default(20),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterParticulierInput = z.infer<typeof registerParticulierSchema>;
export type RegisterProfessionnelInput = z.infer<typeof registerProfessionnelSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
