import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "OTP",
      credentials: {
        phoneNumber: { label: "Phone Number", type: "text", placeholder: "+1234567890" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.phoneNumber || !credentials?.otp) {
          return null;
        }

        // Mock verification logic for development
        // Real implementation would verify against VerificationToken table
        const masterOtp = process.env.MASTER_OTP || "123456";
        
        let isValid = false;
        
        if (credentials.otp === masterOtp) {
          isValid = true;
        } else {
          // Check DB for OTP (if we implemented real sending)
          const storedToken = await prisma.verificationToken.findFirst({
            where: {
              identifier: credentials.phoneNumber,
              token: credentials.otp,
              expires: { gt: new Date() }
            }
          });
          
          if (storedToken) {
            isValid = true;
            // Delete token after use
            await prisma.verificationToken.delete({
              where: {
                identifier_token: {
                  identifier: storedToken.identifier,
                  token: storedToken.token
                }
              }
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
              },
            });
          }

          return { id: user.id, phoneNumber: user.phoneNumber };
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
        token.phoneNumber = (user as any).phoneNumber;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).phoneNumber = token.phoneNumber;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
};
