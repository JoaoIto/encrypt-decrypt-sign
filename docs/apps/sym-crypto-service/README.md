# 🔒 \`sym-crypto-service\` (Symmetric AES VM)

> **Máquina Virtual (Microsilagem Node/Fastify)** totalmente auto-contida, encarregada de simular um servidor capaz de lidar com requisições intensivas de criptografia baseada em **AES-256**.

## 📌 Arquitetura e Propósito
Este app se enquadra na subpasta \`apps/\` por ser um cliente (Consumidor). Ele consome o pacote genérico \`crypto-core\` e o estende para a Web via Framework HTTP nativo ultra-rápido: o \`Fastify\`.

Sua função no monorepo é interagir como a Máquina Virtual de Segurança. Ele gera uma "Sessão" global em memória e trata as entradas POST.

---

## 🚀 Rotas do Painel

A aplicação sobe, por padrão na porta \`3003\`.

### 1. \`GET /\` (HealthCheck)
Retorna instantaneamente um status `200` provando que processador e evento-loop do node estão normais. Usado pelo `wait-on` do \`Dashboard Web\` para sinalizar liberação do tráfego.

### 2. \`POST /encrypt\`
Ponto de entrada do Tráfego. O Transmissor da nossa UI gráfica acerta esse ponto cego com o Payload \`({ message })\`.

O Servidor imediatamente reage:
1. Puxando `generateSymmetricKeyAndIV()` da core-lib.
2. Salvando os tokens simétricos na "Sessão" da VM.
3. Retornando a cifra incompreensível.

### 3. \`POST /decrypt\`
Simula o estágio em que o tráfego chegou ao recipiente ou deve ser validado.
O Servidor recebe \`({ encrypted })\` e usa as chaves da Sessão para restaurar matematicamente o item ao texto puro usando `crypto-core > decryptSymmetric`.

### 4. \`GET /logs\` (A Telemetria Interna)
**Diferencial de Arquitetura**: Processosos node `child_process` muitas vezes rodam em tela preta para o usuário. Injetamos isso:

\`\`\`javascript
fastify.get('/logs', async (request, reply) => {
    return { logs: logsHistory };
});
\`\`\`
Toda ação de Cifra manda um ping ao módulo \`logger\`, que é importado aqui. O dashboard visual faz Pulling constante dessa rota, pintando as linhas de comando como num terminal. Puxando a cortina de ferro dos micro-serviços.
