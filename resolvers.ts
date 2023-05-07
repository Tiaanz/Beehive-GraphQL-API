import { prisma } from './db.js'
import { addUserInput } from './model.js'
import { AuthenticationError } from './utils/errors.js'

export const resolvers = {
  Query: {
    //fetch all users
    getAllUsers: async (_: any, __: any, { userId, userRole }) => {
      if (!userId) {
        throw AuthenticationError
      }
      return await prisma.user.findMany({
        include: {
          center: true,
          jobs: true,
        },
      })
    },
    //fetch all centers
    getAllCenters: async (_: any, __: any, { userId, userRole }) => {
      if (!userId) {
        throw AuthenticationError
      }
      return await prisma.center.findMany({
        include: {
          manager: true,
          posts: true,
        },
      })
    },
  },

  Mutation: {
    //create a user
    addUser: async (_: any, args: addUserInput) => {
      const user = await prisma.user.create({
        data: {
          first_name: args.first_name,
          last_name: args.last_name,
          phone: args.phone,
          email: args.email,
          password: args.password,
          role: args.role,
          ECE_id: args.ECE_id,
        },
      })
      return user
    },
    //delete a user
    deleteUser: async (_: any, { email }) => {
      const deleteUser = await prisma.user.delete({
        where: {
          email: email,
        },
      })
      return deleteUser
    },
  },
}
