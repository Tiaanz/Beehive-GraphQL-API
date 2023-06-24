import { createUserSchema, updateUserSchema } from '../data-validation.js'
import { prisma } from '../db.js'
import { ForbiddenError, InvalidInputError } from '../utils/errors.js'
import { addUserInput, updateUserInput } from '../utils/model.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import dayjs from 'dayjs'

export const relieverResolvers = {
  Query: {
    //fetch one reliever
    getRelieverByEmail: async (_: any, { email }) => {
      try {
        const reliever = await prisma.reliever.findUnique({
          where: {
            email: email,
          },
          include: {
            jobs: true,
          },
        })

        if (!reliever) {
          throw InvalidInputError('The email is invalid.')
        }
        return reliever
      } catch (error) {
        console.log(error.message)
        if (error.message.includes('email')) {
          throw InvalidInputError('The email is invalid.')
        }
      }
    },

    //fetch one reliever by ID
    getRelieverById: async (_: any, { reliever_id }, { userRole }) => {
      try {
        if (userRole === 'GUEST') {
          throw ForbiddenError('You are not authorised.')
        }
        const reliever = await prisma.reliever.findUnique({
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
        if (error.message.includes('authorised')) {
          throw ForbiddenError('You are not authorised.')
        }
        throw InvalidInputError('The relieverId is invalid.')
      }
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
            role: 'RELIEVER',
            qualified: args.qualified,
          },
        })
        const token = jwt.sign(
          { user_id: reliever.id, email: reliever.email },
          process.env.TOKEN
        )
        const relieverWithToken = await prisma.reliever.update({
          where: {
            id: reliever.id,
          },
          data: {
            token: token,
          },
        })

        return relieverWithToken
      } catch (error) {
        if (error.message.includes('Reliever_email_key')) {
          throw InvalidInputError('This email has been registered.')
        }
        console.log(error.message)
      }
    },

    //update reliever
    updateReliever: async (_: any, args: updateUserInput, { userRole }) => {
      try {
        if (userRole !== 'RELIEVER') {
          throw ForbiddenError('You are not authorised.')
        }
        const validatedData = updateUserSchema.parse(args)
        const { bio, email, photo_url } = validatedData

        const reliever = await prisma.reliever.update({
          where: { email: email },
          data: {
            bio: bio,
            photo_url: photo_url,
            qualified: args.qualified,
          },
        })
        if (!reliever) {
          throw InvalidInputError('The email is invalid.')
        }
        return reliever
      } catch (error) {
        console.log(error.message)
        if (error.message.includes('authorised')) {
          throw ForbiddenError('You are not authorised.')
        }
        if (error.message.includes('email')) {
          throw InvalidInputError('The email is invalid.')
        }
        if (error.message.includes('too_big')) {
          throw InvalidInputError('Bio must contain at most 1000 characters.')
        }
      }
    },

    //update reliever's unavailable dates when job is cancelled
    updateUnavailableDates: async (
      _: any,
      { relieverID, jobID },
      { userRole }
    ) => {
      try {
        if (userRole !== 'MANAGER') {
          throw ForbiddenError('You are not authorised.')
        }
        const job = await prisma.job.findUnique({
          where: {
            id: jobID,
          },
          select: {
            date_from: true,
            date_to: true,
          },
        })

        if (!job) {
          throw InvalidInputError('The jobId is invalid.')
        }

        const cancelledDates = []
        const dateFromObj = dayjs(job.date_from)
        const dateToObj = dayjs(job.date_to)

        let currentDate = dateFromObj
        while (
          currentDate.isSame(dateToObj) ||
          currentDate.isBefore(dateToObj)
        ) {
          cancelledDates.push(currentDate.format('YYYY/MM/DD'))
          currentDate = currentDate.add(1, 'day')
        }

        const reliever = await prisma.reliever.findUnique({
          where: {
            id: relieverID,
          },
          select: {
            not_available_dates: true,
          },
        })

        if (!reliever) {
          throw InvalidInputError('The relieverId is invalid.')
        }

        const updated_not_available_dates = reliever.not_available_dates.filter(
          (date) =>
            !cancelledDates.find((cancelledDate) => cancelledDate === date)
        )

        const updatedReliever = await prisma.reliever.update({
          where: {
            id: relieverID,
          },
          data: {
            not_available_dates: updated_not_available_dates,
          },
        })
        return updatedReliever
      } catch (error) {
        console.log(error.message)
        if (error.message.includes('authorised')) {
          throw ForbiddenError('You are not authorised.')
        }
        if (
          error.message.includes('jobId') ||
          error.message.includes('prisma.job.findUnique()')
        ) {
          throw InvalidInputError('The jobId is invalid.')
        }
        if (error.message.includes('relieverId') || error.message.includes('prisma.reliever.findUnique()')) {
          throw InvalidInputError('The relieverId is invalid.')
        }
      }
    },
  },
}
