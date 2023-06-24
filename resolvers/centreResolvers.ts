import { updateCenterSchema } from '../data-validation.js'
import { prisma } from '../db.js'
import { ForbiddenError, InvalidInputError } from '../utils/errors.js'
import { updateCenterInput } from '../utils/model.js'

export const centreResolvers = {
  Query: {  //get one center
    getOneCenter: async (_: any, { ECE_id }, { userRole }) => {
      try {
        console.log(userRole);
        
        if (userRole === 'GUEST') {
          throw ForbiddenError('You are not authorised.')
        }
        const center= await prisma.center.findUnique({
          where: { ECE_id: ECE_id },
          include: {
            manager: true,
            posts: true,
          },
        })
        if (!center) {
          throw InvalidInputError("This eceId is invalid.")
         }
         return center
       }
      catch (error) {
        console.log(error.message)
        if (error.message.includes("authorised")) {
          throw ForbiddenError('You are not authorised.')
        }
        if (error.message.includes("eceId")) {
          throw InvalidInputError("This eceId is invalid.")
        }
      }
    },
    
     //fetch filtered centers
     getFilteredCenters: async (_: any, { input }) => {
      try {
        return await prisma.center.findMany({
          where: {
            name: {
              contains: input,
              mode: 'insensitive',
            },
          },
        })
      } catch (error) {
        console.log(error.message)
      }
    },

  },

  Mutation: {
       // update a center
       updateCenter: async (_: any, args: updateCenterInput, { userRole }) => {
        try {
          if (userRole !== 'MANAGER') {
            throw ForbiddenError('You are not authorised.')
          }
          const validatedData = updateCenterSchema.parse(args)
          const { description, photo_url } = validatedData
  
          const center = await prisma.center.update({
            where: { ECE_id: args.ECE_id },
            data: {
              description,
              photo_url,
            },
          })
          return center
        } catch (error) {
          console.log(error.message)
          if (error.message.includes("authorised")) {
            throw ForbiddenError('You are not authorised.')
          }
          if (error.message.includes("too_big")) {
            throw InvalidInputError("Description must contain at most 1000 characters.")
          }
        }
      },
  }
}