# asymetricScript

***Asymetric Script*** é um tipo de script em que é baseado em tipos de chave de encriptação de desencriptação. Na qual temos 2 tipos de chaves:

- ***Chave pública:*** Uma chave que é compartilhada livremente na rede usada para encriptografar a informação. Já que sua função é só essa, não existe muito perigo para compartilhar esta chave nessa rede.

- ***Chave privada:*** A chave privada que faz a função mais perigisa, que usa para desincriptografar a informação principal!

---

## Código: 

Usaremos a função de gerar e descriptografar cada tipo de chave que escrevemos, (pública e privada).

- Documentação funções de cypto: ***[generateKeyPairSync, publicEncrypt, privateDecrypt } from "crypto";](https://nodejs.org/api/crypto.html)***

Em resumo, esse código gera um par de chaves RSA com uma chave privada e uma chave pública, codificadas em formato PEM, usando tamanhos seguros de chave. Essas chaves podem ser usadas para criptografia, assinatura digital ou outros fins relacionados à criptografia assimétrica.
Este código exporta duas constantes, privateKey e publicKey, que são desestruturadas do resultado da função generateKeyPairSync("rsa", options). Vamos analisar o código passo a passo:

-  A função ***``generateKeyPairSync``*** é chamada com dois argumentos: ***"rsa"*** e ***um objeto options***. Essa função é usada para gerar um par de chaves assimétricas (chave privada e chave pública) de acordo com o algoritmo RSA.

O objeto options contém as configurações para a geração das chaves:

1. ***``modulusLength``*** **define o tamanho do módulo em bits.** Neste caso, é definido como 2048, o que é um tamanho seguro para a maioria dos casos.


1. ***``publicKeyEncoding``*** **define as opções para codificar a chave pública gerada**. Neste caso, está configurado para usar o formato "pem" (Privacy-Enhanced Mail) e o tipo "spki" (SubjectPublicKeyInfo).


3. ***``privateKeyEncoding``*** define as opções para codificar a chave privada gerada. Neste caso, está configurado para usar o formato "pem" e o tipo "pkcs8" (Private-Key Cryptography Standards #8).

O resultado da função ***``generateKeyPairSync``*** **é um objeto que contém as chaves geradas**, codificadas de acordo com as opções fornecidas.



```js
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
```

---
