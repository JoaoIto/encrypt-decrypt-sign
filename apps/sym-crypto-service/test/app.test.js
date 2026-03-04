import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/index.js';

describe('Symmetric Crypto VM - API Integration Tests', () => {
    beforeAll(async () => {
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    it('Should return 200 OK Healthcheck via GET /', async () => {
        const response = await request(app.server).get('/');
        expect(response.status).toBe(200);
        expect(response.body.status).toBe("Sym Crypto service is running");
    });

    it('Should emit logs in GET /logs route', async () => {
        const response = await request(app.server).get('/logs');
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.logs)).toBe(true);
    });

    it('Should simulate end-to-end symmetric encryption flow', async () => {
        const payload = "Bilion Dollar Contract Details";

        // 1. Fase de Encriptação POST (Gera AES-256 Key na RAM da VM e retorna cipher)
        const encryptResponse = await request(app.server)
            .post('/encrypt')
            .send({ message: payload });

        expect(encryptResponse.status).toBe(200);
        expect(encryptResponse.body.encrypted).toBeDefined();
        expect(encryptResponse.body.encrypted).not.toContain(payload);

        // Verifica se a VM criou chaves blindadas
        expect(encryptResponse.body.keyUsed).toBeDefined();

        const aesCipher = encryptResponse.body.encrypted;

        // 2. Fase de Desencriptação (O serviço puxa a Key da memória global instanciada)
        const decryptRes = await request(app.server)
            .post('/decrypt')
            .send({ encrypted: aesCipher });

        expect(decryptRes.status).toBe(200);
        expect(decryptRes.body.success).toBe(true);
        // O texto tem que bater exato!
        expect(decryptRes.body.decrypted).toBe(payload);
    });
});
