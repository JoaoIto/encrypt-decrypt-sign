# 🛡️ \`hash-service\` (Hash & Scrypt VM)

> **Máquina Virtual** de autenticação e Hashing unilateral segura utilizando Salt nativo aleatório.

## 📌 Arquitetura e Propósito
Diferente das outras VMs, o Hashing não tem "volta" teórica. É um sistema unidirecional utilitário (O que o faz ser usado em Verificações de Senha do Banco de Dados ou em Assinaturas Digitais que certificam que o pacote não foi adulterado - MITM).

Roda nativamente sob a Porta **3002**.

---

## 🚀 Rotas da Aplicação

### 1. \`POST /encrypt\` (Gerando o Cofre/Assinatura)
Nós estendemos o Core exportado em \`crypto-core > hashPassword()\` sob uma RestAPI. A máquina reage recebendo o Payload e enviando ao motor Scrypt. O motor é forçado com 64 bites de salt e um Key Length de peso. O retorno exportado ao Client será a \`cifra completa\`, ex: \`SALT:HASH_SCRYPT_HEX\`.

### 2. \`POST /decrypt\` (A Verificação)
É aqui que a documentação avisa ao desenvolvedor: **Hashs não podem ser Decriptados**.
Entretanto, o Next.js Web chama o caminho de volta `/decrypt` pois abstraímos como a "Recepção".

No código:

\`\`\`javascript
// Decrypt é impossível, nós VERIFICAMOS:
const isValid = verifyPassword(originalQuery, encrypted);

return {
    encrypted,
    decrypted: isValid ? originalQuery : "FAILED", 
    success: isValid
};
\`\`\`

A VM executa um \`timingSafeEqual()\` nativo importado do Node. Essa função é crítica. Evita ataques hackers onde o hacker analisa milissegundos de falha da CPU testando senhas, garantindo a mesma latência constante se acertou a validação de salting and hashing. O dashboard vai printar **Falha/Failed** ou re-envelopar e abrir com Sucesso na UI.
