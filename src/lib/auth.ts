import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';

const credsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(creds) {
        const parsed = credsSchema.safeParse(creds);
        if (!parsed.success) return null;

        const expectedEmail = process.env.ADMIN_EMAIL;
        const expectedPassword = process.env.ADMIN_PASSWORD;
        if (!expectedEmail || !expectedPassword) {
          throw new Error('ADMIN_EMAIL/ADMIN_PASSWORD não configurados');
        }

        if (parsed.data.email === expectedEmail && parsed.data.password === expectedPassword) {
          return { id: 'admin', email: expectedEmail, name: 'Owner' };
        }
        return null;
      },
    }),
  ],
});
