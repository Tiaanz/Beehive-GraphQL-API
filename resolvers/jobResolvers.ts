import { prisma } from '../db.js'
import { extractDatesFromDateRange } from '../utils/helper.js'
import { ForbiddenError, InvalidInputError } from '../utils/errors.js'
import dayjs from 'dayjs'

export const jobResolvers = {
  Query: {
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
        if (error.message.includes('authorised')) {
          throw ForbiddenError('You are not authorised.')
        }
      }
    },

    //fetch jobs reliever applied
    getJobsByDate: async (_: any, { date_from, date_to }, { userRole }) => {
      try {
        if (userRole !== 'RELIEVER') {
          throw ForbiddenError('You are not authorised.')
        }
        if (
          !dayjs(date_from, 'YYYY/MM/DD', true).isValid() ||
          !dayjs(date_to, 'YYYY/MM/DD', true).isValid()
        ) {
          throw InvalidInputError('Invalid dates input.')
        }
        if (new Date(date_from) <= new Date(date_to)) {
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
        } else {
          throw InvalidInputError('date_from should equal date_to.')
        }
      } catch (error) {
        console.log(error.message)
        if (error.message.includes('authorised')) {
          throw ForbiddenError('You are not authorised.')
        }
        if (error.message.includes('dates')) {
          throw InvalidInputError('Invalid dates input.')
        }
        if (error.message.includes('date_from')) {
          throw InvalidInputError('date_from should equal date_to.')
        }
      }
    },

    //fetch job by ID
    getJobById: async (_: any, { job_id }, { userRole }) => {
      try {
        if (userRole === 'GUEST') {
          throw ForbiddenError('You are not authorised.')
        }
        const job=await prisma.job.findUnique({
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
        if (!job) {
          throw InvalidInputError("This jobId is invalid.")
        }
        return job
      } catch (error) {
        console.log(error.message)
        if (error.message.includes('authorised')) {
          throw ForbiddenError('You are not authorised.')
        }
        if (error.message.includes('jobId')) {
          throw ForbiddenError('This jobId is invalid.')
        }
        if (error.message.includes('prisma.job.findUnique()')) {
          throw ForbiddenError('This jobId is invalid.')
        }
       
      }
    },
  },

  Mutation: {
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
