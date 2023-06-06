import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

import data from './center.json.js'
const centerData = data.map((center) => center)

async function main() {
  // await prisma.center.createMany({
  //   data: centerData,
  // })

  const hashedPwd=await bcrypt.hash('1234abcd',10)
  await prisma.reliever.createMany({
    data: [
      {
        first_name: 'testUser',
        last_name: 'test',
        email:'test_user@beehive.com',
        phone: '020000001',
        password: hashedPwd,
        role: 'RELIEVER',
      },
    ],
  })
  await prisma.manager.createMany({
    data: [
      {
        first_name: 'testManager',
        last_name: 'test',
        email:'test_manager@beehive.com',
        phone: '020000002',
        password: hashedPwd,
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
