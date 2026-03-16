import { z } from "zod";
export const AlertSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  type: z.enum(["budget_exceeded", "low_balance", "custom"]),
  location_id: z.coerce.number().optional().nullable(),
  category: z.string().optional().nullable(),
  threshold: z.coerce.number().positive("Seuil requis"),
  period: z.enum(["daily", "weekly", "monthly"]),
});
