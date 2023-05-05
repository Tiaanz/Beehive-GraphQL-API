import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { typeDefs } from './schema.js';
import { resolvers } from './resolvers.js';
(async function () {
    const server = new ApolloServer({
        typeDefs,
        resolvers,
        introspection: true,
    });
    const { url } = await startStandaloneServer(server, {
        listen: { port: process.env.PORT ? parseInt(process.env.PORT, 10) : 4000 },
    });
    console.log('server is ready at' + url);
})();
