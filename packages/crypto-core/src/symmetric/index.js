import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

export function generateSymmetricKeyAndIV() {
    return {
        key: randomBytes(32).toString('hex'), // 256 bits
        iv: randomBytes(16).toString('hex')   // 128 bits
    };
}

export function encryptSymmetric(message, keyHex, ivHex) {
    const keyBuffer = Buffer.from(keyHex, 'hex');
    const ivBuffer = Buffer.from(ivHex, 'hex');
    const cipher = createCipheriv('aes-256-cbc', keyBuffer, ivBuffer);

    let encrypted = cipher.update(message, "utf-8", "hex");
    encrypted += cipher.final('hex');
    return encrypted;
}

export function decryptSymmetric(encryptedHex, keyHex, ivHex) {
    const keyBuffer = Buffer.from(keyHex, 'hex');
    const ivBuffer = Buffer.from(ivHex, 'hex');
    const decipher = createDecipheriv('aes-256-cbc', keyBuffer, ivBuffer);

    let decrypted = decipher.update(encryptedHex, "hex", "utf-8");
    decrypted += decipher.final("utf-8");
    return decrypted;
}
