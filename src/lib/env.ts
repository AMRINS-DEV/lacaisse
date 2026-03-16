import { z } from "zod";
import { config } from "dotenv";
config();

const envSchema = z.object({
  DATABASE_HOST: z.string().min(1),
  DATABASE_PORT: z.string().default("3306"),
  DATABASE_USER: z.string().min(1),
  DATABASE_PASSWORD: z.string(),
  DATABASE_NAME: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().optional().default(""),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  STORAGE_PATH: z.string().default("./storage/uploads"),
});

export const env = envSchema.parse(process.env);
