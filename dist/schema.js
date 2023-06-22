import { gql } from 'graphql-tag';
export const typeDefs = gql `
  type Query {
    getAllRelievers: [Reliever!]!
    getFilteredCenters(input: String!): [Center!]!
    getOneReliever(email: String!): Reliever
    getRelieverById(reliever_id: String!): Reliever
    getOneManager(email: String!): Manager
    getOneCenter(ECE_id: Int!): Center
    getPostsByCenter(
      center_id: Int!
      date_from: String
      date_to: String
    ): [Job]
    getPostsByMonth(
      center_id: Int
      date_from: String!
      date_to: String!
    ): [Job]
    getOpenJobs: [Job]
    getJobsByReliever(date_from: String!, date_to: String!): [Job]
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
      date_from: String
      date_to: String
      time: String
      qualified: Boolean
      status: String
    ): Job
    applyJob(id: String!, relieverID: String!): Job
    declineJob(id: String!, relieverID: String!): Job
    acceptJob(id: String!, relieverID: String!): Job
    getJob(id: String!, jobID: String!): Reliever
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
`;
