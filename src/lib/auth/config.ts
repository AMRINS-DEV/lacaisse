import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { queryOne } from "@/lib/db";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";

export const fullAuthConfig: NextAuthConfig = {
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = z.object({
          email: z.string().email(),
          password: z.string().min(1),
        }).safeParse(credentials);

        if (!parsed.success) return null;

        const user = await queryOne<{
          id: number;
          email: string;
          password_hash: string;
          full_name: string;
          role: string;
          is_active: boolean;
        }>(
          "SELECT id, email, password_hash, full_name, role, is_active FROM users WHERE email = ? LIMIT 1",
          [parsed.data.email]
        );

        if (!user || !user.is_active) return null;

        const passwordMatch = await bcrypt.compare(
          parsed.data.password,
          user.password_hash
        );
        if (!passwordMatch) return null;

        return {
          id: String(user.id),
          email: user.email,
          name: user.full_name,
          role: user.role,
        };
      },
    }),
  ],
};
