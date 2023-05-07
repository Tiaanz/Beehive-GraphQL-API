import { prisma } from './db.js';
import { AuthenticationError } from './utils/errors.js';
export const resolvers = {
    Query: {
        //fetch all users
        getAllUsers: async (_, __) => {
            // if (!userId) {
            //   throw AuthenticationError
            // }
            return await prisma.user.findMany({
                include: {
                    center: true,
                    jobs: true,
                },
            });
        },
        //fetch all centers
        getAllCenters: async (_, __, { userId }) => {
            if (!userId) {
                throw AuthenticationError;
            }
            console.log(userId);
            return await prisma.center.findMany({
                include: {
                    manager: true,
                    posts: true,
                },
            });
        },
    },
    Mutation: {
        //create a user
        addUser: async (_, args) => {
            const user = await prisma.user.create({
                data: {
                    first_name: args.first_name,
                    last_name: args.last_name,
                    phone: args.phone,
                    email: args.email,
                    password: args.password,
                    role: args.role,
                    ECE_id: args.ECE_id,
                },
            });
            return user;
        },
        //delete a user
        deleteUser: async (_, { email }) => {
            const deleteUser = await prisma.user.delete({
                where: {
                    email: email,
                },
            });
            return deleteUser;
        },
    },
};
