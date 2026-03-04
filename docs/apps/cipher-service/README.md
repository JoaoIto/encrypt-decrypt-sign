# 🏛️ \`cipher-service\` (Caesar Cipher Virtual Machine)

> **Serviço Didático** - Máquina Virtual (Microsilagem Fastify) responsável por executar cálculos e roteamento do primeiro de todos os algoritmos criptográficos historicamente documentados: A **Cifra de César**.

## 📌 Arquitetura e Propósito
Este serviço destoa dos outros por não lidar com os algoritmos blindados atuais de rede. O objetivo de vida desta máquina Fastify é puro e didático: Mostrar para o usuário novato da arquitetura em Monorepo o que a criptografia, na essência abstrata inicial, verdadeiramente é. Roteamentos paralelos.

Roda nativamente sob a Porta **3001**.

---

## 🚀 Rotas da Aplicação

### 1. \`POST /encrypt\`
O texto original passa por substituições em Byte ASCII (char codes strings) onde cada pino da letra se desloca \`N\` pinos para frente (Exemplo \`N = 4\`, como exportado no módulo \`encryptCaesar\` de dentro do pacote raiz do Core \`packages/crypto-core\`).

Assim sendo, \`A\` roda e vira \`E\`. Retorna o Texto transmutado em Strings ilegíveis humanamente de primeira visada.

### 2. \`POST /decrypt\`
Recebe as strings manipuladas artificialmente. Puxa do core genérico o método de via paralela paralela reverso \`decryptCaesar\` e desloca \`N\` pinos para **trás**. Retornando então a legibilidade originária.
Custo O(n) baseado nos loops.

### 3. \`GET /logs\`
Disponibiliza histórico de requisições de quem bate em /encrypt e /decrypt para os Observadores Remotos do Ecossistema visual Web via short-pulling, atochando essas requisições como Array de Strings na interface.
