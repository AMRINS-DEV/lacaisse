import { z } from "zod";

export const ChargeSchema = z.object({
  description: z.string().min(1, "Description requise").max(500),
  amount: z.coerce.number().positive("Le montant doit être positif"),
  category: z.string().min(1, "Catégorie requise"),
  payment_method: z.string().min(1, "Mode de paiement requis"),
  location_id: z.coerce.number().int().positive("Caisse requise"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format date invalide"),
});

export type ChargeInput = z.infer<typeof ChargeSchema>;
