import Fastify from 'fastify';
import cors from '@fastify/cors';
import { log, logsHistory } from 'logger';
import { generateAsymmetricKeyPair, encryptAsymmetric, decryptAsymmetric } from 'crypto-core';

export const app = Fastify({ logger: false });
await app.register(cors);

let keyPair = generateAsymmetricKeyPair();

app.get('/', async (request, reply) => {
    log("Health check pinged");
    return { status: "Asym Crypto service is running" };
});

app.get('/logs', async (request, reply) => {
    return { logs: logsHistory };
});

app.get('/public-key', async (request, reply) => {
    return { publicKey: keyPair.publicKey };
});

app.post('/encrypt', async (request, reply) => {
    const { message } = request.body;
    log(`Encrypting using Public Key RSA 2048`);
    const encrypted = encryptAsymmetric(message, keyPair.publicKey);
    return { original: message, encrypted };
});

app.post('/decrypt', async (request, reply) => {
    const { encrypted } = request.body;
    log(`Decrypting using Private Vault Key RSA`);
    const decrypted = decryptAsymmetric(encrypted, keyPair.privateKey);
    return { encrypted, decrypted };
});

const start = async () => {
    try {
        await app.listen({ port: 3004 });
        console.log("Server listening at http://localhost:3004");
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

// Start logic if running via CLI directly
if (process.argv[1] && process.argv[1].endsWith('index.js')) {
    start();
}
