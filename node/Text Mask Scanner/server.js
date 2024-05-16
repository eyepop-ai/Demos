import Fastify from 'fastify';
import FastifyVite from '@fastify/vite';
import process from 'process';

const server = Fastify()
server.setNotFoundHandler(async (request, reply) =>
{
    return reply.html()
});

await server.register(FastifyVite, {
    root: import.meta.url,
    dev: process.argv.includes('--dev'),
    spa: true,
    sourceMap: true,
});

server.get('/', (req, reply) =>
{
    return reply.html()
});

await server.vite.ready()

const PORT = process.env.PORT || 8080;
await server.listen({ port: PORT })

console.log(`Server is running on http://localhost:${PORT}`);  
