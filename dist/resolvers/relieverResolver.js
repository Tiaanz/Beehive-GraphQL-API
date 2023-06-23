import { createUserSchema, updateUserSchema } from '../data-validation.js';
import { prisma } from '../db.js';
import { ForbiddenError, InvalidInputError } from '../utils/errors.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
export const relieverResolvers = {
    Query: {
        //fetch one reliever
        getRelieverByEmail: async (_, { email }) => {
            try {
                const reliever = await prisma.reliever.findUnique({
                    where: {
                        email: email,
                    },
                    include: {
                        jobs: true,
                    },
                });
                if (!reliever) {
                    throw InvalidInputError('The email is invalid.');
                }
                return reliever;
            }
            catch (error) {
                console.log(error.message);
                if (error.message.includes('email')) {
                    throw InvalidInputError('The email is invalid.');
                }
            }
        },
        //fetch one reliever by ID
        getRelieverById: async (_, { reliever_id }, { userRole }) => {
            try {
                if (userRole === 'GUEST') {
                    throw ForbiddenError('You are not authorised.');
                }
                const reliever = await prisma.reliever.findUnique({
                    where: {
                        id: reliever_id,
                    },
                    include: {
                        jobs: true,
                    },
                });
                return reliever;
            }
            catch (error) {
                console.log(error.message);
                if (error.message.includes('authorised')) {
                    throw ForbiddenError('You are not authorised.');
                }
                throw InvalidInputError('The relieverId is invalid.');
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
                const token = jwt.sign({ user_id: reliever.id, email: reliever.email }, process.env.TOKEN);
                const relieverWithToken = await prisma.reliever.update({
                    where: {
                        id: reliever.id,
                    },
                    data: {
                        token: token,
                    },
                });
                return relieverWithToken;
            }
            catch (error) {
                if (error.message.includes('Reliever_email_key')) {
                    throw InvalidInputError('This email has been registered.');
                }
                console.log(error.message);
            }
        },
        //update reliever
        updateReliever: async (_, args, { userRole }) => {
            try {
                if (userRole !== 'RELIEVER') {
                    throw ForbiddenError('You are not authorised.');
                }
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
                if (!reliever) {
                    throw InvalidInputError('The email is invalid.');
                }
                return reliever;
            }
            catch (error) {
                console.log(error.message);
                if (error.message.includes('authorised')) {
                    throw ForbiddenError('You are not authorised.');
                }
                if (error.message.includes('email')) {
                    throw InvalidInputError('The email is invalid.');
                }
                if (error.message.includes("too_big")) {
                    throw InvalidInputError("Bio must contain at most 1000 characters.");
                }
            }
        },
    },
};
