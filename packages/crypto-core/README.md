# 🧠 \`crypto-core\` (Core Library)

> **Pacote Monorepo Oficial `(@workspace/crypto-core)`** responsável por abstrair, de forma Agnóstica à API, toda a inteligência e complexidade matemática da Segurança da Informação.

## 📌 Escopo e Arquitetura do Pacote
Este pacote foi desenhado para ser **livre de dependências externas sujas**. Ele utiliza apenas o módulo nativo `crypto` do C++/Node.js. Essa decisão arquitetural garante que a lógia matriz seja publicável no NPM amanhã, podendo rodar em CLI, Backend, Scripts ou Serveless, sem arrastar Frameworks HTTP (ex: Express/Fastify) de arrasto.

## 🛠️ Métodos Exportados (API Reference)

### 1. Criptografia Simétrica (AES-256-CBC)
AES-256 é o padrão ouro estabelecido pelo NIST. Utilizamos o modo CBC (Cipher Block Chaining) por exigir um Vetor de Inicialização (IV), tornando ataques de replay quase impossíveis.

\`\`\`javascript
import { generateSymmetricKeyAndIV, encryptSymmetric, decryptSymmetric } from 'crypto-core';

// 1. O Sistema (Ou o Acordo Diffie-Hellman) gera a chave e o Vetor:
const { key, iv } = generateSymmetricKeyAndIV();

// 2. Transmissor sela a mensagem:
const cipherHex = encryptSymmetric("Meu Segredo", key, iv);

// 3. Receptor reverte usando as MESMAS credenciais:
const textoPuro = decryptSymmetric(cipherHex, key, iv);
\`\`\`

### 2. Criptografia Assimétrica (RSA 2048-bit)
Implementa a arquitetura PKI clássica (Infraestrutura de Chaves Públicas). A chave pública encripta (Tranca o cofre); somente a Chave Privada desencripta (Abre o cofre).

\`\`\`javascript
import { generateAsymmetricKeyPair, encryptAsymmetric, decryptAsymmetric } from 'crypto-core';

// 1. Receptor gera seu par de chaves e envia a 'Publica' ao transmissor.
const { privateKey, publicKey } = generateAsymmetricKeyPair();

// 2. Transmissor usa a Pública do Receptor para ofuscar o payload:
const cipherHex = encryptAsymmetric("Acesso Root: senh@123", publicKey);

// 3. Receptor é o *único* na rede mundial capaz de revelar com a sua Privada:
const textoPuro = decryptAsymmetric(cipherHex, privateKey);
\`\`\`

### 3. Função Hashing e Salting (Scrypt)
Ao contrário do SHA-256 clássico (que é rápido e suscetível à força-bruta por hardware ASIC), escolhemos o \`scrypt\`. Ele é custoso computacionalmente (Intencional) e injetamos Random Bytes (**Salts**) para derrubar Rainbow Tables.

\`\`\`javascript
import { hashPassword, verifyPassword } from 'crypto-core';

// Durante o Cadastro de Cliente / Geração de Token (Vai pro Banco de Dados):
// Retorna formato =>  "Sorte(salt16bytes) : HashScrypt(64bytes)"
const dbTuple = hashPassword("MinhaSenhaForte");

// Durante Login (Validando que o Hash gravado bate com a tentativa nova):
const isCorrect = verifyPassword("MinhaSenhaForte", dbTuple); // -> true
\`\`\`

### 4. Cifra de Substituição (Caesar Cipher)
Implementação puramente didática e com valor histórico. Modifica a string byte a byte manipulando o CharCode ASCII e o \`shift\`. **NUNCA DEVE SER USADO COMERCIALMENTE.**

\`\`\`javascript
import { encryptCaesar, decryptCaesar } from 'crypto-core';

const cifra = encryptCaesar("ABC", 4); // "EFG"
const limpo = decryptCaesar(cifra, 4); // "ABC"
\`\`\`
