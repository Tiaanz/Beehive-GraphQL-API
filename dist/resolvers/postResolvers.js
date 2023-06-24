import { ForbiddenError, InvalidInputError } from '../utils/errors.js';
import { prisma } from '../db.js';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
dayjs.extend(customParseFormat);
export const postResolvers = {
    Query: {
        //fetch posts by center
        getPostsByCenter: async (_, { center_id }, { userRole }) => {
            try {
                if (userRole !== 'MANAGER') {
                    throw ForbiddenError("You are not authorised.");
                }
                const center = await prisma.center.findUnique({
                    where: { ECE_id: center_id },
                });
                if (!center) {
                    throw InvalidInputError("This centerId is invalid.");
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
                if (error.message.includes("authorised")) {
                    throw ForbiddenError('You are not authorised.');
                }
                if (error.message.includes("centerId")) {
                    throw InvalidInputError("This centerId is invalid.");
                }
            }
        },
        //fetch posts by center by date
        getPostsByDate: async (_, { center_id, date_from, date_to }, { userRole }) => {
            try {
                if (userRole !== 'MANAGER') {
                    throw ForbiddenError("You are not authorised.");
                }
                const center = await prisma.center.findUnique({
                    where: { ECE_id: center_id },
                });
                if (!center) {
                    throw InvalidInputError("This centerId is invalid.");
                }
                console.log(dayjs("2021/02/32", 'YYYY/MM/DD', true).isValid());
                if (!dayjs(date_from, "YYYY/MM/DD", true).isValid() || !dayjs(date_to, "YYYY/MM/DD", true).isValid()) {
                    throw InvalidInputError("Invalid dates input.");
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
                if (error.message.includes("authorised")) {
                    throw ForbiddenError('You are not authorised.');
                }
                if (error.message.includes("centerId")) {
                    throw InvalidInputError("This centerId is invalid.");
                }
                if (error.message.includes("dates")) {
                    throw InvalidInputError("Invalid dates input.");
                }
            }
        },
    },
};
