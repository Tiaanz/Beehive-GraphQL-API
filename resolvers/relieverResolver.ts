import { prisma } from '../db.js'
import { ForbiddenError, InvalidInputError } from '../utils/errors.js'


export const relieverResolvers = {
  Query: {
    //fetch one reliever
    getRelieverByEmail: async (_: any, { email }) => {
      try {
       const reliever= await prisma.reliever.findUnique({
          where: {
            email: email,
          },
          include: {
            jobs: true,
          },
       })
        
       if (!reliever) {
        throw InvalidInputError("The email is invalid.")
       }
        return reliever
      } catch (error) {
        console.log(error.message)
        if (error.message.includes("email")) {
          throw InvalidInputError("The email is invalid.")
        }
      }
    },

     //fetch one reliever by ID
     getRelieverById: async (_: any, { reliever_id }, { userRole }) => {
      try {
        if (userRole === 'GUEST') {
          throw ForbiddenError('You are not authorised.')
        }
        const reliever= await prisma.reliever.findUnique({
          where: {
            id: reliever_id,
          },
          include: {
            jobs: true,
          },
        })
       
        return reliever
      } catch (error) {
        console.log(error.message)
        if (error.message.includes("authorised")) {
          throw ForbiddenError('You are not authorised.')
        }
          throw InvalidInputError("The relieverId is invalid.")
        
      }
    },
  },
  
  Mutation: {
    
  }
}