import { prisma } from './db.js'
import { addUserInput } from './model.js'
import { AuthenticationError } from './utils/errors.js'
import bcrypt from 'bcrypt'
import { z } from 'zod'

const createUserSchema = z.object({
  first_name: z.string().max(40),
  last_name: z.string().max(40),
  phone: z.string().min(8).max(11),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/^(?=.*[A-Za-z])(?=.*\d).*$/, {
      message: 'Password must contain at least one letter and one number',
    }),
})

export const resolvers = {
  Query: {
    //fetch all relievers
    getAllRelievers: async (_: any, __: any) => {
      // if (!userId) {
      //   throw AuthenticationError
      // }
      return await prisma.reliever.findMany({
        include: {
          jobs: true,
        },
      })
    },
    //fetch all managers
    getAllManagers: async (_: any, __: any) => {
      // if (!userId) {
      //   throw AuthenticationError
      // }
      return await prisma.manager.findMany({
        include: {
          center: true,
        },
      })
    },

    //fetch all centers
    getAllCenters: async (_: any, __: any) => {
      // if (!userId) {
      //   throw AuthenticationError
      // }
      return await prisma.center.findMany({
        include: {
          manager: true,
          posts: true,
        },
      })
    },
    //fetch filtered centers
    getFilteredCenters: async (_: any, { input }) => {
      return await prisma.center.findMany({
        where: {
          name: {
            contains: input,
            mode: 'insensitive',
          },
        },
      })
    },
    //fetch one reliever
    getOneReliever: async (_: any, { email }) => {
      return await prisma.reliever.findUnique({
        where: {
          email: email,
        },
      })
    },
    //fetch one manager
    getOneManager: async (_: any, { email }) => {
      return await prisma.manager.findUnique({
        where: {
          email: email,
        },
      })
    },
  },

  Mutation: {
    //create a reliever
    addReliever: async (_: any, args: addUserInput) => {
      try {
        const validatedData = createUserSchema.parse(args)
        const { first_name, last_name, phone, email, password } = validatedData
        const hashedPwd = await bcrypt.hash(password, 10)

        const reliever = await prisma.reliever.create({
          data: {
            first_name,
            last_name,
            phone,
            email,
            password: hashedPwd,
            role: "RELIEVER",
          },
        })
        return reliever
      } catch (error) {
        console.error('Validation error:', error)
        throw new Error('Invalid input data')
      }
    },
    //create a manager
    addManager: async (_: any, args: addUserInput) => {

      try {

        const validatedData = createUserSchema.parse(args)
        const { first_name, last_name, phone, email, password } = validatedData
        const hashedPwd = await bcrypt.hash(password, 10)
        const manager = await prisma.manager.create({
          data: {
            first_name,
            last_name,
            phone,
            email,
            password: hashedPwd,
            role: "MANAGER",
            ECE_id: args.ECE_id,
          },
        })
        return manager
      } catch (error) {
        console.error('Validation error:', error)
        throw new Error('Invalid input data')
      }
     
    },

    //delete a reliever
    deleteReliever: async (_: any, { email }) => {
      const deleteReliever = await prisma.reliever.delete({
        where: {
          email: email,
        },
      })
      return deleteReliever
    },
    //delete a manager
    deleteManager: async (_: any, { email }) => {
      const deleteManager = await prisma.manager.delete({
        where: {
          email: email,
        },
      })
      return deleteManager
    },
  },
}
