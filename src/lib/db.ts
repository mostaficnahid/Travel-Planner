import { PrismaClient } from "@prisma/client";

const NEON_POOLED_URL =
  "postgresql://neondb_owner:npg_Ulz7rue9xFnv@ep-aged-term-axn18htq-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const NEON_DIRECT_URL =
  "postgresql://neondb_owner:npg_Ulz7rue9xFnv@ep-aged-term-axn18htq.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

// Guarantee that process.env.DATABASE_URL is NEVER empty or undefined at runtime
if (!process.env.DATABASE_URL || process.env.DATABASE_URL.trim() === "") {
  process.env.DATABASE_URL =
    process.env.DIRECT_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    NEON_POOLED_URL;
}

if (!process.env.DIRECT_URL || process.env.DIRECT_URL.trim() === "") {
  process.env.DIRECT_URL = NEON_DIRECT_URL;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
