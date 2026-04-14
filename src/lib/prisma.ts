import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: InstanceType<typeof PrismaClient> | undefined;
  prismaReady: Promise<InstanceType<typeof PrismaClient>> | undefined;
};

async function createPrisma(): Promise<InstanceType<typeof PrismaClient>> {
  const { PrismaLibSql } = await import("@prisma/adapter-libsql");
  const { createClient } = await import("@libsql/client");
  const libsql = createClient({ url: "file:dev.db" });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapter = new PrismaLibSql(libsql as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new PrismaClient({ adapter } as any);
}

async function getPrisma(): Promise<InstanceType<typeof PrismaClient>> {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  if (!globalForPrisma.prismaReady) {
    globalForPrisma.prismaReady = createPrisma().then((client) => {
      globalForPrisma.prisma = client;
      return client;
    });
  }
  return globalForPrisma.prismaReady;
}

export { getPrisma };
