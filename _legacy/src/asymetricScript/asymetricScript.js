import { generateKeyPairSync, publicEncrypt, privateDecrypt } from "crypto";

export const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,

  publicKeyEncoding: {
    type: "spki",
    format: "pem",
  },
  privateKeyEncoding: {
    type: "pkcs8",
    format: "pem",
  },
});

const criptoDates = publicEncrypt(
    publicKey, 
    Buffer.from("Mensagem secreta: ")
)

export const criptoDatesString = criptoDates.toString('hex')

const msgDescrypt = privateDecrypt(
    privateKey, 
    criptoDates
)

export const msgDescryptString = msgDescrypt.toString('utf-8');