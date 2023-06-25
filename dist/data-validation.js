import { z } from 'zod';
export const createUserSchema = z.object({
    first_name: z.string().min(1).max(40),
    last_name: z.string().min(1).max(40),
    phone: z.string().min(8).max(11),
    email: z.string().email().max(40),
    password: z
        .string()
        .min(8)
        .max(16)
        .regex(/^(?=.*[A-Za-z])(?=.*\d).*$/, {
        message: 'Password must contain at least one letter and one number',
    }),
});
export const updateUserSchema = z.object({
    email: z.string().email().max(40),
    bio: z.string().max(1000).optional(),
    photo_url: z.string().optional(),
});
export const updateCenterSchema = z.object({
    description: z.string().max(1000).optional(),
    photo_url: z.string().optional(),
});
export const createPostSchema = z.object({
    date_from: z.string().min(10).max(10),
    date_to: z.string().min(10).max(10),
    time: z.string().min(19).max(19),
    qualified: z.boolean(),
});
export const updatePostSchema = z.object({
    post_id: z.string(),
    time: z.string().min(19).max(19).optional(),
    status: z.string().optional()
});
