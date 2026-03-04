import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/index.js';

describe('Hash VM - API Integration Tests', () => {
    beforeAll(async () => {
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    it('Should return 200 OM Healthcheck via GET /', async () => {
        const response = await request(app.server).get('/');
        expect(response.status).toBe(200);
        expect(response.body.status).toBe("Hash service is running");
    });

    it('Should emit proper JSON in GET /logs telemetry route', async () => {
        const response = await request(app.server).get('/logs');
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('logs');
        expect(Array.isArray(response.body.logs)).toBe(true);
    });

    it('Should encrypt and verify Hash correctly integrating Core Library to HTTP', async () => {
        const payload = "minhaSenhaUltraSecreta88";

        // 1. Fase de Encriptação POST
        const encryptResponse = await request(app.server)
            .post('/encrypt')
            .send({ message: payload });

        expect(encryptResponse.status).toBe(200);
        expect(encryptResponse.body.encrypted).toContain(":"); // Salt separator

        const scryptHash = encryptResponse.body.encrypted;

        // 2. Fase de Verificação /decrypt (Lá é TimingSafeEqual)
        const verifyTrueRes = await request(app.server)
            .post('/decrypt')
            .send({ encrypted: scryptHash, originalQuery: payload });

        expect(verifyTrueRes.status).toBe(200);
        expect(verifyTrueRes.body.success).toBe(true);
        expect(verifyTrueRes.body.decrypted).toBe(payload);

        // 3. Deve dar falha com payload errado
        const verifyFalseRes = await request(app.server)
            .post('/decrypt')
            .send({ encrypted: scryptHash, originalQuery: "SenhaIncorreta" });

        expect(verifyFalseRes.status).toBe(200);
        expect(verifyFalseRes.body.success).toBe(false);
        expect(verifyFalseRes.body.decrypted).toBe("FAILED");
    });
});
