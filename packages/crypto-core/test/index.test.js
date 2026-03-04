import { describe, it, expect } from 'vitest';
import {
    encryptCaesar, decryptCaesar,
    generateSymmetricKeyAndIV, encryptSymmetric, decryptSymmetric,
    generateAsymmetricKeyPair, encryptAsymmetric, decryptAsymmetric,
    hashPassword, verifyPassword
} from '../src/index.js';

describe('Crypto Core Library', () => {

    // 1. Caesar Cipher
    it('Should encrypt and decrypt using Caesar correctly', () => {
        const original = "HELLO";
        const encrypted = encryptCaesar(original, 4);
        expect(encrypted).not.toBe(original);

        const decrypted = decryptCaesar(encrypted, 4);
        expect(decrypted).toBe(original);
    });

    // 2. Symmetric AES
    it('Should encrypt and decrypt using AES-256 Symmetric keys', () => {
        const originalPayload = "Super Segredo de Estado XYZ";
        const { key, iv } = generateSymmetricKeyAndIV();

        expect(key.length).toBe(64); // 32 bytes hex length
        expect(iv.length).toBe(32);  // 16 bytes hex length

        const ciphertext = encryptSymmetric(originalPayload, key, iv);
        expect(ciphertext).not.toContain(originalPayload);

        const plaintext = decryptSymmetric(ciphertext, key, iv);
        expect(plaintext).toBe(originalPayload);
    });

    // 3. Asymmetric RSA
    it('Should encrypt with Public Key and decrypt with Private Key using RSA', () => {
        const originalSecret = "Top Secret Asymmetric Payload";
        const { privateKey, publicKey } = generateAsymmetricKeyPair();

        expect(publicKey).toContain("BEGIN PUBLIC KEY");
        expect(privateKey).toContain("BEGIN PRIVATE KEY");

        const encryptedData = encryptAsymmetric(originalSecret, publicKey);
        expect(encryptedData).not.toContain(originalSecret);

        const decryptedData = decryptAsymmetric(encryptedData, privateKey);
        expect(decryptedData).toBe(originalSecret);
    });

    // 4. Hashing (Scrypt + Salt)
    it('Should securely Hash and Verify passwords one-way without decryption possibility', () => {
        const pass = "Kk123456@!";
        const storedHash = hashPassword(pass);

        expect(storedHash).toContain(":"); // Checks if salt and hash are paired

        const isCorrect = verifyPassword(pass, storedHash);
        expect(isCorrect).toBe(true);

        const isIncorrect = verifyPassword("WrongPassword!", storedHash);
        expect(isIncorrect).toBe(false);
    });

});
