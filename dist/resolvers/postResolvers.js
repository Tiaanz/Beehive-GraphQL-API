import { ForbiddenError, InvalidInputError } from '../utils/errors.js';
import { prisma } from '../db.js';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import { createPostSchema, updatePostSchema } from '../data-validation.js';
import { validateTime } from '../utils/helper.js';
dayjs.extend(customParseFormat);
export const postResolvers = {
    Query: {
        //fetch posts by center
        getPostsByCenter: async (_, { center_id }, { userRole }) => {
            try {
                if (userRole !== 'MANAGER') {
                    throw ForbiddenError('You are not authorised.');
                }
                const center = await prisma.center.findUnique({
                    where: { ECE_id: center_id },
                });
                if (!center) {
                    throw InvalidInputError('This centerId is invalid.');
                }
                return await prisma.job.findMany({
                    where: {
                        center_id,
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
                if (error.message.includes('centerId')) {
                    throw InvalidInputError('This centerId is invalid.');
                }
            }
        },
        //fetch posts by center by date
        getPostsByDate: async (_, { center_id, date_from, date_to }, { userRole }) => {
            try {
                if (userRole !== 'MANAGER') {
                    throw ForbiddenError('You are not authorised.');
                }
                const center = await prisma.center.findUnique({
                    where: { ECE_id: center_id },
                });
                if (!center) {
                    throw InvalidInputError('This centerId is invalid.');
                }
                if (!dayjs(date_from, 'YYYY/MM/DD', true).isValid() ||
                    !dayjs(date_to, 'YYYY/MM/DD', true).isValid()) {
                    throw InvalidInputError('Invalid dates input.');
                }
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
                if (error.message.includes('authorised')) {
                    throw ForbiddenError('You are not authorised.');
                }
                if (error.message.includes('centerId')) {
                    throw InvalidInputError('This centerId is invalid.');
                }
                if (error.message.includes('dates')) {
                    throw InvalidInputError('Invalid dates input.');
                }
            }
        },
        //fetch posts by month
        getPostsByMonth: async (_, { center_id, date_from, date_to }, { userRole }) => {
            try {
                if (userRole === 'GUEST') {
                    throw ForbiddenError('You are not authorised.');
                }
                if (center_id) {
                    const center = await prisma.center.findUnique({
                        where: { ECE_id: center_id },
                    });
                    if (!center) {
                        throw InvalidInputError('This centerId is invalid.');
                    }
                }
                if (!dayjs(date_from, 'YYYY/MM/DD', true).isValid()) {
                    throw InvalidInputError('Invalid dates input.');
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
                });
            }
            catch (error) {
                console.log(error.message);
                if (error.message.includes('authorised')) {
                    throw ForbiddenError('You are not authorised.');
                }
                if (error.message.includes('centerId')) {
                    throw InvalidInputError('This centerId is invalid.');
                }
                if (error.message.includes('dates')) {
                    throw InvalidInputError('Invalid dates input.');
                }
            }
        },
    },
    Mutation: {
        //add a post
        addPost: async (_, args, { userRole }) => {
            try {
                if (userRole !== 'MANAGER') {
                    throw ForbiddenError('You are not authorised.');
                }
                const validatedData = createPostSchema.parse(args);
                const { date_from, date_to, time, qualified } = validatedData;
                const center = await prisma.center.findUnique({
                    where: { ECE_id: args.center_id },
                });
                if (!center) {
                    throw InvalidInputError('This centerId is invalid.');
                }
                if (!validateTime(time)) {
                    throw InvalidInputError('Invalid time input.');
                }
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
                    throw InvalidInputError('date_from should be less than date_to.');
                }
            }
            catch (error) {
                console.log(error.message);
                if (error.message.includes('authorised')) {
                    throw ForbiddenError('You are not authorised.');
                }
                if (error.message.includes('centerId')) {
                    throw InvalidInputError('This centerId is invalid.');
                }
                if (error.message.includes('date')) {
                    throw InvalidInputError('date_from should be less than date_to.');
                }
                if (error.message.includes('time')) {
                    throw InvalidInputError('Invalid time input.');
                }
            }
        },
        //update a post
        updatePost: async (_, args, { userRole }) => {
            try {
                if (userRole !== 'MANAGER') {
                    throw ForbiddenError('You are not authorised.');
                }
                const validatedData = updatePostSchema.parse(args);
                const { time, post_id } = validatedData;
                //check if the post exists
                const job = await prisma.job.findUnique({
                    where: {
                        id: post_id,
                    },
                });
                if (!job) {
                    throw InvalidInputError('This postId is invalid.');
                }
                if (time) {
                    if (!validateTime(time)) {
                        throw InvalidInputError('Invalid time input');
                    }
                    const post = await prisma.job.update({
                        where: {
                            id: post_id,
                        },
                        data: {
                            time,
                            status: args.status,
                        },
                    });
                    return post;
                }
                else {
                    const post = await prisma.job.update({
                        where: {
                            id: post_id,
                        },
                        data: {
                            status: args.status,
                        },
                    });
                    return post;
                }
            }
            catch (error) {
                console.log(error.message);
                if (error.message.includes('authorised')) {
                    throw ForbiddenError('You are not authorised.');
                }
                if (error.message.includes('postId')) {
                    throw InvalidInputError('This postId is invalid.');
                }
                if (error.message.includes('status')) {
                    throw InvalidInputError('Invalid status input');
                }
                if (error.message.includes('time')) {
                    throw InvalidInputError('Invalid time input.');
                }
            }
        },
    },
};
