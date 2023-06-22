import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import { typeDefs } from './schema.js'
import { resolvers } from './resolvers.js'
import { prisma } from './db.js'
import { AuthenticationError } from './utils/errors.js'
import { config } from 'dotenv'
config()
;(async function () {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
  })

  const { url } = await startStandaloneServer(server, {
    /* add authentication to the api */
    context: async ({ req }) => {
      // Get the user token from the headers.
      const token = req.headers.authorization 
      console.log("token",token);
      
      
      const relieverRes = await prisma.reliever.findFirst({
        where: { token },
      })
      const managerRes = await prisma.manager.findFirst({
        where: { token },
      })

      console.log(managerRes);
      
      // Add the user to the context
      if (relieverRes) {
        return { userId: relieverRes.id, userRole: relieverRes.role }
      } else if (managerRes) {
        return { userId: managerRes.id, userRole: managerRes.role }
      } else {
        return { userId: 100001, userRole: 'GUEST' }
      }
      
    },
    listen: { port: process.env.PORT ? parseInt(process.env.PORT, 10) : 4000 },
  })

  console.log('server is ready at' + ' ' + url)
})()
