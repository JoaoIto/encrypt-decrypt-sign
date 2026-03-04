import { generateKeyPairSync, createSign, createVerify } from "crypto";

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

let date = "Joao";
const assignUser = createSign('rsa-sha256');

assignUser.update(date);

const assign = assignUser.sign(privateKey, "hex");

console.log(assign);

const verify = createVerify("rsa-sha256");

verify.update(date);

const verifyIsTrue = verify.verify(publicKey, assign, "hex");
console.log(verifyIsTrue);