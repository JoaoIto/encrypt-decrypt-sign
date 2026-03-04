import Fastify from 'fastify';
import cors from '@fastify/cors';
import { log, logsHistory } from 'logger';
import { generateAsymmetricKeyPair, encryptAsymmetric, decryptAsymmetric } from 'crypto-core';

const fastify = Fastify({ logger: true });
await fastify.register(cors);

let keyPair = generateAsymmetricKeyPair();

fastify.get('/', async (request, reply) => {
    log("Health check pinged");
    return { status: "Asym Crypto service is running" };
});

fastify.get('/logs', async (request, reply) => {
    return { logs: logsHistory };
});

fastify.get('/public-key', async (request, reply) => {
    return { publicKey: keyPair.publicKey };
});

fastify.post('/encrypt', async (request, reply) => {
    const { message } = request.body;
    log(`Encrypting using Public Key RSA 2048`);
    const encrypted = encryptAsymmetric(message, keyPair.publicKey);
    return { original: message, encrypted };
});

fastify.post('/decrypt', async (request, reply) => {
    const { encrypted } = request.body;
    log(`Decrypting using Private Vault Key RSA`);
    const decrypted = decryptAsymmetric(encrypted, keyPair.privateKey);
    return { encrypted, decrypted };
});

const start = async () => {
    try {
        await fastify.listen({ port: 3004 });
        console.log("Server listening at http://localhost:3004");
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();
