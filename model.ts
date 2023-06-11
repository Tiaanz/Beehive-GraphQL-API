

export interface addUserInput {
  first_name: string
  last_name: string
  phone: string
  email: string
  password: string
  ECE_id?: number
}

export interface updateUserInput {
  bio?: string
  email: string
  photo_url?:string
}

export interface updateCenterInput{
  ECE_id:number
  description?: string
  photo_url?:string
}
