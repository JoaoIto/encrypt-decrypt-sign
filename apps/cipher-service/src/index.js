import Fastify from 'fastify';
import cors from '@fastify/cors';
import { log } from 'logger';

const fastify = Fastify({ logger: true });
await fastify.register(cors);

fastify.get('/', async (request, reply) => {
    log("Health check pinged");
    return { status: "Cipher service is running" };
});

const start = async () => {
    try {
        await fastify.listen({ port: 3001 });
        console.log("Server listening at http://localhost:3001");
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();
