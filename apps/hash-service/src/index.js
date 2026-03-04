import Fastify from 'fastify';
import cors from '@fastify/cors';
import { log, logsHistory } from 'logger';
import { hashPassword, verifyPassword } from 'crypto-core';

const fastify = Fastify({ logger: true });
await fastify.register(cors);

fastify.get('/', async (request, reply) => {
    log("Health check pinged");
    return { status: "Hash service is running" };
});

fastify.get('/logs', async (request, reply) => {
    return { logs: logsHistory };
});

fastify.post('/encrypt', async (request, reply) => {
    const { message } = request.body;
    log(`Generating Scrypt Hash with Salt for payload`);
    const hash = hashPassword(message); // Retorna salt:hash
    return { original: message, encrypted: hash, type: "one-way-hash" };
});

fastify.post('/decrypt', async (request, reply) => {
    const { encrypted, originalQuery } = request.body;
    log(`Validating Hash (Decrypt is impossible, we verify instead)`);

    const isValid = verifyPassword(originalQuery, encrypted);
    log(`Hash validation result: ${isValid}`);

    return {
        encrypted,
        decrypted: isValid ? originalQuery : "FAILED",
        success: isValid
    };
});

const start = async () => {
    try {
        await fastify.listen({ port: 3002 });
        console.log("Server listening at http://localhost:3002");
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();
