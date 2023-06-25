import { prisma } from '../db.js';
import { extractDatesFromDateRange } from '../utils/helper.js';
import { ForbiddenError, InvalidInputError } from '../utils/errors.js';
import dayjs from 'dayjs';
export const jobResolvers = {
    Query: {
        //fetch "OPEN" jobs
        getOpenJobs: async (_, __, { userRole }) => {
            try {
                if (userRole === 'GUEST') {
                    throw ForbiddenError('You are not authorised.');
                }
                return await prisma.job.findMany({
                    where: {
                        status: 'OPEN',
                    },
                    include: {
                        relievers: true,
                        center: true,
                    },
                });
            }
            catch (error) {
                console.log(error.message);
                if (error.message.includes('authorised')) {
                    throw ForbiddenError('You are not authorised.');
                }
            }
        },
        //fetch jobs reliever applied
        getJobsByDate: async (_, { date_from, date_to }, { userRole }) => {
            try {
                if (userRole !== 'RELIEVER') {
                    throw ForbiddenError('You are not authorised.');
                }
                if (!dayjs(date_from, 'YYYY/MM/DD', true).isValid() ||
                    !dayjs(date_to, 'YYYY/MM/DD', true).isValid()) {
                    throw InvalidInputError('Invalid dates input.');
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
                    });
                }
                else {
                    throw InvalidInputError('date_from should equal date_to.');
                }
            }
            catch (error) {
                console.log(error.message);
                if (error.message.includes('authorised')) {
                    throw ForbiddenError('You are not authorised.');
                }
                if (error.message.includes('dates')) {
                    throw InvalidInputError('Invalid dates input.');
                }
                if (error.message.includes('date_from')) {
                    throw InvalidInputError('date_from should equal date_to.');
                }
            }
        },
        //fetch job by ID
        getJobById: async (_, { job_id }, { userRole }) => {
            try {
                if (userRole === 'GUEST') {
                    throw ForbiddenError('You are not authorised.');
                }
                const job = await prisma.job.findUnique({
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
                });
                if (!job) {
                    throw InvalidInputError('This jobId is invalid.');
                }
                return job;
            }
            catch (error) {
                console.log(error.message);
                if (error.message.includes('authorised')) {
                    throw ForbiddenError('You are not authorised.');
                }
                if (error.message.includes('jobId') ||
                    error.message.includes('prisma.job.findUnique()')) {
                    throw ForbiddenError('This jobId is invalid.');
                }
            }
        },
    },
    Mutation: {
        //update a Job by adding an applicant
        applyJob: async (_, { jobID, relieverID }, { userRole }) => {
            try {
                if (userRole !== 'RELIEVER') {
                    throw ForbiddenError('You are not authorised.');
                }
                const reliever = await prisma.reliever.findUnique({
                    where: {
                        id: relieverID,
                    },
                });
                if (!reliever) {
                    throw InvalidInputError('The relieverId is invalid.');
                }
                const applied = await prisma.job.findUnique({
                    where: {
                        id: jobID,
                    },
                    select: {
                        relieverIDs: true,
                    },
                });
                const declined = await prisma.job.findUnique({
                    where: {
                        id: jobID,
                    },
                    select: {
                        declined_relieverIDs: true,
                    },
                });
                if (!applied || !declined) {
                    throw InvalidInputError('The jobId is invalid.');
                }
                //avoid duplicated relieverId being added
                if (applied &&
                    !applied.relieverIDs.includes(relieverID) &&
                    !declined.declined_relieverIDs.includes(relieverID)) {
                    const updatedJob = await prisma.job.update({
                        where: {
                            id: jobID,
                        },
                        data: {
                            relieverIDs: {
                                push: relieverID,
                            },
                        },
                    });
                    return updatedJob;
                }
                else {
                    throw InvalidInputError('You have applied or declined the job.');
                }
            }
            catch (error) {
                console.log(error.message);
                if (error.message.includes('authorised')) {
                    throw ForbiddenError('You are not authorised.');
                }
                if (error.message.includes('You have applied or declined the job.')) {
                    throw InvalidInputError('You have applied or declined the job.');
                }
                if (error.message.includes('prisma.job.findUnique()') ||
                    error.message.includes('jobId')) {
                    throw InvalidInputError('This jobId is invalid.');
                }
                if (error.message.includes('relieverId') ||
                    error.message.includes('prisma.reliever.findUnique()')) {
                    throw InvalidInputError('This relieverId is invalid.');
                }
            }
        },
        //When a reliever declines the job
        declineJob: async (_, { jobID, relieverID }, { userRole }) => {
            try {
                if (userRole !== 'RELIEVER') {
                    throw ForbiddenError('You are not authorised.');
                }
                const reliever = await prisma.reliever.findUnique({
                    where: {
                        id: relieverID,
                    },
                });
                if (!reliever) {
                    throw InvalidInputError('The relieverId is invalid.');
                }
                const declined = await prisma.job.findUnique({
                    where: {
                        id: jobID,
                    },
                    select: {
                        declined_relieverIDs: true,
                    },
                });
                const applied = await prisma.job.findUnique({
                    where: {
                        id: jobID,
                    },
                    select: {
                        relieverIDs: true,
                    },
                });
                if (!applied || !declined) {
                    throw InvalidInputError('The jobId is invalid.');
                }
                //avoid duplicated relieverId being added
                if (declined &&
                    !declined.declined_relieverIDs.includes(relieverID) &&
                    !applied.relieverIDs.includes(relieverID)) {
                    const updatedJob = await prisma.job.update({
                        where: {
                            id: jobID,
                        },
                        data: {
                            declined_relieverIDs: {
                                push: relieverID,
                            },
                        },
                    });
                    return updatedJob;
                }
                else {
                    throw InvalidInputError('You have declined or applied the job.');
                }
            }
            catch (error) {
                console.log(error.message);
                if (error.message.includes('authorised')) {
                    throw ForbiddenError('You are not authorised.');
                }
                if (error.message.includes('You have declined or applied the job.')) {
                    throw InvalidInputError('You have applied or declined the job.');
                }
                if (error.message.includes('prisma.job.findUnique()') ||
                    error.message.includes('jobId')) {
                    throw InvalidInputError('This jobId is invalid.');
                }
                if (error.message.includes('relieverId') ||
                    error.message.includes('prisma.reliever.findUnique()')) {
                    throw InvalidInputError('This relieverId is invalid.');
                }
            }
        },
        //When a manager accpets a job (update the status of the job and relieverIDs)
        acceptJob: async (_, { jobID, relieverID }, { userRole }) => {
            try {
                if (userRole !== 'MANAGER') {
                    throw ForbiddenError('You are not authorised.');
                }
                const reliever = await prisma.reliever.findUnique({
                    where: {
                        id: relieverID,
                    },
                });
                if (!reliever) {
                    throw InvalidInputError('The relieverId is invalid.');
                }
                const declined = await prisma.job.findUnique({
                    where: {
                        id: jobID,
                    },
                    select: {
                        declined_relieverIDs: true,
                    },
                });
                const applied = await prisma.job.findUnique({
                    where: {
                        id: jobID,
                    },
                    select: {
                        relieverIDs: true,
                    },
                });
                if (!applied || !declined) {
                    throw InvalidInputError('The jobId is invalid.');
                }
                //Make sure the reliever have applied the job and have not declined it
                if (applied &&
                    !declined.declined_relieverIDs.includes(relieverID) &&
                    applied.relieverIDs.includes(relieverID)) {
                    const updatedJob = await prisma.job.update({
                        where: {
                            id: jobID,
                        },
                        data: {
                            relieverIDs: relieverID,
                            status: 'FUFILLED',
                        },
                    });
                    return updatedJob;
                }
                else {
                    throw InvalidInputError('You have not applied for this job.');
                }
            }
            catch (error) {
                console.log(error.message);
                if (error.message.includes('authorised')) {
                    throw ForbiddenError('You are not authorised.');
                }
                if (error.message.includes('relieverId') ||
                    error.message.includes('prisma.reliever.findUnique()')) {
                    throw InvalidInputError('This relieverId is invalid.');
                }
                if (error.message.includes('prisma.job.findUnique()') ||
                    error.message.includes('jobId')) {
                    throw InvalidInputError('This jobId is invalid.');
                }
                if (error.message.includes('You have not applied for this job.')) {
                    throw InvalidInputError("You have not applied for this job.");
                }
            }
        },
        //When a reliever gets a job(update reliever's jobIDs, and not_available_dates)
        getJob: async (_, { relieverID, jobID }, { userRole }) => {
            try {
                if (userRole !== 'MANAGER') {
                    throw ForbiddenError('You are not authorised.');
                }
                const existing = await prisma.reliever.findUnique({
                    where: {
                        id: relieverID,
                    },
                    select: {
                        jobIDs: true,
                    },
                });
                if (!existing) {
                    throw InvalidInputError("The relieverId is invalid.");
                }
                const job = await prisma.job.findUnique({
                    where: {
                        id: jobID,
                    },
                    select: {
                        date_from: true,
                        date_to: true,
                    },
                });
                if (!job) {
                    throw InvalidInputError("The jobId is invalid.");
                }
                //To avoid duplicated jobID being added
                if (existing && !existing.jobIDs.includes(jobID)) {
                    const updatedReliever = await prisma.reliever.update({
                        where: {
                            id: relieverID,
                        },
                        data: {
                            jobIDs: {
                                push: jobID,
                            },
                        },
                    });
                    const unavailableDates = extractDatesFromDateRange(job.date_from, job.date_to);
                    //set unavailable dates
                    const updatedReliever2 = await prisma.reliever.update({
                        where: {
                            id: relieverID,
                        },
                        data: {
                            not_available_dates: unavailableDates,
                        },
                    });
                    return updatedReliever2;
                }
                else {
                    throw InvalidInputError('You have been confirmed for this job.');
                }
            }
            catch (error) {
                console.log(error.message);
                if (error.message.includes('authorised')) {
                    throw ForbiddenError('You are not authorised.');
                }
                if (error.message.includes('relieverId') ||
                    error.message.includes('prisma.reliever.findUnique()')) {
                    throw InvalidInputError('This relieverId is invalid.');
                }
                if (error.message.includes('prisma.job.findUnique()') ||
                    error.message.includes('jobId')) {
                    throw InvalidInputError('This jobId is invalid.');
                }
                if (error.message.includes('confirmed')) {
                    throw InvalidInputError("You have been confirmed for this job.");
                }
            }
        },
        // update other jobs' relieverIDs when the reliever gets a job(remove the reliever from other job applications)
        updateRelieverIDs: async (_, { relieverID, jobID }, { userRole }) => {
            try {
                if (userRole !== 'MANAGER') {
                    throw ForbiddenError('You are not authorised.');
                }
                const job = await prisma.job.findUnique({
                    where: {
                        id: jobID,
                    },
                });
                if (!job) {
                    throw InvalidInputError("The jobId is invalid.");
                }
                const reliever = await prisma.reliever.findUnique({
                    where: {
                        id: relieverID,
                    },
                });
                if (!reliever) {
                    throw InvalidInputError('The relieverId is invalid.');
                }
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
                });
                const updatedPosts = filteredPosts.map((post) => {
                    return {
                        ...post,
                        relieverIDs: post.relieverIDs.filter((id) => id !== relieverID),
                    };
                });
                for (let i = 0; i < updatedPosts.length; i++) {
                    await prisma.job.update({
                        where: {
                            id: updatedPosts[i].id,
                        },
                        data: {
                            relieverIDs: updatedPosts[i].relieverIDs,
                        },
                    });
                }
                return updatedPosts;
            }
            catch (error) {
                console.log(error.message);
                if (error.message.includes('authorised')) {
                    throw ForbiddenError('You are not authorised.');
                }
                if (error.message.includes('prisma.job.findUnique()') ||
                    error.message.includes('jobId')) {
                    throw InvalidInputError('This jobId is invalid.');
                }
                if (error.message.includes('relieverId') ||
                    error.message.includes('prisma.reliever.findUnique()')) {
                    throw InvalidInputError('This relieverId is invalid.');
                }
            }
        },
    },
};
