import NextAuth from "next-auth";
import { fullAuthConfig } from "@/lib/auth/config";

export const { handlers, auth, signIn, signOut } = NextAuth(fullAuthConfig);
