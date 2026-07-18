import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";
import type { UserRole, SessionUser } from "./session";

export type { UserRole, SessionUser };

export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "admin@quizzer.com").trim().toLowerCase();
export const MASTER_OTP = process.env.MASTER_OTP || "123456";
export const IS_PRODUCTION = process.env.NODE_ENV === "production";

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
          let isValid = credentials.otp === MASTER_OTP;

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
        if (credentials?.email && !IS_PRODUCTION) {
          const email = credentials.email.trim().toLowerCase();
          let role = "USER";

          if (email === ADMIN_EMAIL) {
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
        token.phoneNumber = (user as unknown as SessionUser).phoneNumber;

        let role = (user as unknown as SessionUser).role || "USER";
        if (user.email && user.email.toLowerCase() === ADMIN_EMAIL) {
          role = "ADMIN";
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
