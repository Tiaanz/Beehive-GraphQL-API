import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

import data from './center.json.js'
const centerData = data.map((center) => center)

async function main() {
  // await prisma.center.createMany({
  //   data: centerData,
  // })
  await prisma.user.createMany({
    data: [
      {
        first_name: 'testUser',
        last_name: 'test',
        email:'test_user@beehive.com',
        phone: '020000001',
        password: '1234abcd',
        role: 'RELIEVER',
      },
      {
        first_name: 'testManager',
        last_name: 'test',
        email:'test_manager@beehive.com',
        phone: '020000002',
        password: '1234abcd',
        role: 'MANAGER',
        ECE_id:40312
      },
    ],
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
