import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from './prisma';

async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(plain, hashed);
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'البريد الإلكتروني', type: 'email' },
        password: { label: 'كلمة المرور', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.isActive) return null;

        const isValid = await verifyPassword(
          credentials.password as string,
          user.password
        );

        if (!isValid) return null;

        await prisma.activityLog.create({
          data: {
            action: 'LOGIN',
            entityType: 'User',
            entityId: user.id,
            details: JSON.stringify({ email: user.email }),
            userId: user.id,
          },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          permissions: user.permissions,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.permissions = (user as any).permissions;
      }

      if (token?.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { id: true, isActive: true, role: true, permissions: true, password: true },
          });

          if (!dbUser || !dbUser.isActive) {
            return {} as any;
          }

          const pwdHash = dbUser.password.substring(0, 20);
          if (token.pwdHash && token.pwdHash !== pwdHash) {
            return {} as any;
          }

          token.pwdHash = pwdHash;
          token.role = dbUser.role;
          token.permissions = dbUser.permissions;
        } catch (e) {
          // If DB check fails, return existing token
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (!token?.id || !token?.role) {
        return null as any;
      }
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).permissions = token.permissions as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "e9f84a2c1b7d305e9402c77a1f9d3e528b4a691c0e3f8752d1948b6c0e2a14f9",
});
