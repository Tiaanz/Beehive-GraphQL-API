import { prisma } from './db.js';
import bcrypt from 'bcrypt';
import { createUserSchema, updateCenterSchema, updateUserSchema, createPostSchema, updatePostSchema, } from './data-validation.js';
import dayjs from 'dayjs';
function extractDatesFromArray(arr) {
    const dates = [];
    for (let i = 0; i < arr.length; i++) {
        const dateFromObj = dayjs(arr[i].date_from);
        const dateToObj = dayjs(arr[i].date_to);
        let currentDate = dateFromObj;
        while (currentDate.isSame(dateToObj) || currentDate.isBefore(dateToObj)) {
            dates.push(currentDate.format('YYYY/MM/DD'));
            currentDate = currentDate.add(1, 'day');
        }
    }
    return dates;
}
function extractDatesFromDateRange(dateFrom, dateTo) {
    const dates = [];
    const dateFromObj = dayjs(dateFrom);
    const dateToObj = dayjs(dateTo);
    let currentDate = dateFromObj;
    while (currentDate.isSame(dateToObj) || currentDate.isBefore(dateToObj)) {
        dates.push(currentDate.format('YYYY/MM/DD'));
        currentDate = currentDate.add(1, 'day');
    }
    return dates;
}
export const resolvers = {
    Query: {
        //fetch all relievers
        getAllRelievers: async (_, __) => {
            try {
                // if (!userId) {
                //   throw AuthenticationError
                // }
                return await prisma.reliever.findMany({
                    include: {
                        jobs: true,
                    },
                });
            }
            catch (error) {
                console.log(error.message);
            }
        },
        //fetch all managers
        getAllManagers: async (_, __) => {
            try {
                // if (!userId) {
                //   throw AuthenticationError
                // }
                return await prisma.manager.findMany({
                    include: {
                        center: true,
                    },
                });
            }
            catch (error) {
                console.log(error.messgae);
            }
        },
        //fetch all centers
        getAllCenters: async (_, __) => {
            try {
                // if (!userId) {
                //   throw AuthenticationError
                // }
                return await prisma.center.findMany({
                    include: {
                        manager: true,
                        posts: true,
                    },
                });
            }
            catch (error) {
                console.log(error.message);
            }
        },
        //get one center
        getOneCenter: async (_, { ECE_id }) => {
            try {
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
            }
            catch (error) {
                console.log(error.message);
            }
        },
        //fetch filtered centers
        getFilteredCenters: async (_, { input }) => {
            try {
                return await prisma.center.findMany({
                    where: {
                        name: {
                            contains: input,
                            mode: 'insensitive',
                        },
                    },
                });
            }
            catch (error) {
                console.log(error.message);
            }
        },
        //fetch one reliever
        getOneReliever: async (_, { email }) => {
            try {
                return await prisma.reliever.findUnique({
                    where: {
                        email: email,
                    },
                    include: {
                        jobs: true,
                    },
                });
            }
            catch (error) {
                console.log(error.message);
            }
        },
        //fetch one reliever by ID
        getRelieverById: async (_, { reliever_id }) => {
            try {
                return await prisma.reliever.findUnique({
                    where: {
                        id: reliever_id,
                    },
                    include: {
                        jobs: true,
                    },
                });
            }
            catch (error) {
                console.log(error.message);
            }
        },
        //fetch one manager
        getOneManager: async (_, { email }) => {
            try {
                return await prisma.manager.findUnique({
                    where: {
                        email: email,
                    },
                });
            }
            catch (error) {
                console.log(error.message);
            }
        },
        //fetch posts by center
        getPostsByCenter: async (_, { center_id, date_from, date_to }) => {
            try {
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
            }
            catch (error) {
                console.log(error.message);
            }
        },
        //fetch posts by month
        getPostsByMonth: async (_, { center_id, date_from, date_to }) => {
            try {
                // if (!userId) {
                //   throw AuthenticationError
                // }
                return await prisma.job.findMany({
                    where: {
                        center_id,
                        date_from: { gte: date_from },
                        date_to: { lte: date_to },
                    },
                    include: {
                        relievers: true,
                        center: true,
                    },
                });
            }
            catch (error) {
                console.log(error.message);
            }
        },
        //fetch "OPEN" jobs
        getOpenJobs: async (_) => {
            try {
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
            }
            catch (error) {
                console.log(error.message);
            }
        },
        //fetch jobs reliever applied
        getJobsByReliever: async (_, { date_from, date_to }) => {
            try {
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
            }
            catch (error) {
                console.log(error.message);
            }
        },
        //fetch job by ID
        getJobById: async (_, { job_id }) => {
            try {
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
            }
            catch (error) {
                console.log(error.message);
            }
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
                console.log(error.message);
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
                console.log(error.message);
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
                console.log(error.message);
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
                console.log(error.message);
            }
        },
        //add a post
        addPost: async (_, args) => {
            try {
                const validatedData = createPostSchema.parse(args);
                const { date_from, date_to, time, qualified } = validatedData;
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
                    });
                    return post;
                }
                else {
                    throw new Error('Date_from should be less than date_to.');
                }
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
                if (new Date(date_from) <= new Date(date_to)) {
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
                else {
                    throw new Error('Date_from should be less than date_to.');
                }
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
                //avoid duplicated relieverId being added
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
                //avoid duplicated relieverId being added
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
                //Make sure the reliever have applied the job and have not declined it
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
                    const job = await prisma.job.findUnique({
                        where: {
                            id: jobID,
                        },
                        select: {
                            date_from: true,
                            date_to: true,
                        },
                    });
                    const unavailableDates = extractDatesFromDateRange(job.date_from, job.date_to);
                    //set unavailable dates
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
                const dateFromObj = dayjs(job.date_from);
                const dateToObj = dayjs(job.date_to);
                let currentDate = dateFromObj;
                while (currentDate.isSame(dateToObj) ||
                    currentDate.isBefore(dateToObj)) {
                    cancelledDates.push(currentDate.format('YYYY/MM/DD'));
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
        // update other jobs' relieverIDs when the reliever gets a job
        updateRelieverIDs: async (_, { relieverID, jobID }) => {
            try {
                const job = await prisma.job.findUnique({
                    where: {
                        id: jobID,
                    },
                });
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
            }
        },
        //delete a reliever
        deleteReliever: async (_, { email }) => {
            try {
                const deleteReliever = await prisma.reliever.delete({
                    where: {
                        email: email,
                    },
                });
                return deleteReliever;
            }
            catch (error) {
                console.log(error.message);
            }
        },
        //delete a manager
        deleteManager: async (_, { email }) => {
            try {
                const deleteManager = await prisma.manager.delete({
                    where: {
                        email: email,
                    },
                });
                return deleteManager;
            }
            catch (error) {
                console.log(error.message);
            }
        },
    },
};
