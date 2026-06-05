import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main(): Promise<void> {
  console.log('Seeding database...')

  // TODO: Add seed data for Sprint 1+ testing

  console.log('Seeding complete!')
}

main()
  .catch((error) => {
    console.error('Seed error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
