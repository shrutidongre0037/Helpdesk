import { hashPassword } from '@better-auth/utils/password';
import prisma from '../src/db';
import { randomUUID } from 'crypto';
import { Role } from '../src/generated/prisma';

async function seed() {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
        console.error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in the environment variables.");
        process.exit(1);
    }

    console.log(`Seeding admin user: ${email}...`);

    try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            console.log("Admin user already exists. Skipping seed.");
            return;
        }

        const hash = await hashPassword(password);
        const userId = randomUUID();

        const user = await prisma.user.create({
            data: {
                id: userId,
                name: "Admin",
                email: email,
                emailVerified: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                role: Role.ADMIN
            }
        });

        await prisma.account.create({
            data: {
                id: randomUUID(),
                userId: userId,
                accountId: userId,
                providerId: "credential",
                password: hash,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });

        console.log("Admin user created successfully!");
    } catch (error) {
        console.error("Error seeding database:", error);
    } finally {
        await prisma.$disconnect();
    }
}

seed();
