import { prisma } from './db.js';
import bcrypt from 'bcrypt';
import { createUserSchema, updateCenterSchema, updateUserSchema, createPostSchema, } from './data-validation.js';
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
        getPostsByCenter: async (_, { center_id }) => {
            // if (!userId) {
            //   throw AuthenticationError
            // }
            return await prisma.job.findMany({
                where: { center_id },
                include: {
                    reliever: true,
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
