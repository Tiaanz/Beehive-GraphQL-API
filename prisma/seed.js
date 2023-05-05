import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

import data from './center.json.js'
const centerData = data.map((center) => center)

async function main() {
  await prisma.center.createMany({
    data: centerData,
  })
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
