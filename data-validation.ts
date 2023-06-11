import { z } from 'zod'


export const createUserSchema = z.object({
  first_name: z.string().max(40),
  last_name: z.string().max(40),
  phone: z.string().min(8).max(11),
  email: z.string().email().max(40),
  password: z
    .string()
    .min(8)
    .max(16)
    .regex(/^(?=.*[A-Za-z])(?=.*\d).*$/, {
      message: 'Password must contain at least one letter and one number',
    }),
})

export const updateUserSchema = z.object({
  email: z.string().email().max(40),
  bio: z.string().max(1000).optional(),
  photo_url: z.string().optional(),
})

export const updateCenterSchema = z.object({
  description: z.string().max(1000).optional(),
  photo_url: z.string().optional(),
})

export const createPostSchema = z.object({
    date:z.string(),
    time:z.string().max(13),
    qualified:z.boolean()
})

