import { gql } from 'graphql-tag'

export const typeDefs = gql`
  type Query {
    getAllRelievers: [Reliever!]!
    getAllManagers: [Manager!]!
    getAllCenters: [Center!]!
    getFilteredCenters(input: String!): [Center!]!
    getOneReliever(email: String!): Reliever
    getOneManager(email: String!): Manager
  }

  enum Role {
    RELIEVER
    MANAGER
  }

  type Mutation {
    addReliever(
      first_name: String!
      last_name: String!
      phone: String!
      email: String!
      password: String!
      bio: String
      photo_url: String
    ): Reliever
    updateReliever(bio: String, email: String!,photo_url:String): Reliever
    deleteReliever(email: String!): Reliever
    addManager(
      first_name: String!
      last_name: String!
      phone: String!
      email: String!
      ECE_id: Int!
      password: String!
    ): Manager
    deleteManager(email: String): Manager
  }

  type Reliever {
    id: String!
    first_name: String!
    last_name: String!
    phone: String!
    email: String!
    password: String!
    role: String!
    jobs: [Job]
    bio: String
    photo_url: String
  }

  type Manager {
    id: String!
    first_name: String!
    last_name: String!
    phone: String!
    email: String!
    password: String!
    role: String!
    ECE_id: Int!
    center: Center
  }

  type Center {
    id: String!
    ECE_id: Int!
    manager: Manager
    name: String!
    address: String!
    bio: String
    photo_url: String
    posts: [Job]
  }

  type Job {
    id: String!
    center: Center!
    date: String!
    time: String!
    unqualified: Boolean!
    reliever: Reliever
    status: String
  }
`
