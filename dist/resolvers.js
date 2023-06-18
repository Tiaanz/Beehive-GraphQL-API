import { prisma } from './db.js';
import bcrypt from 'bcrypt';
import { createUserSchema, updateCenterSchema, updateUserSchema, createPostSchema, updatePostSchema, } from './data-validation.js';
import dayjs from 'dayjs';
import { convertDate } from './helper.js';
function extractDatesFromArray(arr) {
    const dates = [];
    for (let i = 0; i < arr.length; i++) {
        const dateFromObj = dayjs(convertDate(arr[i].date_from));
        const dateToObj = dayjs(convertDate(arr[i].date_to));
        let currentDate = dateFromObj;
        while (currentDate.isSame(dateToObj) || currentDate.isBefore(dateToObj)) {
            dates.push(currentDate.format('DD/MM/YYYY'));
            currentDate = currentDate.add(1, 'day');
        }
    }
    return dates;
}
export const resolvers = {
    Query: {
        //fetch all relievers
        getAllRelievers: async (_, __) => {
            // if (!userId) {
            //   throw AuthenticationError
            // }
            return await prisma.reliever.findMany({
                include: {
                    jobs: true,
                },
            });
        },
        //fetch all managers
        getAllManagers: async (_, __) => {
            // if (!userId) {
            //   throw AuthenticationError
            // }
            return await prisma.manager.findMany({
                include: {
                    center: true,
                },
            });
        },
        //fetch all centers
        getAllCenters: async (_, __) => {
            // if (!userId) {
            //   throw AuthenticationError
            // }
            return await prisma.center.findMany({
                include: {
                    manager: true,
                    posts: true,
                },
            });
        },
        //get one center
        getOneCenter: async (_, { ECE_id }) => {
            // if (!userId) {
            //   throw AuthenticationError
            // }
            return await prisma.center.findUnique({
                where: { ECE_id: ECE_id },
                include: {
                    manager: true,
                    posts: true,
                },
            });
        },
        //fetch filtered centers
        getFilteredCenters: async (_, { input }) => {
            return await prisma.center.findMany({
                where: {
                    name: {
                        contains: input,
                        mode: 'insensitive',
                    },
                },
            });
        },
        //fetch one reliever
        getOneReliever: async (_, { email }) => {
            return await prisma.reliever.findUnique({
                where: {
                    email: email,
                },
                include: {
                    jobs: true,
                },
            });
        },
        //fetch one reliever by ID
        getRelieverById: async (_, { reliever_id }) => {
            return await prisma.reliever.findUnique({
                where: {
                    id: reliever_id,
                },
                include: {
                    jobs: true,
                },
            });
        },
        //fetch one manager
        getOneManager: async (_, { email }) => {
            return await prisma.manager.findUnique({
                where: {
                    email: email,
                },
            });
        },
        //fetch posts by center
        getPostsByCenter: async (_, { center_id, date_from, date_to }) => {
            // if (!userId) {
            //   throw AuthenticationError
            // }
            return await prisma.job.findMany({
                where: {
                    center_id,
                    date_from: { lte: date_from },
                    date_to: { gte: date_to },
                },
                include: {
                    relievers: true,
                    center: true,
                },
            });
        },
        //fetch "OPEN" jobs
        getOpenJobs: async (_) => {
            // if (!userId) {
            //   throw AuthenticationError
            // }
            return await prisma.job.findMany({
                where: {
                    status: 'OPEN',
                },
                include: {
                    relievers: true,
                    center: true,
                },
            });
        },
        //fetch jobs reliever applied
        getJobsByReliever: async (_, { date_from, date_to }) => {
            // if (!userId) {
            //   throw AuthenticationError
            // }
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
        },
        //fetch job by ID
        getJobById: async (_, { job_id }) => {
            // if (!userId) {
            //   throw AuthenticationError
            // }
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
            });
        },
    },
    Mutation: {
        //create a reliever
        addReliever: async (_, args) => {
            try {
                const validatedData = createUserSchema.parse(args);
                const { first_name, last_name, phone, email, password } = validatedData;
                const hashedPwd = await bcrypt.hash(password, 10);
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
                });
                return reliever;
            }
            catch (error) {
                if (error.message.includes('Reliever_email_key')) {
                    throw new Error('This email has been registered.');
                }
            }
        },
        //update reliever
        updateReliever: async (_, args) => {
            try {
                const validatedData = updateUserSchema.parse(args);
                const { bio, email, photo_url } = validatedData;
                const reliever = await prisma.reliever.update({
                    where: { email: email },
                    data: {
                        bio: bio,
                        photo_url: photo_url,
                        qualified: args.qualified,
                    },
                });
                return reliever;
            }
            catch (error) {
                throw new Error('Bio must contain at most 1000 characters.');
            }
        },
        // update a center
        updateCenter: async (_, args) => {
            try {
                const validatedData = updateCenterSchema.parse(args);
                const { description, photo_url } = validatedData;
                const center = await prisma.center.update({
                    where: { ECE_id: args.ECE_id },
                    data: {
                        description,
                        photo_url,
                    },
                });
                return center;
            }
            catch (error) {
                throw new Error('Description must contain at most 1000 characters.');
            }
        },
        //create a manager
        addManager: async (_, args) => {
            try {
                const validatedData = createUserSchema.parse(args);
                const { first_name, last_name, phone, email, password } = validatedData;
                const hashedPwd = await bcrypt.hash(password, 10);
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
                });
                return manager;
            }
            catch (error) {
                if (error.message.includes('Manager_email_key')) {
                    throw new Error('This email has been registered.');
                }
                if (error.message.includes('Manager_ECE_id_key')) {
                    throw new Error('This centre has a manager registered.');
                }
            }
        },
        //add a post
        addPost: async (_, args) => {
            try {
                const validatedData = createPostSchema.parse(args);
                const { date_from, date_to, time, qualified } = validatedData;
                const post = await prisma.job.create({
                    data: {
                        center_id: args.center_id,
                        date_from,
                        date_to,
                        time,
                        qualified,
                        status: 'OPEN',
                    },
                });
                return post;
            }
            catch (error) {
                console.log(error.message);
            }
        },
        //update a post
        updatePost: async (_, args) => {
            try {
                const validatedData = updatePostSchema.parse(args);
                const { date_from, date_to, time, qualified, post_id } = validatedData;
                const post = await prisma.job.update({
                    where: {
                        id: post_id,
                    },
                    data: {
                        date_from,
                        date_to,
                        time,
                        qualified,
                        status: args.status,
                    },
                });
                return post;
            }
            catch (error) {
                console.log(error.message);
            }
        },
        //update a Job by adding an applicant
        applyJob: async (_, { id, relieverID }) => {
            try {
                const applied = await prisma.job.findUnique({
                    where: {
                        id: id,
                    },
                    select: {
                        relieverIDs: true,
                    },
                });
                const declined = await prisma.job.findUnique({
                    where: {
                        id: id,
                    },
                    select: {
                        declined_relieverIDs: true,
                    },
                });
                if (applied &&
                    !applied.relieverIDs.includes(relieverID) &&
                    !declined.declined_relieverIDs.includes(relieverID)) {
                    const updatedJob = await prisma.job.update({
                        where: {
                            id: id,
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
                    throw new Error('You have applied or declined the job.');
                }
            }
            catch (error) {
                console.log(error.message);
            }
        },
        //When a reliever declines the job
        declineJob: async (_, { id, relieverID }) => {
            try {
                const declined = await prisma.job.findUnique({
                    where: {
                        id: id,
                    },
                    select: {
                        declined_relieverIDs: true,
                    },
                });
                const applied = await prisma.job.findUnique({
                    where: {
                        id: id,
                    },
                    select: {
                        relieverIDs: true,
                    },
                });
                if (declined &&
                    !declined.declined_relieverIDs.includes(relieverID) &&
                    !applied.relieverIDs.includes(relieverID)) {
                    const updatedJob = await prisma.job.update({
                        where: {
                            id: id,
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
                    throw new Error('You have declined or applied the job.');
                }
            }
            catch (error) {
                console.log(error.message);
            }
        },
        //When a manager accpets a job
        acceptJob: async (_, { id, relieverID }) => {
            try {
                const declined = await prisma.job.findUnique({
                    where: {
                        id: id,
                    },
                    select: {
                        declined_relieverIDs: true,
                    },
                });
                const applied = await prisma.job.findUnique({
                    where: {
                        id: id,
                    },
                    select: {
                        relieverIDs: true,
                    },
                });
                if (applied &&
                    !declined.declined_relieverIDs.includes(relieverID) &&
                    applied.relieverIDs.includes(relieverID)) {
                    const updatedJob = await prisma.job.update({
                        where: {
                            id: id,
                        },
                        data: {
                            relieverIDs: relieverID,
                            status: 'FUFILLED',
                        },
                    });
                    return updatedJob;
                }
                else {
                    throw new Error('You have not applied for this job.');
                }
            }
            catch (error) {
                console.log(error.message);
            }
        },
        //When a reliever gets a job
        getJob: async (_, { id, jobID }) => {
            try {
                const existing = await prisma.reliever.findUnique({
                    where: {
                        id: id,
                    },
                    select: {
                        jobIDs: true,
                    },
                });
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
                    });
                    const jobs = await prisma.reliever.findMany({
                        where: {
                            id: id,
                        },
                        select: {
                            jobs: true,
                        },
                    });
                    const unavailableDates = extractDatesFromArray(jobs[0].jobs);
                    const updatedReliever2 = await prisma.reliever.update({
                        where: {
                            id: id,
                        },
                        data: {
                            not_available_dates: unavailableDates,
                        },
                    });
                    return updatedReliever2;
                }
                else {
                    throw new Error('You have been confirmed for this job.');
                }
            }
            catch (error) {
                console.log(error.message);
            }
        },
        //update reliever's unavailable dates when job is cancelled
        updateUnavailableDates: async (_, { relieverID, jobID }) => {
            try {
                const job = await prisma.job.findUnique({
                    where: {
                        id: jobID,
                    },
                    select: {
                        date_from: true,
                        date_to: true,
                    },
                });
                const cancelledDates = [];
                const dateFromObj = dayjs(convertDate(job.date_from));
                const dateToObj = dayjs(convertDate(job.date_to));
                let currentDate = dateFromObj;
                while (currentDate.isSame(dateToObj) ||
                    currentDate.isBefore(dateToObj)) {
                    cancelledDates.push(currentDate.format('DD/MM/YYYY'));
                    currentDate = currentDate.add(1, 'day');
                }
                const reliever = await prisma.reliever.findUnique({
                    where: {
                        id: relieverID,
                    },
                    select: {
                        not_available_dates: true,
                    },
                });
                const updated_not_available_dates = reliever.not_available_dates.filter((date) => !cancelledDates.find((cancelledDate) => cancelledDate === date));
                const updatedReliever = await prisma.reliever.update({
                    where: {
                        id: relieverID,
                    },
                    data: {
                        not_available_dates: updated_not_available_dates,
                    },
                });
                return updatedReliever;
            }
            catch (error) {
                console.log(error.message);
            }
        },
        //delete a reliever
        deleteReliever: async (_, { email }) => {
            const deleteReliever = await prisma.reliever.delete({
                where: {
                    email: email,
                },
            });
            return deleteReliever;
        },
        //delete a manager
        deleteManager: async (_, { email }) => {
            const deleteManager = await prisma.manager.delete({
                where: {
                    email: email,
                },
            });
            return deleteManager;
        },
    },
};
