import { prisma } from './db.js';
export const resolvers = {
    Query: {
        getAllUsers: async () => {
            return await prisma.user.findMany();
        },
    },
    Mutation: {
        addUser: async (_, args) => {
            const user = await prisma.user.create({
                data: {
                    first_name: args.first_name,
                    last_name: args.last_name,
                    phone: args.phone,
                    email: args.email,
                    password: args.password,
                    role: args.role,
                    ECE_id: args.ECE_id
                },
            });
            return user;
        },
    },
};
