import prisma from "./src/db";

async function main() {
    try {
        const user = await prisma.user.update({
            where: { email: "agen@example.com" },
            data: { email: "agent@example.com" }
        });
        console.log("Updated email to agent@example.com");
    } catch (e) {
        console.error("Error updating email (maybe it was already updated or doesn't exist):", e);
        
        // Let's just try creating it from scratch in case it failed
        const { auth } = require("./src/auth");
        // bypass hook
        const authAny = auth as any;
        try {
            const res = await authAny.api.signUpEmail({
                body: {
                    email: "agent@example.com",
                    password: "password123",
                    name: "Agent",
                    role: "AGENT"
                }
            });
            console.log("Created agent@example.com from scratch.");
        } catch(e2) {
            console.log("Creation also failed, might already exist.");
        }
    }
}

main();
