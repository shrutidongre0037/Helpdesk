import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@helpdesk.local' },
    update: {},
    create: {
      email: 'admin@helpdesk.local',
      name: 'Super Admin',
      password: adminPassword,
      role: 'ADMIN',
    },
  })

  console.log('Admin user seeded:', admin.email)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
