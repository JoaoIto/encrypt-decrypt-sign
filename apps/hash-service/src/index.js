import Fastify from 'fastify';
import cors from '@fastify/cors';
import { log, logsHistory } from 'logger';
import { hashPassword, verifyPassword } from 'encrypt-decrypt-sign';

export const app = Fastify({ logger: false }); // Desligado pra teste
await app.register(cors);

app.get('/', async (request, reply) => {
    log("Health check pinged");
    return { status: "Hash service is running" };
});

app.get('/logs', async (request, reply) => {
    return { logs: logsHistory };
});

app.post('/encrypt', async (request, reply) => {
    const { message } = request.body;
    log(`Generating Scrypt Hash with Salt for payload`);
    const hash = hashPassword(message); // Retorna salt:hash
    return { original: message, encrypted: hash, type: "one-way-hash" };
});

app.post('/decrypt', async (request, reply) => {
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
        await app.listen({ port: 3002 });
        console.log("Server listening at http://localhost:3002");
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

// Auto-start apenas se o arquivo for rodado diretamente (Ex: npm run dev) e não incluído por vitest
if (process.argv[1] && process.argv[1].endsWith('index.js')) {
    start();
}
