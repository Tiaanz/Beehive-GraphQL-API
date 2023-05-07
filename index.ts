import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import { typeDefs } from './schema.js'
import { resolvers } from './resolvers.js'
import { AuthenticationError } from './utils/errors.js'
// import { config } from 'dotenv'
// config();
  
(async function () {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
  })

  const { url } = await startStandaloneServer(server, {
    /* add authentication to the api */
    // context: async ({ req }) => {
    //   // Get the user token from the headers.
    //   const token = req.headers.authorization || ''
    //   // Add the user to the context
    //   if (token === process.env.TOKEN) {
    //     return { userId: 101, userRole: 'MANAGER' }
    //   }
    //   throw AuthenticationError
    // },
    listen: { port: process.env.PORT ? parseInt(process.env.PORT, 10) : 4000 },
  })

  console.log('server is ready at' + url)
})()
