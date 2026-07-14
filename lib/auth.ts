import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";

export type UserRole = "USER" | "ADMIN";

export interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: UserRole;
  phoneNumber?: string | null;
}

export interface AuthUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: UserRole;
  phoneNumber?: string | null;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "mock-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "mock-secret",
    }),
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        phoneNumber: { label: "Phone Number", type: "text" },
        otp: { label: "OTP", type: "text" },
        email: { label: "Email", type: "text" },
      },
      async authorize(credentials) {
        // 1. Phone / OTP Authentication (Admin Login Page)
        if (credentials?.phoneNumber && credentials?.otp) {
          const masterOtp = process.env.MASTER_OTP || "123456";
          let isValid = credentials.otp === masterOtp;

          if (!isValid) {
            const storedToken = await prisma.verificationToken.findFirst({
              where: {
                identifier: credentials.phoneNumber,
                token: credentials.otp,
                expires: { gt: new Date() },
              },
            });
            if (storedToken) {
              isValid = true;
              await prisma.verificationToken.delete({
                where: {
                  identifier_token: {
                    identifier: storedToken.identifier,
                    token: storedToken.token,
                  },
                },
              });
            }
          }

          if (isValid) {
            let user = await prisma.user.findUnique({
              where: { phoneNumber: credentials.phoneNumber },
            });

            if (!user) {
              user = await prisma.user.create({
                data: {
                  phoneNumber: credentials.phoneNumber,
                  role: "ADMIN",
                },
              });
            }

            return {
              id: user.id,
              name: user.name || "Admin",
              email: user.email || "admin@quizzer.com",
              role: user.role,
              phoneNumber: user.phoneNumber,
            };
          }
        }

        // 2. Email / Developer Bypass (User Login / Testing)
        if (credentials?.email) {
          const email = credentials.email.trim().toLowerCase();
          let role = "USER";

          const adminEmail = (process.env.ADMIN_EMAIL || "admin@quizzer.com").trim().toLowerCase();
          if (email === adminEmail || email === "admin@quizzer.com") {
            role = "ADMIN";
          }

          let user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user) {
            user = await prisma.user.create({
              data: {
                email,
                name: email.split("@")[0],
                role,
              },
            });
          }

          return {
            id: user.id,
            name: user.name || email.split("@")[0],
            email: user.email,
            role: user.role,
          };
        }

        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.phoneNumber = (user as unknown as AuthUser).phoneNumber;

        let role = (user as unknown as AuthUser).role || "USER";
        const adminEmail = (process.env.ADMIN_EMAIL || "admin@quizzer.com").trim().toLowerCase();
        if (user.email && user.email.toLowerCase() === adminEmail) {
          role = "ADMIN";
          // Sync role in database to admin
          await prisma.user.update({
            where: { id: user.id },
            data: { role: "ADMIN" }
          });
        }
        token.role = role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as SessionUser).id = token.id as string;
        (session.user as SessionUser).role = token.role as UserRole;
        (session.user as SessionUser).phoneNumber = token.phoneNumber as string | null | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
};
