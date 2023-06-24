import { createUserSchema } from '../data-validation.js'
import { prisma } from '../db.js'
import { InvalidInputError } from '../utils/errors.js'
import { addUserInput } from '../utils/model.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

export const managerResolvers = {
  Query: {
    //fetch one manager
    getManagerByEmail: async (_: any, { email }) => {
      try {
        const manager = await prisma.manager.findUnique({
          where: {
            email: email,
          },
        })
        if (!manager) {
          throw InvalidInputError('The email is invalid.')
        }

        return manager
      } catch (error) {
        console.log(error.message)
        if (error.message.includes('email')) {
          throw InvalidInputError('The email is invalid.')
        }
      }
    },
  },
  Mutation: {
    //create a manager
    addManager: async (_: any, args: addUserInput) => {
      try {
        const validatedData = createUserSchema.parse(args)
        const { first_name, last_name, phone, email, password } = validatedData
        const hashedPwd = await bcrypt.hash(password, 10)

        //check if the ECE_id is valid
        const center = await prisma.center.findUnique({
          where: {
            ECE_id:args.ECE_id
          }
        })
        if (!center) {
          throw InvalidInputError("The ECE_id is invalid.")
        }
        const manager = await prisma.manager.create({
          data: {
            first_name,
            last_name,
            phone,
            email,
            password: hashedPwd,
            role: 'MANAGER',
            ECE_id: args.ECE_id,
          },
        })

        const token = jwt.sign(
          { user_id: manager.id, email: manager.email },
          process.env.TOKEN
        )
        const managerWithToken = await prisma.manager.update({
          where: {
            id: manager.id,
          },
          data: {
            token: token,
          },
        })

        return managerWithToken
      } catch (error) {
        if (error.message.includes("The ECE_id is invalid.")) {
          throw InvalidInputError("The ECE_id is invalid.")
        }
        if (error.message.includes('Manager_email_key')) {
          throw InvalidInputError('This email has been registered.')
        }
        if (error.message.includes('Manager_ECE_id_key')) {
          throw InvalidInputError('This centre has a manager registered.')
        }
        console.log(error.message)
      }
    },
  },
}
