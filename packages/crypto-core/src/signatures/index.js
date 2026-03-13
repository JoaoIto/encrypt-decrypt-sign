import { createSign, createVerify } from "crypto";

/**
 * Assina digitalmente um documento (string) usando Chave Privada
 * @param {string} document O conteúdo do documento a ser assinado.
 * @param {string} privateKeyPem Chave privada no formato PEM.
 * @returns {string} Assinatura resultante em Hexadecimal.
 */
export function signDocument(document, privateKeyPem) {
    const signer = createSign('SHA256');
    signer.update(document);
    signer.end();
    return signer.sign(privateKeyPem, 'hex');
}

/**
 * Verifica se a assinatura de um documento é válida usando a Chave Pública
 * @param {string} document O conteúdo original do documento.
 * @param {string} signatureHex A assinatura recebida em Hexadecimal.
 * @param {string} publicKeyPem A chave pública do suposto emissor em PEM.
 * @returns {boolean} Verdadeiro se a assinatura for autêntica e íntegra.
 */
export function verifySignature(document, signatureHex, publicKeyPem) {
    const verifier = createVerify('SHA256');
    verifier.update(document);
    verifier.end();
    return verifier.verify(publicKeyPem, signatureHex, 'hex');
}
