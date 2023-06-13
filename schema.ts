import { gql } from 'graphql-tag'

export const typeDefs = gql`
  type Query {
    getAllRelievers: [Reliever!]!
    getAllManagers: [Manager!]!
    getAllCenters: [Center!]!
    getFilteredCenters(input: String!): [Center!]!
    getOneReliever(email: String!): Reliever
    getOneManager(email: String!): Manager
    getOneCenter(ECE_id:Int!):Center
    getPostsByCenter(center_id:Int!,date_from:String!,date_to:String!):[Job!]!
    getOpenJobs(status:String!):[Job!]!
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
    updateCenter(ECE_id:Int!,description:String,photo_url:String):Center
    addPost(
    center_id:Int!
    date_from:String!
    date_to:String!
    time:String!
    qualified:Boolean!
    ):Job
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
    description: String
    photo_url: String
    posts: [Job]
  }

  type Job {
    id: String!
    center: Center!
    center_id:Int!
    date_from: String!
    date_to:String!
    time: String!
    qualified: Boolean!
    reliever: Reliever
    status: String!
  }
`
