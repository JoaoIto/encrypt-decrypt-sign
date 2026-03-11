import { generateKeyPairSync, publicEncrypt, privateDecrypt } from "crypto";

export function generateAsymmetricKeyPair() {
    const { privateKey, publicKey } = generateKeyPairSync("rsa", {
        modulusLength: 2048,
        publicKeyEncoding: { type: "spki", format: "pem" },
        privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });
    return { privateKey, publicKey };
}

export function encryptAsymmetric(message, publicKeyPem) {
    const encryptedBuffer = publicEncrypt(publicKeyPem, Buffer.from(message));
    return encryptedBuffer.toString('hex');
}

export function decryptAsymmetric(encryptedHex, privateKeyPem) {
    const decryptedBuffer = privateDecrypt(privateKeyPem, Buffer.from(encryptedHex, 'hex'));
    return decryptedBuffer.toString('utf-8');
}
