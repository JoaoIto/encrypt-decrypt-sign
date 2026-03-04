import Fastify from 'fastify';
import cors from '@fastify/cors';
import { log, logsHistory } from 'logger';
import { generateSymmetricKeyAndIV, encryptSymmetric, decryptSymmetric } from 'encrypt-decrypt-sign';

export const app = Fastify({ logger: false }); // Desligado p/ teste limpo
await app.register(cors);

// Em memória p/ estudos (num app real isso vem do DB ou do Client)
let currentSession = null;

app.get('/', async (request, reply) => {
    log("Health check pinged");
    return { status: "Sym Crypto service is running" };
});

app.get('/logs', async (request, reply) => {
    return { logs: logsHistory };
});

app.post('/encrypt', async (request, reply) => {
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

app.post('/decrypt', async (request, reply) => {
    const { encrypted } = request.body;
    log(`Starting Decryption`);

    if (!currentSession) return reply.status(400).send({ error: "No active keys/session to decrypt." });

    const decrypted = decryptSymmetric(encrypted, currentSession.key, currentSession.iv);
    log(`Restored payload: ${decrypted}`);

    return { encrypted, decrypted, success: true };
});

const start = async () => {
    try {
        await app.listen({ port: 3003 });
        console.log("Server listening at http://localhost:3003");
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

if (process.argv[1] && process.argv[1].endsWith('index.js')) {
    start();
}
