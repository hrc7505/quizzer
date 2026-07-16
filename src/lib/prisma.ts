import { PrismaClient } from '@prisma/client'
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const normalizeDatabaseUrl = (url?: string) => {
  if (!url) return url;
  return url.replace(/sslmode=(prefer|require|verify-ca)(?=&|$)/gi, "sslmode=verify-full");
};

const prismaClientSingleton = () => {
  const connectionString = normalizeDatabaseUrl(process.env.DATABASE_URL);
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  
  return new PrismaClient({ adapter });
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
