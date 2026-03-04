import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/index.js';

describe('Asymmetric Crypto VM - API Integration Tests', () => {
    beforeAll(async () => {
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    it('Should share the Public Key route perfectly', async () => {
        const response = await request(app.server).get('/public-key');
        expect(response.status).toBe(200);
        expect(response.body.publicKey).toContain("BEGIN PUBLIC KEY");
    });

    it('Should encrypt and decrypt End-to-End via POST /encrypt and POST /decrypt', async () => {
        const payload = "Top secret credentials: X12Y4";

        const encryptResponse = await request(app.server)
            .post('/encrypt')
            .send({ message: payload });

        expect(encryptResponse.status).toBe(200);
        const { encrypted } = encryptResponse.body;

        // Cifra Hex não pode conter trecho descritível da mensagem
        expect(encrypted).not.toContain("Top secret");

        const decryptRes = await request(app.server)
            .post('/decrypt')
            .send({ encrypted });

        expect(decryptRes.status).toBe(200);
        // Tem que recuperar integralmente o UTF-8 usando a Private Key que a API esconde em RAM
        expect(decryptRes.body.decrypted).toBe(payload);
    });
});
