import Fastify from 'fastify';
import FastifyVite from '@fastify/vite';
import { EyePopSdk } from "@eyepop.ai/eyepop";
import pino from 'pino';

const POP_UUID = process.env.EYEPOP_POP_ID || 'e89c6b4ae9da4432b9e9bcef1453ac41';
const POP_API_SECRET = process.env.EYEPOP_API_SECRET || 'AAG7UgPjwOIM_038Q5krZKyBZ0FBQUFBQmx5OWxfeDhtVnVQbW1lMktJUHpjdkdGSEFtODFmb2lBMDdwSW5jWi1KOWtaUmRoaF90aXlua2NVNm5aN3Jic25BWDVXZERtSDZNQ2s3bklMLXItYXJ0YWdnSVpSdkZiNnpadzdPejZ1SjhnMl81dE09';


const server = Fastify()

await server.register(FastifyVite, {
    root: import.meta.url,
    dev: process.argv.includes('--dev'),
    spa: true
})

server.get('/', (req, reply) =>
{
    return reply.html()
})

server.get('/eyepop/session', async (req, reply) =>
{
    console.log('Authenticating EyePop Session', req.query);
    // check if the request is from an authenticated user
    const isAuthenticated = req.headers.authorization;
    if (!isAuthenticated)
    {
        // console.log('Handle unauthorized request here');
    }

    try
    {

        const endpoint = await EyePopSdk.endpoint({ popId: POP_UUID, auth: { secretKey: POP_API_SECRET } }).connect();
        let session = await endpoint.session();

        session = JSON.stringify(session);

        console.log('New EyePop Session:', session)

        reply.send(session);

    } catch (error)
    {
        console.error('Error:', error);
        reply.send(JSON.stringify({ error }));
    }
});

server.setNotFoundHandler((req, reply) =>
{
    reply.code(404).send('Not Found')
})



await server.vite.ready()
await server.listen({ port: 3000 })
