import { gql } from 'graphql-tag'

export const typeDefs = gql`
  type Query {
    getAllUsers: [User!]!
    getAllCenters:[Center!]!
    getOneUser(email:String!):User
  }

  enum Role {
    RELIEVER
    MANAGER
  }

  type Mutation {
    addUser(
      first_name: String!
      last_name: String!
      phone: String!
      email: String!
      ECE_id: Int
      role: Role!
      password: String!
      bio:String
      photo_url:String
    ): User
    deleteUser(email:String!):User
  }

  type User {
    id: String!
    first_name: String!
    last_name: String!
    phone: String!
    email: String!
    role: String!
    jobs: [Job]
    center: Center
    bio:String
    photo_url:String
  }

  type Center {
    id: String!
    ECE_id: Int!
    manager: User
    name: String!
    address: String!
    posts: [Job]
  }

  type Job {
    id: String!
    center: Center!
    date: String!
    time: String!
    unqualified: Boolean!
    reliever: User
    status: String
  }
`
