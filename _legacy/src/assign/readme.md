# Assinatura digital:

Trabalharemos agora em código de entender assinatura digital, com que basicamente usaremos o mesmo conceito de chave pública e chave privada que foi citado anteriormente em encirptação assimétrica.

Quando temos um documento, e queremos assiná-lo digitalmente, **somente fizemos com que adicionamos uma hash de chave privada para assinar um documento que queremos oficioalizar**. E assim logo depois, podemos **usar a chave pública de acesso a todos, para que possamos verificar**, caso seja falso!

---

## Código: 

Usando a mesma lógica das chaves privadas e chaves públicas, usaremos ela diferentemente para cada função dentro do código.

```js
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
```

---