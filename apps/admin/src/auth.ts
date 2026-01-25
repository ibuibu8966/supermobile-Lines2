import NextAuth from "next-auth";
import { createAuthConfig } from "@repo/auth";
import { prisma } from "@repo/database";

export const { handlers, auth, signIn, signOut } = NextAuth(createAuthConfig(prisma));
