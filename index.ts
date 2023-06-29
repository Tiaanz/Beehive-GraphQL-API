import { ApolloServer } from '@apollo/server'
import { typeDefs } from './schema.js'
import { prisma } from './db.js'
import { centreResolvers } from './resolvers/centreResolvers.js'
import { config } from 'dotenv'
import { relieverResolvers } from './resolvers/relieverResolver.js'
import { managerResolvers } from './resolvers/managerResolvers.js'
import { postResolvers } from './resolvers/postResolvers.js'
import { jobResolvers } from './resolvers/jobResolvers.js'
import { expressMiddleware } from '@apollo/server/express4'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import express from 'express'
import http from 'http'
import cors from 'cors'
import bodyParser from 'body-parser'

config()

const resolvers = {
  Query: {
    ...centreResolvers.Query,
    ...relieverResolvers.Query,
    ...managerResolvers.Query,
    ...postResolvers.Query,
    ...jobResolvers.Query,
  },
  Mutation: {
    ...centreResolvers.Mutation,
    ...relieverResolvers.Mutation,
    ...managerResolvers.Mutation,
    ...postResolvers.Mutation,
    ...jobResolvers.Mutation,
  },
}

interface MyContext {
  token?: String
}

// Required logic for integrating with Express
const app = express()
// Our httpServer handles incoming requests to our Express app.
// Below, we tell Apollo Server to "drain" this httpServer,
// enabling our servers to shut down gracefully.
const httpServer = http.createServer(app)

// Same ApolloServer initialization as before, plus the drain plugin
// for our httpServer.
const server = new ApolloServer<MyContext>({
  typeDefs,
  resolvers,
  introspection: true,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
})
// Ensure we wait for our server to start
await server.start()

// Set up our Express middleware to handle CORS, body parsing,
// and our expressMiddleware function.
app.use(
  '/',
  cors<cors.CorsRequest>({
    origin: [
      'https://beehive-nextjs.vercel.app',
      'http://localhost:3000',
      'https://studio.apollographql.com',
    ],
  }),
  bodyParser.json(),
  // expressMiddleware accepts the same arguments:
  // an Apollo Server instance and optional configuration options
  expressMiddleware(server, {
    context: async ({ req }) => {
      // Get the user token from the headers.
      const token = req.headers.authorization || ''

      const relieverRes = await prisma.reliever.findUnique({
        where: { token },
      })

      const managerRes = await prisma.manager.findUnique({
        where: { token },
      })

      // Add the user to the context
      if (relieverRes) {
        return { userId: relieverRes.id, userRole: relieverRes.role }
      } else if (managerRes) {
        return { userId: managerRes.id, userRole: managerRes.role }
      } else {
        return { userId: 100001, userRole: 'GUEST' }
      }
    },
  })
)

// Modified server startup
await new Promise<void>((resolve) =>
  httpServer.listen(
    { port: process.env.PORT ? parseInt(process.env.PORT, 10) : 4000 },
    resolve
  )
)
console.log(`🚀 Server ready at http://localhost:4000/`)
