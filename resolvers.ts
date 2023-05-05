import { prisma } from './db.js'
import { addUserInput } from './model.js'

export const resolvers = {
  Query: {
    getAllUsers: async () => {
      return await prisma.user.findMany({
        include: {
          center: true,
          jobs:true
        },
      })
    },
  },

  Mutation: {
    addUser: async (_: any, args: addUserInput) => {
      const user = await prisma.user.create({
        data: {
          first_name: args.first_name,
          last_name: args.last_name,
          phone: args.phone,
          email: args.email,
          password: args.password,
          role: args.role,
          ECE_id:args.ECE_id
        },
      })
      return user
    },
    deleteUser:async (_:any,{email}) => {
     const deleteUser= await prisma.user.delete({
        where: {
          email:email
        }
      })
      return deleteUser
    }
  },
}
