import { prisma } from './db.js'
import {
  addUserInput,
  addPostInput,
  updatePostInput,
} from './utils/model.js'
import bcrypt from 'bcrypt'
import {
  createUserSchema,
  createPostSchema,
  updatePostSchema,
} from './data-validation.js'
import dayjs from 'dayjs'
import { Status } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { extractDatesFromDateRange } from './utils/helper.js'
import { AuthenticationError, ForbiddenError } from './utils/errors.js'


export const resolvers = {
  Query: {
 
 

    //fetch posts by month
    getPostsByMonth: async (
      _: any,
      { center_id, date_from, date_to },
      { userRole }
    ) => {
      try {
        if (userRole === 'GUEST') {
          throw ForbiddenError('You are not authorised.')
        }
        return await prisma.job.findMany({
          where: {
            center_id,
            date_from: { lte: date_to },
            date_to: { gte: date_from },
            OR: [
              { date_from: { gte: date_from } },
              { date_to: { lte: date_to } },
            ],
          },
          include: {
            relievers: true,
            center: true,
          },
        })
      } catch (error) {
        console.log(error.message)
      }
    },

    //fetch "OPEN" jobs
    getOpenJobs: async (_: any, __: any, { userRole }) => {
      try {
     
        
        if (userRole === 'GUEST') {
          throw ForbiddenError('You are not authorised.')
        }
        return await prisma.job.findMany({
          where: {
            status: 'OPEN',
          },
          include: {
            relievers: true,
            center: true,
          },
        })
      } catch (error) {
        console.log(error.message)
      }
    },

    //fetch jobs reliever applied
    getJobsByReliever: async (_: any, { date_from, date_to }, { userRole }) => {
      try {
        if (userRole !== 'RELIEVER') {
          throw ForbiddenError('You are not authorised.')
        }
        return await prisma.job.findMany({
          where: {
            date_from: { lte: date_from },
            date_to: { gte: date_to },
          },
          include: {
            relievers: true,
            center: true,
          },
        })
      } catch (error) {
        console.log(error.message)
      }
    },

    //fetch job by ID
    getJobById: async (_: any, { job_id }, { userRole }) => {
      try {
        if (userRole === 'GUEST') {
          throw ForbiddenError('You are not authorised.')
        }
        return await prisma.job.findUnique({
          where: {
            id: job_id,
          },
          include: {
            relievers: true,
            center: {
              include: {
                manager: true,
              },
            },
          },
        })
      } catch (error) {
        console.log(error.message)
        throw new Error("This jobId is not found.");
      }
    },
  },

  Mutation: {
 



 

  

    //add a post
    addPost: async (_: any, args: addPostInput, { userRole }) => {
      try {
        
        if (userRole !== 'MANAGER') {
          throw ForbiddenError('You are not authorised.')
        }
        const validatedData = createPostSchema.parse(args)
        const { date_from, date_to, time, qualified } = validatedData
        if (new Date(date_from) <= new Date(date_to)) {
          const post = await prisma.job.create({
            data: {
              center_id: args.center_id,
              date_from,
              date_to,
              time,
              qualified,
              status: 'OPEN',
            },
          })
          return post
        } else {
          throw new Error('Date_from should be less than date_to.')
        }
      } catch (error) {
        console.log(error.message)
      }
    },

    //update a post
    updatePost: async (_: any, args: updatePostInput, { userRole }) => {
      try {
        if (userRole !== 'MANAGER') {
          throw ForbiddenError('You are not authorised.')
        }
        const validatedData = updatePostSchema.parse(args)
        const { date_from, date_to, time, qualified, post_id } = validatedData
        if (
          dayjs(date_from).isSame(date_to, 'day') ||
          dayjs(date_from).isBefore(date_to, 'day')
        ) {
          const post = await prisma.job.update({
            where: {
              id: post_id,
            },
            data: {
              date_from,
              date_to,
              time,
              qualified,
              status: args.status as Status,
            },
          })
          return post
        } else {
          throw new Error('Date_from should be less than date_to.')
        }
      } catch (error) {
        console.log(error.message)
      }
    },

    //update a Job by adding an applicant
    applyJob: async (_: any, { id, relieverID }, { userRole }) => {
      try {
        if (userRole !== 'RELIEVER') {
          throw ForbiddenError('You are not authorised.')
        }
        const applied = await prisma.job.findUnique({
          where: {
            id: id,
          },
          select: {
            relieverIDs: true,
          },
        })

        const declined = await prisma.job.findUnique({
          where: {
            id: id,
          },
          select: {
            declined_relieverIDs: true,
          },
        })

        //avoid duplicated relieverId being added
        if (
          applied &&
          !applied.relieverIDs.includes(relieverID) &&
          !declined.declined_relieverIDs.includes(relieverID)
        ) {
          const updatedJob = await prisma.job.update({
            where: {
              id: id,
            },
            data: {
              relieverIDs: {
                push: relieverID,
              },
            },
          })

          return updatedJob
        } else {
          throw new Error('You have applied or declined the job.')
        }
      } catch (error) {
        console.log(error.message)
      }
    },

    //When a reliever declines the job
    declineJob: async (_: any, { id, relieverID }, { userRole }) => {
      try {
        if (userRole !== 'RELIEVER') {
          throw ForbiddenError('You are not authorised.')
        }
        const declined = await prisma.job.findUnique({
          where: {
            id: id,
          },
          select: {
            declined_relieverIDs: true,
          },
        })

        const applied = await prisma.job.findUnique({
          where: {
            id: id,
          },
          select: {
            relieverIDs: true,
          },
        })
        //avoid duplicated relieverId being added
        if (
          declined &&
          !declined.declined_relieverIDs.includes(relieverID) &&
          !applied.relieverIDs.includes(relieverID)
        ) {
          const updatedJob = await prisma.job.update({
            where: {
              id: id,
            },
            data: {
              declined_relieverIDs: {
                push: relieverID,
              },
            },
          })

          return updatedJob
        } else {
          throw new Error('You have declined or applied the job.')
        }
      } catch (error) {
        console.log(error.message)
      }
    },

    //When a manager accpets a job
    acceptJob: async (_: any, { id, relieverID }, { userRole }) => {
      try {
        if (userRole !== 'MANAGER') {
          throw ForbiddenError('You are not authorised.')
        }
        const declined = await prisma.job.findUnique({
          where: {
            id: id,
          },
          select: {
            declined_relieverIDs: true,
          },
        })

        const applied = await prisma.job.findUnique({
          where: {
            id: id,
          },
          select: {
            relieverIDs: true,
          },
        })

        //Make sure the reliever have applied the job and have not declined it
        if (
          applied &&
          !declined.declined_relieverIDs.includes(relieverID) &&
          applied.relieverIDs.includes(relieverID)
        ) {
          const updatedJob = await prisma.job.update({
            where: {
              id: id,
            },
            data: {
              relieverIDs: relieverID,
              status: 'FUFILLED',
            },
          })

          return updatedJob
        } else {
          throw new Error('You have not applied for this job.')
        }
      } catch (error) {
        console.log(error.message)
      }
    },

    //When a reliever gets a job
    getJob: async (_: any, { id, jobID }, { userRole }) => {
      try {
        if (userRole !== 'MANAGER') {
          throw ForbiddenError('You are not authorised.')
        }
        const existing = await prisma.reliever.findUnique({
          where: {
            id: id,
          },
          select: {
            jobIDs: true,
          },
        })

        //To avoid duplicated jobID being added
        if (existing && !existing.jobIDs.includes(jobID)) {
          const updatedReliever = await prisma.reliever.update({
            where: {
              id: id,
            },
            data: {
              jobIDs: {
                push: jobID,
              },
            },
          })

          const job = await prisma.job.findUnique({
            where: {
              id: jobID,
            },
            select: {
              date_from: true,
              date_to: true,
            },
          })
          const unavailableDates = extractDatesFromDateRange(
            job.date_from,
            job.date_to
          )

          //set unavailable dates
          const updatedReliever2 = await prisma.reliever.update({
            where: {
              id: id,
            },
            data: {
              not_available_dates: unavailableDates,
            },
          })
          return updatedReliever2
        } else {
          throw new Error('You have been confirmed for this job.')
        }
      } catch (error) {
        console.log(error.message)
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
      }
    },

    // update other jobs' relieverIDs when the reliever gets a job
    updateRelieverIDs: async (_: any, { relieverID, jobID }, { userRole }) => {
      try {
        if (userRole !== 'MANAGER') {
          throw ForbiddenError('You are not authorised.')
        }
        const job = await prisma.job.findUnique({
          where: {
            id: jobID,
          },
        })

        const filteredPosts = await prisma.job.findMany({
          where: {
            id: {
              not: {
                equals: jobID,
              },
            },
            date_from: {
              lte: job.date_to,
            },
            date_to: {
              gte: job.date_from,
            },
            relieverIDs: {
              has: relieverID,
            },
          },
        })

        const updatedPosts = filteredPosts.map((post) => {
          return {
            ...post,
            relieverIDs: post.relieverIDs.filter((id) => id !== relieverID),
          }
        })

        for (let i = 0; i < updatedPosts.length; i++) {
          await prisma.job.update({
            where: {
              id: updatedPosts[i].id,
            },
            data: {
              relieverIDs: updatedPosts[i].relieverIDs,
            },
          })
        }
        return updatedPosts
      } catch (error) {
        console.log(error.message)
      }
    },
  },
}
