import { gql } from 'graphql-tag'

export const typeDefs = gql`
  type Query {
    getFilteredCenters(input: String!): [Center!]!
    getRelieverByEmail(email: String!): Reliever
    getRelieverById(reliever_id: String!): Reliever
    getManagerByEmail(email: String!): Manager
    getOneCenter(ECE_id: Int!): Center
    getPostsByCenter(
      center_id: Int!
    ): [Job]
    getPostsByDate(
      center_id: Int!
      date_from: String!
      date_to: String!
    ): [Job]
    getPostsByMonth(
      center_id: Int
      date_from: String!
      date_to: String!
    ): [Job]
    getOpenJobs: [Job]
    getJobsByDate(date_from: String!, date_to: String!): [Job]
    getJobById(job_id: String!): Job
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
      qualified: Boolean!
    ): Reliever
    updateReliever(
      bio: String
      email: String!
      photo_url: String
      qualified: Boolean
    ): Reliever
    addManager(
      first_name: String!
      last_name: String!
      phone: String!
      email: String!
      ECE_id: Int!
      password: String!
    ): Manager
    updateCenter(ECE_id: Int!, description: String, photo_url: String): Center
    addPost(
      center_id: Int!
      date_from: String!
      date_to: String!
      time: String!
      qualified: Boolean!
    ): Job
    updatePost(
      post_id: String!
      time: String
      status: String
    ): Job
    applyJob(jobID: String!, relieverID: String!): Job
    declineJob(jobID: String!, relieverID: String!): Job
    acceptJob(jobID: String!, relieverID: String!): Job
    getJob(relieverID: String!, jobID: String!): Reliever
    updateUnavailableDates(relieverID: String!, jobID: String!): Reliever
    updateRelieverIDs(relieverID: String!, jobID: String!): [Job!]
  }

  type Reliever {
    id: String!
    first_name: String!
    last_name: String!
    phone: String!
    email: String!
    password: String!
    token: String
    qualified: Boolean!
    role: String!
    jobIDs: [String]
    jobs: [Job]
    not_available_dates: [String]
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
    token: String
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
    center_id: Int!
    date_from: String!
    date_to: String!
    time: String!
    qualified: Boolean!
    relievers: [Reliever]
    relieverIDs: [String]
    declined_relieverIDs: [String]
    status: String!
  }
`
