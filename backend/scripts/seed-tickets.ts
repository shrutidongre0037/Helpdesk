import prisma from '../src/db';
import { TicketStatus } from '../src/generated/prisma';

const subjects = [
    "Cannot login to my account",
    "How do I reset my password?",
    "Billing question: charge on my card",
    "Bug: App crashes when uploading a file",
    "Feature Request: Dark Mode",
    "Integration with Slack not working",
    "Where can I find the API documentation?",
    "Account blocked due to multiple failed logins",
    "Need help configuring SSO",
    "Data export is failing",
    "Unable to invite new team members",
    "Mobile app is unresponsive",
    "Refund request for recent subscription",
    "Webhooks are failing with 500 error",
    "Dashboard not loading properly",
    "Questions about Enterprise plan",
    "Slow performance on the reporting page",
    "Can't update my profile picture",
    "Two-factor authentication setup issue",
    "Spam emails received from your domain"
];

const names = [
    "Alice Smith", "Bob Johnson", "Charlie Davis", "Diana Evans", 
    "Ethan Foster", "Fiona Green", "George Harris", "Hannah Adams", 
    "Ian Clark", "Julia King", "Kevin Wright", "Laura Scott", 
    "Michael Baker", "Nina Perez", "Oscar Roberts", "Paul White", 
    "Quinn Lee", "Rachel Walker", "Sam Hall", "Tina Young"
];

const statuses = [
    TicketStatus.NEW, TicketStatus.OPEN, TicketStatus.PENDING, 
    TicketStatus.RESOLVED, TicketStatus.CLOSED
];

function getRandomElement<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomDate(start: Date, end: Date) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function seedTickets() {
    console.log("Seeding 100 tickets...");
    const tickets = [];

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

    for (let i = 0; i < 100; i++) {
        const name = getRandomElement(names);
        const email = `${name.toLowerCase().replace(' ', '.')}@example.com`;
        const subject = getRandomElement(subjects);
        const status = getRandomElement(statuses);
        const createdAt = getRandomDate(thirtyDaysAgo, now);
        const updatedAt = getRandomDate(createdAt, now);

        tickets.push({
            subject,
            description: `Customer ${name} reported an issue: "${subject}".\n\nPlease investigate this matter as soon as possible.`,
            senderEmail: email,
            senderName: name,
            status,
            createdAt,
            updatedAt
        });
    }

    try {
        await prisma.ticket.createMany({
            data: tickets
        });
        console.log("Successfully seeded 100 tickets!");
    } catch (error) {
        console.error("Error seeding tickets:", error);
    } finally {
        await prisma.$disconnect();
    }
}

seedTickets();
