import Fastify from 'fastify';
import FastifyVite from '@fastify/vite';
import { EyePopSdk } from "@eyepop.ai/eyepop";

const POP_UUID = process.env.EYEPOP_POP_ID || 'aee2bc9258df4addad007c25d00f75a1';
const POP_API_SECRET = process.env.EYEPOP_API_SECRET || 'AAFal4-kPIi6jNSJ8QvwNKEyZ0FBQUFBQmx6UTZuRGYtQkhob3Q2Yk1oc0FVSXFXbHlOc0RXTXJSX3VrWVRQX3hzTXBHeENqX1BWcW5nUWFxTU5Cb25sTWN2SGxyWFIyM0FDS1NpXzBrUWpES20yU21jM1VlWVUzeFBlWXc3YXh0REV5TElobms9';

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
    console.log('Authenticating EyePop Session');
    // check if the request is from an authenticated user
    const isAuthenticated = req.headers.authorization;
    if (!isAuthenticated)
    {
        // console.log('Handle unauthorized request here');
    }

    try
    {

        const endpoint = await EyePopSdk.endpoint(
            {
                popId: POP_UUID,
                auth: { secretKey: POP_API_SECRET }
            }).connect();

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
