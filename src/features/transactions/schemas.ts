import { z } from "zod";

export const TransactionSchema = z
  .object({
    from_location_id: z.coerce.number().int().positive("Caisse source requise"),
    to_location_id: z.coerce.number().int().positive("Caisse destination requise"),
    amount: z.coerce.number().positive("Le montant doit être positif"),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format date invalide"),
  })
  .refine((d) => d.from_location_id !== d.to_location_id, {
    message: "La caisse source et destination doivent être différentes",
    path: ["to_location_id"],
  });

export type TransactionInput = z.infer<typeof TransactionSchema>;
