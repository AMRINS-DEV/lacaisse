import { z } from "zod";

export const UpdateUserSchema = z.object({
  name: z.string().min(1),
  role: z.enum(["admin", "manager", "location_user", "accountant", "viewer"]),
  is_active: z.coerce.boolean(),
  location_ids: z.array(z.coerce.number()).optional(),
});

export const CreateUserSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Minimum 8 caractères"),
  role: z.enum(["admin", "manager", "location_user", "accountant", "viewer"]),
  location_ids: z.array(z.coerce.number()).optional(),
});
