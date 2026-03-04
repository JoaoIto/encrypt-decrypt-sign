import Fastify from 'fastify';
import cors from '@fastify/cors';
import { log, logsHistory } from 'logger';
import { encryptCaesar, decryptCaesar } from 'crypto-core';

const fastify = Fastify({ logger: true });
await fastify.register(cors);

fastify.get('/', async (request, reply) => {
    log("Health check pinged");
    return { status: "Cipher service is running" };
});

fastify.get('/logs', async (request, reply) => {
    return { logs: logsHistory };
});

fastify.post('/encrypt', async (request, reply) => {
    const { message } = request.body;
    log(`Encrypting message via Caesar Cipher`);
    const encrypted = encryptCaesar(message);
    return { original: message, encrypted, type: "caesar" };
});

fastify.post('/decrypt', async (request, reply) => {
    const { encrypted } = request.body;
    log(`Decrypting message via Caesar Cipher`);
    const decrypted = decryptCaesar(encrypted);
    return { encrypted, decrypted, type: "caesar" };
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
