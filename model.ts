import { Role } from '@prisma/client'

export interface addUserInput {
  first_name: string
  last_name: string
  phone: string
  email: string
  password: string
  role: Role
  ECE_id?: number
}

