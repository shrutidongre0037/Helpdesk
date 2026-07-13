import bcrypt from 'bcrypt';
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
        } else {
            const hash = bcrypt.hashSync(password, 10);
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
        }


    } catch (error) {
        console.error("Error seeding database:", error);
    }

    try {
        const aiEmail = "ai@helpdesk.local";
        console.log(`Seeding AI agent: ${aiEmail}...`);
        
        const existingAi = await prisma.user.findUnique({
            where: { email: aiEmail }
        });

        if (existingAi) {
            console.log("AI agent already exists. Skipping seed.");
        } else {
            const aiId = randomUUID();
            // Optional: you can set a random password for AI agent if needed
            const aiHash = bcrypt.hashSync(randomUUID(), 10);
            
            await prisma.user.create({
                data: {
                    id: aiId,
                    name: "AI",
                    email: aiEmail,
                    emailVerified: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    role: Role.AGENT
                }
            });

            await prisma.account.create({
                data: {
                    id: randomUUID(),
                    userId: aiId,
                    accountId: aiId,
                    providerId: "credential",
                    password: aiHash,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            });
            console.log("AI agent created successfully!");
        }
    } catch (error) {
        console.error("Error seeding AI agent:", error);
    } finally {
        await prisma.$disconnect();
    }
}

seed();
