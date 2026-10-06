import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/schemas/auth";

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        const hashToCompare =
          user?.passwordHash ??
          "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8i";
        const isValid = await bcrypt.compare(password, hashToCompare);

        if (!user || !isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
      }

      const userId = (token.id as string | undefined) ?? user?.id;
      if (
        userId &&
        (user || token.coupleId === undefined || trigger === "update")
      ) {
        const membership = await prisma.coupleMember.findUnique({
          where: { userId },
          select: { coupleId: true },
        });
        token.coupleId = membership?.coupleId ?? null;
      }

      if (trigger === "update" && session && "coupleId" in session) {
        token.coupleId = (session as { coupleId: string | null }).coupleId;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.coupleId =
          (token.coupleId as string | null | undefined) ?? null;
      }
      return session;
    },
  },
});

export async function updateSession(data: Record<string, unknown>) {
  return unstable_update(data);
}