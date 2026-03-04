import Fastify from 'fastify';
import cors from '@fastify/cors';
import { log, logsHistory } from 'logger';
import { generateSymmetricKeyAndIV, encryptSymmetric, decryptSymmetric } from 'crypto-core';

const fastify = Fastify({ logger: true });
await fastify.register(cors);

// Em memória p/ estudos (num app real isso vem do DB ou do Client)
let currentSession = null;

fastify.get('/', async (request, reply) => {
    log("Health check pinged");
    return { status: "Sym Crypto service is running" };
});

fastify.get('/logs', async (request, reply) => {
    return { logs: logsHistory };
});

fastify.post('/encrypt', async (request, reply) => {
    const { message } = request.body;
    log(`Starting Symmetric Encryption (AES-256-CBC)`);

    // Gera chaves da sessão dinamicamente pra UI ver
    currentSession = generateSymmetricKeyAndIV();
    log(`Generated Key: ${currentSession.key}`);

    const encrypted = encryptSymmetric(message, currentSession.key, currentSession.iv);
    log(`Result: ${encrypted}`);

    return {
        original: message,
        encrypted,
        keyUsed: currentSession.key,
        ivUsed: currentSession.iv
    };
});

fastify.post('/decrypt', async (request, reply) => {
    const { encrypted } = request.body;
    log(`Starting Decryption`);

    if (!currentSession) return reply.status(400).send({ error: "No active keys/session to decrypt." });

    const decrypted = decryptSymmetric(encrypted, currentSession.key, currentSession.iv);
    log(`Restored payload: ${decrypted}`);

    return { encrypted, decrypted, success: true };
});

const start = async () => {
    try {
        await fastify.listen({ port: 3003 });
        console.log("Server listening at http://localhost:3003");
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();
