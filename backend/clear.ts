import { PrismaClient } from "@prisma/client"; const prisma = new PrismaClient(); await prisma.$executeRaw`UPDATE ticket SET category = NULL`; await prisma.$disconnect();
