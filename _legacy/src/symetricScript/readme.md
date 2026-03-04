# Usando mais módulos para criptografia cimétrica

Neste arquivo de código, iremos implementar uma nova forma de criptografia, sendo a criptografica cimétrica.

## Criptografia cimétrica: 

Entendendo como fizemos no hash, criptografamos a mensagem e assim utilizamos ela já diretamente para a autenticação possível. O problema é que, quando geramos esta criptografia, esta mensagem é perdida, já que é gerada e não pode mais ser descriptografada, ou seja, irreversível.

A criptografia simétrica **é um método de criptografia em que a mesma chave é usada tanto para criptografar quanto para descriptografar os dados.** Também conhecida como ***criptografia de chave única***, é um dos tipos mais comuns de criptografia.

A criptografia simétrica é amplamente utilizada em diversas aplicações, incluindo:

- Comunicação segura: É usada para proteger a confidencialidade dos dados durante a transferência de informações sensíveis, como senhas, números de cartão de crédito e mensagens em aplicativos de mensagens seguras.

- Armazenamento de dados: É usada para proteger arquivos e bancos de dados armazenados localmente ou em servidores, garantindo que apenas as pessoas com a chave adequada possam acessar os dados.

- Criptografia de disco: É usada para criptografar discos rígidos ou partições inteiras, protegendo os dados em caso de roubo ou acesso não autorizado.

---

## Exemplo base de código: 

Este trecho de código em JavaScript utiliza a biblioteca nativa 'crypto' para criptografar uma mensagem usando o algoritmo AES-256.

Importando as funções ***``createCipheriv()``***, ***``randomBytes()``*** e ***``createDecipheriv()``*** do módulo crypto. Essas funções são utilizadas para ***
criar cifras, gerar bytes aleatórios e criar decifras, respectivamente.***

```js
const msg = "Crypt message cyphger";
```

Define a mensagem que será criptografada.


```js
const key = randomBytes(32);
```

Gera uma chave de criptografia aleatória de 32 bytes (256 bits) usando a função randomBytes do módulo crypto.

```js
const vi = randomBytes(16);
```

Gera um vetor de inicialização (IV) aleatório de 16 bytes para ser usado no processo de criptografia.

```js
const cifra = createCipheriv('aes256', key, vi);
```

Cria uma instância de cifra usando o algoritmo AES-256 (chamado de 'aes256' no Node.js) com a chave e o vetor de inicialização fornecidos. Essa cifra será usada para criptografar a mensagem.

```js
export const cypherMsg = cifra.update(msg, "utf-8", "hex") + cifra.final('hex');
```

Criptografa a mensagem fornecida usando a cifra criada. A função update é chamada com três argumentos: a mensagem a ser criptografada, a codificação da mensagem (UTF-8) e a codificação do resultado (hexadecimal). 

Em seguida, a função final é chamada com a codificação do resultado (hexadecimal) para obter a parte final da mensagem criptografada. 

O resultado final é uma string hexadecimal que representa a mensagem criptografada.

```js
import { createCipheriv, randomBytes, createDecipheriv }from 'crypto';

const msg = "Crypt message cyphger";
const key = randomBytes(32);
const vi = randomBytes(16);

const cifra = createCipheriv('aes256', key, vi);
export const cypherMsg = cifra.update(msg, "utf-8", "hex") + cifra.final('hex');

```

---

## Descriptografando

Usando ainda o módulo de importação crypto, usaremos a função de ***`createDecypheriv()`*** para formar um decifrador através de aes256.

```js
const descrypt = createDecipheriv('aes256', key, vi);

export const msgDescrypt =
  descrypt.update(cypherMsg, "hex", "utf-8") + descrypt.final("utf-8");

```

---