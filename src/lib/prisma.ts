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

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const PRISMA_SCHEMA_VERSION = "v2_source_question_id";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
  prismaSchemaVersion: string | undefined;
};

function getPrismaClient(): PrismaClientSingleton {
  if (
    !globalForPrisma.prisma ||
    globalForPrisma.prismaSchemaVersion !== PRISMA_SCHEMA_VERSION
  ) {
    globalForPrisma.prisma = prismaClientSingleton();
    globalForPrisma.prismaSchemaVersion = PRISMA_SCHEMA_VERSION;
  }
  return globalForPrisma.prisma;
}

export const prisma = getPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaSchemaVersion = PRISMA_SCHEMA_VERSION;
}
